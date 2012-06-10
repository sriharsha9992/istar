#!/usr/bin/env node

var cluster = require('cluster');
if (cluster.isMaster) {
  // Parse 16_prop_slice_ss.xls
  var fs = require('fs');
  var carrier = require('carrier');
  var max_ligands = 12171187;
  var mwt = new Array(max_ligands);
  var logp = new Array(max_ligands);
  var nrb = new Array(max_ligands);
  var hbd = new Array(max_ligands);
  var hba = new Array(max_ligands);
  var charge = new Array(max_ligands);
  var ad = new Array(max_ligands);
  var pd = new Array(max_ligands);
  var tpsa = new Array(max_ligands);
  var num_ligands = 0;
  var carr = carrier.carry(fs.createReadStream('16_prop_slice_ss.xls'));
  carr.on('line', function(line) {
	if (line[0] == 'S') return; // Filter out header line
	var t2 = line.indexOf('\t', 10);
	var t3 = line.indexOf('\t', t2 + 2);
	var t4 = line.indexOf('\t', t3 + 2);
	var t5 = line.indexOf('\t', t4 + 2);
	var t6 = line.indexOf('\t', t5 + 2);
	var t7 = line.indexOf('\t', t6 + 2);
	var t8 = line.indexOf('\t', t7 + 2);
	var t9 = line.indexOf('\t', t8 + 2);
	var t10 = line.indexOf('\t', t9 + 2);
	mwt[num_ligands] = parseFloat(line.substr(t2 + 1, t3 - t2 - 1));
	logp[num_ligands] = parseFloat(line.substr(t3 + 1, t4 - t3 - 1));
	ad[num_ligands] = parseFloat(line.substr(t4 + 1, t5 - t4 - 1));
	pd[num_ligands] = parseFloat(line.substr(t5 + 1, t6 - t5 - 1));
	hbd[num_ligands] = parseInt(line.substr(t6 + 1, t7 - t6 - 1));
	hba[num_ligands] = parseInt(line.substr(t7 + 1, t8 - t7 - 1));
	tpsa[num_ligands] = parseFloat(line.substr(t8 + 1, t9 - t8 - 1));
	charge[num_ligands] = parseInt(line.substr(t9 + 1, t10 - t9 - 1));
	nrb[num_ligands] = parseInt(line.substr(t10 + 1));
	++num_ligands;
  });
  carr.on('end', function() {
    // Fork child processes with cluster
    var numCPUs = require('os').cpus().length;
    for (var i = 0; i < numCPUs; i++) {
      var worker = cluster.fork();
      worker.on('message', function(msg) {
        if (msg.query == 'ligands') {
          var count = 0;
          for (var i = 0; i < num_ligands; ++i)
          {
            if ((msg.mwt_lb <= mwt[i]) && (mwt[i] <= msg.mwt_ub) && (msg.logp_lb <= logp[i]) && (logp[i] <= msg.logp_ub) && (msg.nrb_lb <= nrb[i]) && (nrb[i] <= msg.nrb_ub) && (msg.hbd_lb <= hbd[i]) && (hbd[i] <= msg.hbd_ub) && (msg.hba_lb <= hba[i]) && (hba[i] <= msg.hba_ub) && (msg.charge_lb <= charge[i]) && (charge[i] <= msg.charge_ub) && (msg.ad_lb <= ad[i]) && (ad[i] <= msg.ad_ub) && (msg.pd_lb <= pd[i]) && (pd[i] <= msg.pd_ub) && (msg.tpsa_lb <= tpsa[i]) && (tpsa[i] <= msg.tpsa_ub)) ++count;
          }
          this.send({ligands: count});
        }
      });	
    }
    cluster.on('death', function(worker) {
      console.log('Worker process ' + worker.pid + ' died. restart...');
      cluster.fork();
    });
  });
} else {
  // Configure express server
  var express = require('express'),
      app = express.createServer();
  app.configure(function(){
    app.use(express.bodyParser());
    app.use(app.router);
  });
  app.configure('development', function(){
    app.use(express.static(__dirname + '/public'));
    app.use(express.favicon(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });
  app.configure('production', function(){
    var oneYear = 31557600000; // 1000 * 60 * 60 * 24 * 365.25
    app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
    app.use(express.favicon(__dirname + '/public', { maxAge: oneYear }));
    app.use(express.errorHandler());
  });

  // Configure routes
  var job = require('./job');
  app.post('/jobs', function(req, res) {
    job.create({
      center_x: req.param('center_x'),
      center_y: req.param('center_y'),
      center_z: req.param('center_z'),
      size_x: req.param('size_x'),
      size_y: req.param('size_y'),
      size_z: req.param('size_z'),
      description: req.param('description'),
      email: req.param('email')
    }, req.param('receptor'), function(err) {
      res.json(err);
    }, function(_id) {
      res.json({ _id: _id });
    });
  });
  var ligands;
  function wait(cb) {
    if (ligands == -1) process.nextTick(function () {
	  wait(cb);
	});
	else cb();
  };
  process.on('message', function(msg) {
    if (msg.ligands !== undefined) {
	  ligands = msg.ligands;
    }
  });
  app.get('/ligands', function(req, res) {
    // Validate req.param('mwt_lb')
    ligands = -1;
    process.send({query: 'ligands', mwt_lb: 400, mwt_ub: 500});
	wait(function () {
	  res.json(ligands);
	});
  });

  // Start listening
  var port = 3000;
  app.listen(port);
  console.log('Worker %d running express server listening on port %d in %s mode', process.env.NODE_WORKER_ID, port, app.settings.env);
}
