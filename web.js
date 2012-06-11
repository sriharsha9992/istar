#!/usr/bin/env node

var cluster = require('cluster');
if (cluster.isMaster) {
  // Allocate arrays to hold ligand properties
  var num_ligands = 12171187;
  console.log('Allocating %d ligands', num_ligands);
  var mwt = new Array(num_ligands);
  var logp = new Array(num_ligands);
  var nrb = new Array(num_ligands);
  var hbd = new Array(num_ligands);
  var hba = new Array(num_ligands);
  var charge = new Array(num_ligands);
  var ad = new Array(num_ligands);
  var pd = new Array(num_ligands);
  var tpsa = new Array(num_ligands);
  // Parse ligand properties
  var prop = '16_prop.tsv';
  console.log('Parsing %s', prop);
  var it = 0;
  var carrier = require('carrier').carry(require('fs').createReadStream(prop));
  carrier.on('line', function(line) {
    var t1 = line.indexOf('\t', 3);
    var t2 = line.indexOf('\t', t1 + 5);
    var t3 = line.indexOf('\t', t2 + 2);
    var t4 = line.indexOf('\t', t3 + 2);
    var t5 = line.indexOf('\t', t4 + 2);
    var t6 = line.indexOf('\t', t5 + 2);
    var t7 = line.indexOf('\t', t6 + 2);
    var t8 = line.indexOf('\t', t7 + 2);
    mwt[it] = parseFloat(line.substr(0, t1));
    logp[it] = parseFloat(line.substr(t1 + 1, t2 - t1 - 1));
    ad[it] = parseFloat(line.substr(t2 + 1, t3 - t2 - 1));
    pd[it] = parseFloat(line.substr(t3 + 1, t4 - t3 - 1));
    hbd[it] = parseInt(line.substr(t4 + 1, t5 - t4 - 1));
    hba[it] = parseInt(line.substr(t5 + 1, t6 - t5 - 1));
    tpsa[it] = parseFloat(line.substr(t6 + 1, t7 - t6 - 1));
    charge[it] = parseInt(line.substr(t7 + 1, t8 - t7 - 1));
    nrb[it++] = parseInt(line.substr(t8 + 1));
  });
  carrier.on('end', function() {
    console.log("Parsed %d ligands", it);
    // Fork worker processes with cluster
    var numCPUs = require('os').cpus().length;
    console.log('Forking %d worker processes', numCPUs);
    var msg = function(m) {
      if (m.query == 'ligands') {
        var ligands = 0;
        for (var i = 0; i < num_ligands; ++i)
        {
          if ((m.mwt_lb <= mwt[i]) && (mwt[i] <= m.mwt_ub) && (m.logp_lb <= logp[i]) && (logp[i] <= m.logp_ub) && (m.nrb_lb <= nrb[i]) && (nrb[i] <= m.nrb_ub) && (m.hbd_lb <= hbd[i]) && (hbd[i] <= m.hbd_ub) && (m.hba_lb <= hba[i]) && (hba[i] <= m.hba_ub) && (m.charge_lb <= charge[i]) && (charge[i] <= m.charge_ub) && (m.ad_lb <= ad[i]) && (ad[i] <= m.ad_ub) && (m.pd_lb <= pd[i]) && (pd[i] <= m.pd_ub) && (m.tpsa_lb <= tpsa[i]) && (tpsa[i] <= m.tpsa_ub)) ++ligands;
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
} else {
  // Configure express server
  var express = require('express'),
      app = express.createServer();
  app.configure(function(){
    app.use(express.bodyParser());
    app.use(require('express-validator'));
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
  var job = require('./job');
  function simplifyErrors(errors) {
    var errs = new Array(errors.length);
    errors.forEach(function (error, i) {
      errs[i] = error.msg;
    });
    return errs;
  }
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
  // Get jobs by email
  app.get('/jobs', function(req, res) {
    // Validate user input
    req.check('email', 'email must be valid').isEmail();
    var errors = req.validationErrors();
    if (errors) {
      res.json(simplifyErrors(errors));
      return;
    }
    var email = req.param('email');
    // Get jobs from MongoDB by email
  });
  // Post a new job
  app.post('/jobs', function(req, res) {
    // Validate and sanitize user input
    req.check('receptor', 'receptor must be provided').len(1, 10485760); // 10MB
    req.check('center_x', 'center_x must be a decimal').isDecimal();
    req.check('center_y', 'center_y must be a decimal').isDecimal();
    req.check('center_z', 'center_z must be a decimal').isDecimal();
    req.check('size_x', 'size_x must be within [1, 30]').isInt().min(1).max(30);
    req.check('size_y', 'size_y must be within [1, 30]').isInt().min(1).max(30);
    req.check('size_z', 'size_z must be within [1, 30]').isInt().min(1).max(30);
    req.check('description', 'description must be provided').len(1, 1000);
    req.check('email', 'email must be valid').isEmail();
    var errors = req.validationErrors();
    if (errors) {
      res.json(simplifyErrors(errors));
      return;
    }
    req.sanitize('receptor').xss();
    req.sanitize('center_x').toFloat();
    req.sanitize('center_y').toFloat();
    req.sanitize('center_z').toFloat();
    req.sanitize('size_x').toInt();
    req.sanitize('size_y').toInt();
    req.sanitize('size_z').toInt();
    req.sanitize('description').xss();
    // Save configurations into MongoDB and receptor into job folder.
    job.create({
      center_x: req.param('center_x'),
      center_y: req.param('center_y'),
      center_z: req.param('center_z'),
      size_x: req.param('size_x'),
      size_y: req.param('size_y'),
      size_z: req.param('size_z'),
      description: req.param('description'),
      email: req.param('email')
    }, req.param('receptor'));
  });
  // Get the number of ligands satisfying filtering conditions
  app.get('/ligands', function(req, res) {
    // Validate and sanitize user input
    req.check('mwt_lb', 'mwt_lb must be within [55, 566]').isDecimal().min(55).max(566);
    req.check('mwt_ub', 'mwt_ub must be within [55, 566]').isDecimal().min(55).max(566);
    req.check('logp_lb', 'logp_lb must be within [-6, 12]').isDecimal().min(-6).max(12);
    req.check('logp_ub', 'logp_ub must be within [-6, 12]').isDecimal().min(-6).max(12);
    req.check('nrb_lb', 'nrb_lb must be within [0, 34]').isInt().min(0).max(34);
    req.check('nrb_ub', 'nrb_ub must be within [0, 34]').isInt().min(0).max(34);
    req.check('hbd_lb', 'hbd_lb must be within [0, 20]').isInt().min(0).max(20);
    req.check('hbd_ub', 'hbd_ub must be within [0, 20]').isInt().min(0).max(20);
    req.check('hba_lb', 'hba_lb must be within [0, 18]').isInt().min(0).max(18);
    req.check('hba_ub', 'hba_ub must be within [0, 18]').isInt().min(0).max(18);
    req.check('charge_lb', 'charge_lb must be within [-5, 5]').isInt().min(-5).max(5);
    req.check('charge_ub', 'charge_ub must be within [-5, 5]').isInt().min(-5).max(5);
    req.check('ad_lb', 'ad_lb must be within [-25, 29]').isDecimal().min(-25).max(29);
    req.check('ad_ub', 'ad_ub must be within [-25, 29]').isDecimal().min(-25).max(29);
    req.check('pd_lb', 'pd_lb must be within [-504, 1]').isDecimal().min(-504).max(1);
    req.check('pd_ub', 'pd_ub must be within [-504, 1]').isDecimal().min(-504).max(1);
    req.check('tpsa_lb', 'tpsa_lb must be within [0, 317]').isDecimal().min(0).max(317);
    req.check('tpsa_ub', 'tpsa_ub must be within [0, 317]').isDecimal().min(0).max(317);
    var errors = req.validationErrors();
    if (errors) {
      res.json(simplifyErrors(errors));
      return;
    }
    req.sanitize('mwt_lb').toFloat();
    req.sanitize('mwt_ub').toFloat();
    req.sanitize('logp_lb').toFloat();
    req.sanitize('logp_ub').toFloat();
    req.sanitize('nrb_lb').toInt();
    req.sanitize('nrb_ub').toInt();
    req.sanitize('hbd_lb').toInt();
    req.sanitize('hbd_ub').toInt();
    req.sanitize('hba_lb').toInt();
    req.sanitize('hba_ub').toInt();
    req.sanitize('charge_lb').toInt();
    req.sanitize('charge_ub').toInt();
    req.sanitize('ad_lb').toFloat();
    req.sanitize('ad_ub').toFloat();
    req.sanitize('pd_lb').toFloat();
    req.sanitize('pd_ub').toFloat();
    req.sanitize('tpsa_lb').toFloat();
    req.sanitize('tpsa_ub').toFloat();
    // Send query to master process
    ligands = -1;
    process.send({query: 'ligands', mwt_lb: req.param('mwt_lb'), mwt_ub: req.param('mwt_ub'), logp_lb: req.param('logp_lb'), logp_ub: req.param('logp_ub'), nrb_lb: req.param('nrb_lb'), nrb_ub: req.param('nrb_ub'), hbd_lb: req.param('hbd_lb'), hbd_ub: req.param('hbd_ub'), hba_lb: req.param('hba_lb'), hba_ub: req.param('hba_ub'), charge_lb: req.param('charge_lb'), charge_ub: req.param('charge_ub'), ad_lb: req.param('ad_lb'), ad_ub: req.param('ad_ub'), pd_lb: req.param('pd_lb'), pd_ub: req.param('pd_ub'), tpsa_lb: req.param('tpsa_lb'), tpsa_ub: req.param('tpsa_ub')});
    sync(function () {
      res.json(ligands);
    });
  });
  // Start listening
  var port = 3000;
  app.listen(port);
  console.log('Worker process %d listening on port %d in %s mode', process.pid, port, app.settings.env);
}
