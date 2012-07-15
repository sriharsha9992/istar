#!/usr/bin/env node

var cluster = require('cluster');
if (cluster.isMaster) {
  // Allocate arrays to hold ligand properties
  var num_ligands = 12171187;
  var mwt = new Array(num_ligands);
  var logp = new Array(num_ligands);
  var ad = new Array(num_ligands);
  var pd = new Array(num_ligands);
  var hbd = new Array(num_ligands);
  var hba = new Array(num_ligands);
  var tpsa = new Array(num_ligands);
  var charge = new Array(num_ligands);
  var nrb = new Array(num_ligands);
  // Parse ligand properties
  var prop = 'idock/16_prop.bin.gz';
  console.log('Parsing %s', prop);
  var start = Date.now();
  require('fs').readFile(prop, function (err, data) {
    if (err) throw err;
    require('zlib').gunzip(data, function (err, buf) {
      if (err) throw err;
      for (i = 0, o = 0; i < num_ligands; ++i, o += 26) {
           mwt[i] = buf.readFloatLE(o +  0);
          logp[i] = buf.readFloatLE(o +  4);
            ad[i] = buf.readFloatLE(o +  8);
            pd[i] = buf.readFloatLE(o + 12);
           hbd[i] = buf.readInt16LE(o + 16);
           hba[i] = buf.readInt16LE(o + 18);
          tpsa[i] = buf.readInt16LE(o + 20);
        charge[i] = buf.readInt16LE(o + 22);
           nrb[i] = buf.readInt16LE(o + 24);
      }
      console.log('Parsed %d ligands within %d seconds', num_ligands, Date.now() - start);
      // Fork worker processes with cluster
      var numCPUs = require('os').cpus().length;
      console.log('Forking %d worker processes', numCPUs);
      var msg = function(m) {
        if (m.query == '/idock/ligands') {
          var ligands = 0;
          for (var i = 0; i < num_ligands; ++i)
          {
            if ((m.mwt_lb <= mwt[i]) && (mwt[i] <= m.mwt_ub) && (m.logp_lb <= logp[i]) && (logp[i] <= m.logp_ub) && (m.ad_lb <= ad[i]) && (ad[i] <= m.ad_ub) && (m.pd_lb <= pd[i]) && (pd[i] <= m.pd_ub) && (m.hbd_lb <= hbd[i]) && (hbd[i] <= m.hbd_ub) && (m.hba_lb <= hba[i]) && (hba[i] <= m.hba_ub) && (m.tpsa_lb <= tpsa[i]) && (tpsa[i] <= m.tpsa_ub) && (m.charge_lb <= charge[i]) && (charge[i] <= m.charge_ub) && (m.nrb_lb <= nrb[i]) && (nrb[i] <= m.nrb_ub)) ++ligands;
          }
          this.send({ligands: ligands});
        }
      }
      for (var i = 0; i < numCPUs; i++) {
        cluster.fork().on('message', msg);
      }
      cluster.on('death', function(worker) {
        console.log('Worker process %d died. Restarting...', worker.pid);
        cluster.fork().on('message', msg);
      });
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
  // Define helper variables and functions
  var validator = require('./validator');
  var v = new validator.Validator();
  var f = new validator.Filter();
  var idock = require('./idock');
  var igrep = require('./igrep');
  var ligands;
  function sync(cb) {
    if (ligands == -1) process.nextTick(function () {
      sync(cb);
    });
    else cb();
  };
  process.on('message', function(m) {
    if (m.ligands !== undefined) {
      ligands = m.ligands;
    }
  });
  // Get idock jobs by email
  app.get('/idock/jobs', function(req, res) {
    var err = idock.get(req.query, function (docs) {
      res.json(docs);
    });
    if (err !== undefined) {
      res.json(err);
    }
  });
  // Post a new idock job
  app.post('/idock/jobs', function(req, res) {
    res.json(idock.create(req.body));
  });
  // Get the number of ligands satisfying filtering conditions
  app.get('/idock/ligands', function(req, res) {
    // Validate and sanitize user input
    if (v.init(req.query)
     .chk('mwt_lb', 'must be a decimal within [55, 566]', true).isDecimal().min(55).max(566)
     .chk('mwt_ub', 'must be a decimal within [55, 566]', true).isDecimal().min(55).max(566)
     .chk('logp_lb', 'must be a decimal within [-6, 12]', true).isDecimal().min(-6).max(12)
     .chk('logp_ub', 'must be a decimal within [-6, 12]', true).isDecimal().min(-6).max(12)
     .chk('ad_lb', 'must be a decimal within [-25, 29]', true).isDecimal().min(-25).max(29)
     .chk('ad_ub', 'must be a decimal within [-25, 29]', true).isDecimal().min(-25).max(29)
     .chk('pd_lb', 'must be a decimal within [-504, 1]', true).isDecimal().min(-504).max(1)
     .chk('pd_ub', 'must be a decimal within [-504, 1]', true).isDecimal().min(-504).max(1)
     .chk('hbd_lb', 'must be an integer within [0, 20]', true).isInt().min(0).max(20)
     .chk('hbd_ub', 'must be an integer within [0, 20]', true).isInt().min(0).max(20)
     .chk('hba_lb', 'must be an integer within [0, 18]', true).isInt().min(0).max(18)
     .chk('hba_ub', 'must be an integer within [0, 18]', true).isInt().min(0).max(18)
     .chk('tpsa_lb', 'must be an integer within [0, 317]', true).isInt().min(0).max(317)
     .chk('tpsa_ub', 'must be an integer within [0, 317]', true).isInt().min(0).max(317)
     .chk('charge_lb', 'must be an integer within [-5, 5]', true).isInt().min(-5).max(5)
     .chk('charge_ub', 'must be an integer within [-5, 5]', true).isInt().min(-5).max(5)
     .chk('nrb_lb', 'must be an integer within [0, 34]', true).isInt().min(0).max(34)
     .chk('nrb_ub', 'must be an integer within [0, 34]', true).isInt().min(0).max(34)
     .failed()) {
      res.json(v.err);
      return
    }
    if (v.init(f.init(req.query)
     .snt('mwt_lb').toFloat()
     .snt('mwt_ub').toFloat()
     .snt('logp_lb').toFloat()
     .snt('logp_ub').toFloat()
     .snt('ad_lb').toFloat()
     .snt('ad_ub').toFloat()
     .snt('pd_lb').toFloat()
     .snt('pd_ub').toFloat()
     .snt('hbd_lb').toInt()
     .snt('hbd_ub').toInt()
     .snt('hba_lb').toInt()
     .snt('hba_ub').toInt()
     .snt('tpsa_lb').toInt()
     .snt('tpsa_ub').toInt()
     .snt('charge_lb').toInt()
     .snt('charge_ub').toInt()
     .snt('nrb_lb').toInt()
     .snt('nrb_ub').toInt()
     .res)
	 .rng('mwt_lb', 'mwt_ub')
	 .rng('logp_lb', 'logp_ub')
	 .rng('ad_lb', 'ad_ub')
	 .rng('pd_lb', 'pd_ub')
	 .rng('hbd_lb', 'hbd_ub')
	 .rng('hba_lb', 'hba_ub')
	 .rng('tpsa_lb', 'tpsa_ub')
	 .rng('charge_lb', 'charge_ub')
	 .rng('nrb_lb', 'nrb_ub')
     .failed()) {
      res.json(v.err);
      return
    }
    // Send query to master process
    ligands = -1;
    f.res.query = '/idock/ligands';
    process.send(f.res);
    sync(function () {
      res.json(ligands);
    });
  });
  // Get igrep jobs by email
  app.get('/igrep/jobs', function(req, res) {
    var err = igrep.get(req.query, function (docs) {
      res.json(docs);
    });
    if (err !== undefined) {
      res.json(err);
    }
  });
  // Post a new igrep job
  app.post('/igrep/jobs', function(req, res) {
    res.json(igrep.create(req.body));
  });
  // Start listening
  var port = 3000;
  app.listen(port);
  console.log('Worker process %d listening on port %d in %s mode', process.pid, port, app.settings.env);
}
