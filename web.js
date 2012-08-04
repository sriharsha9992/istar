#!/usr/bin/env node

var fs = require('fs'),
    cluster = require('cluster');
if (cluster.isMaster) {
  // Allocate arrays to hold ligand properties
  var num_ligands = 12171187,
      mwt = new Array(num_ligands),
      logp = new Array(num_ligands),
      ad = new Array(num_ligands),
      pd = new Array(num_ligands),
      hbd = new Array(num_ligands),
      hba = new Array(num_ligands),
      tpsa = new Array(num_ligands),
      charge = new Array(num_ligands),
      nrb = new Array(num_ligands);
  // Parse ligand properties
  var prop = 'idock/16_prop.bin.gz';
  console.log('Parsing %s', prop);
  var start = Date.now();
  fs.readFile(prop, function(err, data) {
    if (err) throw err;
    require('zlib').gunzip(data, function(err, buf) {
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
  // Connect to MongoDB
  var mongodb = require('mongodb');
  new mongodb.Db('istar', new mongodb.Server(process.argv[2], 27017)).open(function(err, db) {
    if (err) throw err;
    db.authenticate(process.argv[3], process.argv[4], function(err, authenticated) {
      if (err) throw err;
      var idock = db.collection('idock');
      var igrep = db.collection('igrep');
      // Configure express server
      var express = require('express');
      var app = express();
      app.configure(function() {
        app.use(express.bodyParser());
        app.use(app.router);
        app.use(function(req, res, next) {
          if (req.headers.host.match(/^idock.cse.cuhk.edu.hk/ig)) {
            return res.redirect(req.protocol + '://istar.cse.cuhk.edu.hk/idock' + req.url);
          }
          if (req.headers.host.match(/^[ai]grep.cse.cuhk.edu.hk/ig)) {
            return res.redirect(req.protocol + '://istar.cse.cuhk.edu.hk/igrep' + req.url);
          }
          if (req.headers['user-agent'] && req.headers['user-agent'].indexOf('MSIE') > -1 && /html?($|\?|#)/.test(req.url)) {
            res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
          }
          next();
        });
      });
      app.configure('development', function() {
        app.use(express.static(__dirname + '/public'));
        app.use(express.favicon(__dirname + '/public'));
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
      });
      app.configure('production', function() {
        var oneYear = 31557600000; // 1000 * 60 * 60 * 24 * 365.25
        app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
        app.use(express.static('/research/ksleung1/hjli/public', { maxAge: oneYear }));
        app.use(express.favicon(__dirname + '/public', { maxAge: oneYear }));
        app.use(express.errorHandler());
      });
      // Define helper variables and functions
      var validator = require('./validator');
      var v = new validator.Validator();
      var f = new validator.Filter();
      var ligands;
      function sync(callback) {
        if (ligands == -1) process.nextTick(function() {
          sync(callback);
        });
        else callback();
      };
      process.on('message', function(m) {
        if (m.ligands !== undefined) {
          ligands = m.ligands;
        }
      });
      // Get idock jobs by email
      app.get('/idock/jobs', function(req, res) {
        if (v.init(req.query)
         .chk('email', 'must be valid', true).isEmail()
         .failed()) {
          return res.json(v.err);
        }
        f.init(req.query)
         .snt('email').toLowerCase();
        idock.find(f.res, function(err, cursor) { // TODO: retrieve necessary fields only
          if (err) throw err;
          cursor.sort({'submitted': 1}).toArray(function(err, docs) {
            cursor.close();
            res.json(docs);
          });
        });
      });
      // Post a new idock job
      app.post('/idock/jobs', function(req, res) {
        if (v.init(req.body)
         .chk('email', 'must be valid', true).isEmail()
         .chk('receptor', 'must be provided', true).len(1, 10485760).regex(/^(ATOM.{26}(.{3}\d\.\d{3}){3}.{25}\n){1,9999}TER.{24}$/g) // 10MB
         .chk('center_x', 'must be a decimal within [-1000, 1000]', true).isDecimal().min(-1000).max(1000)
         .chk('center_y', 'must be a decimal within [-1000, 1000]', true).isDecimal().min(-1000).max(1000)
         .chk('center_z', 'must be a decimal within [-1000, 1000]', true).isDecimal().min(-1000).max(1000)
         .chk('size_x', 'must be an integer within [4, 30]', true).isInt().min(4).max(30)
         .chk('size_y', 'must be an integer within [4, 30]', true).isInt().min(4).max(30)
         .chk('size_z', 'must be an integer within [4, 30]', true).isInt().min(4).max(30)
         .chk('description', 'must be provided', true).len(1, 1000)
         .chk('mwt_lb', 'must be a decimal within [55, 566]', false).isDecimal().min(55).max(566)
         .chk('mwt_ub', 'must be a decimal within [55, 566]', false).isDecimal().min(55).max(566)
         .chk('logp_lb', 'must be a decimal within [-6, 12]', false).isDecimal().min(-6).max(12)
         .chk('logp_ub', 'must be a decimal within [-6, 12]', false).isDecimal().min(-6).max(12)
         .chk('ad_lb', 'must be a decimal within [-25, 29]', false).isDecimal().min(-25).max(29)
         .chk('ad_ub', 'must be a decimal within [-25, 29]', false).isDecimal().min(-25).max(29)
         .chk('pd_lb', 'must be a decimal within [-504, 1]', false).isDecimal().min(-504).max(1)
         .chk('pd_ub', 'must be a decimal within [-504, 1]', false).isDecimal().min(-504).max(1)
         .chk('hbd_lb', 'must be an integer within [0, 20]', false).isInt().min(0).max(20)
         .chk('hbd_ub', 'must be an integer within [0, 20]', false).isInt().min(0).max(20)
         .chk('hba_lb', 'must be an integer within [0, 18]', false).isInt().min(0).max(18)
         .chk('hba_ub', 'must be an integer within [0, 18]', false).isInt().min(0).max(18)
         .chk('tpsa_lb', 'must be an integer within [0, 317]', false).isInt().min(0).max(317)
         .chk('tpsa_ub', 'must be an integer within [0, 317]', false).isInt().min(0).max(317)
         .chk('charge_lb', 'must be an integer within [-5, 5]', false).isInt().min(-5).max(5)
         .chk('charge_ub', 'must be an integer within [-5, 5]', false).isInt().min(-5).max(5)
         .chk('nrb_lb', 'must be an integer within [0, 34]', false).isInt().min(0).max(34)
         .chk('nrb_ub', 'must be an integer within [0, 34]', false).isInt().min(0).max(34)
         .failed()) {
          return res.json(v.err);
        }
        if (v.init(f.init(req.body)
         .snt('email').toLowerCase()
         .snt('receptor').copy()
         .snt('center_x').toFloat()
         .snt('center_y').toFloat()
         .snt('center_z').toFloat()
         .snt('size_x').toInt()
         .snt('size_y').toInt()
         .snt('size_z').toInt()
         .snt('description').xss()
         .snt('mwt_lb', 400).toFloat()
         .snt('mwt_ub', 500).toFloat()
         .snt('logp_lb', 0).toFloat()
         .snt('logp_ub', 5).toFloat()
         .snt('ad_lb', 0).toFloat()
         .snt('ad_ub', 12).toFloat()
         .snt('pd_lb', -50).toFloat()
         .snt('pd_ub', 0).toFloat()
         .snt('hbd_lb', 2).toInt()
         .snt('hbd_ub', 5).toInt()
         .snt('hba_lb', 2).toInt()
         .snt('hba_ub', 10).toInt()
         .snt('tpsa_lb', 20).toInt()
         .snt('tpsa_ub', 100).toInt()
         .snt('charge_lb', 0).toInt()
         .snt('charge_ub', 0).toInt()
         .snt('nrb_lb', 2).toInt()
         .snt('nrb_ub', 8).toInt()
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
          return res.json(v.err);
        }
        // Send query to master process
        ligands = -1;
        process.send({
          query: '/idock/ligands',
          mwt_lb: f.res.mwt_lb,
          mwt_ub: f.res.mwt_ub,
          logp_lb: f.res.logp_lb,
          logp_ub: f.res.logp_ub,
          ad_lb: f.res.ad_lb,
          ad_ub: f.res.ad_ub,
          pd_lb: f.res.pd_lb,
          pd_ub: f.res.pd_ub,
          hbd_lb: f.res.hbd_lb,
          hbd_ub: f.res.hbd_ub,
          hba_lb: f.res.hba_lb,
          hba_ub: f.res.hba_ub,
          tpsa_lb: f.res.tpsa_lb,
          tpsa_ub: f.res.tpsa_ub,
          charge_lb: f.res.charge_lb,
          charge_ub: f.res.charge_ub,
          nrb_lb: f.res.nrb_lb,
          nrb_ub: f.res.nrb_ub
        });
        sync(function() {
          f.res.ligands = ligands;
          f.res.scheduled = 0;
          f.res.completed = 0;
          for (var i = 0; i < 100; ++i) {
            f.res[i.toString()] = 0;
          }
          f.res.submitted = new Date();
          idock.insert(f.res, {safe: true}, function(err, docs) {
            if (err) throw err;
            res.json(docs);
          });
        });
      });
      // Get the progress of jobs
      app.get('/idock/done', function(req, res) {
        if (v.init(req.query)
         .chk('email', 'must be valid', true).isEmail()
         .chk('skip', 'must be a non-negative integer', false).isInt()
         .failed()) {
          return res.json(v.err);
        }
        f.init(req.query)
         .snt('email').toLowerCase()
         .snt('skip', 0).toInt();
        var fieldsToReturn = {
          '_id': 0,
          'scheduled': 1,
          'completed': 1,
          'done': 1
        };
        for (var i = 0; i < 100; ++i) {
          fieldsToReturn[i.toString()] = 1;
        }
        idock.find({'email': f.res.email}, fieldsToReturn, function(err, cursor) {
//        idock.find({'email': f.res.email}, {'_id': 0, 'scheduled': 1, 'completed': 1, 'done': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, '10': 1, '11': 1, '12': 1, '13': 1, '14': 1, '15': 1, '16': 1, '17': 1, '18': 1, '19': 1, '20': 1, '21': 1, '22': 1, '23': 1, '24': 1, '25': 1, '26': 1, '27': 1, '28': 1, '29': 1, '30': 1, '31': 1, '32': 1, '33': 1, '34': 1, '35': 1, '36': 1, '37': 1, '38': 1, '39': 1, '40': 1, '41': 1, '42': 1, '43': 1, '44': 1, '45': 1, '46': 1, '47': 1, '48': 1, '49': 1, '50': 1, '51': 1, '52': 1, '53': 1, '54': 1, '55': 1, '56': 1, '57': 1, '58': 1, '59': 1, '60': 1, '61': 1, '62': 1, '63': 1, '64': 1, '65': 1, '66': 1, '67': 1, '68': 1, '69': 1, '70': 1, '71': 1, '72': 1, '73': 1, '74': 1, '75': 1, '76': 1, '77': 1, '78': 1, '79': 1, '80': 1, '81': 1, '82': 1, '83': 1, '84': 1, '85': 1, '86': 1, '87': 1, '88': 1, '89': 1, '90': 1, '91': 1, '92': 1, '93': 1, '94': 1, '95': 1, '96': 1, '97': 1, '98': 1, '99': 1}, function(err, cursor) {
          if (err) throw err;
          cursor.sort({'submitted': 1}).skip(f.res.skip).toArray(function(err, docs) {
            if (err) throw err;
            cursor.close();
            res.json(docs);
          });
        });
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
          return res.json(v.err);
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
          return res.json(v.err);
        }
        // Send query to master process
        ligands = -1;
        f.res.query = '/idock/ligands';
        process.send(f.res);
        sync(function() {
          res.json(ligands);
        });
      });
      // Get igrep jobs by email
      app.get('/igrep/jobs', function(req, res) {
        if (v.init(req.query)
         .chk('email', 'must be valid', true).isEmail()
         .failed()) {
          return res.json(v.err);
        }
        f.init(req.query)
         .snt('email').toLowerCase();
        igrep.find(f.res, {'taxid': 1, 'submitted': 1, 'done': 1}, function(err, cursor) {
          if (err) throw err;
          cursor.sort({'submitted': 1}).toArray(function(err, docs) {
            if (err) throw err;
            cursor.close();
            res.json(docs);
          });
        });
      });
      // Post a new igrep job
      app.post('/igrep/jobs', function(req, res) {
        if (v.init(req.body)
         .chk('email', 'must be valid', true).isEmail()
         .chk('taxid', 'must be the taxonomy id of one of the 26 genomes', true).isIn(['13616', '9598', '9606', '9601', '10116', '9544', '9483', '10090', '9913', '9823', '9796', '9615', '9986', '7955', '28377', '9103', '59729', '9031', '3847', '9258', '29760', '15368', '7460', '30195', '7425', '7070'])
         .chk('queries', 'must conform to the specifications', true).len(2, 66000).regex(/^([ACGTN]{1,64}\d\n){0,9999}[ACGTN]{1,64}\d\n?$/ig)
         .failed()) {
          return res.json(v.err);
        }
        f.init(req.body)
         .snt('email').toLowerCase()
         .snt('taxid').toInt()
         .snt('queries').copy()
         .res.submitted = new Date();
        igrep.insert(f.res, {safe: true}, function(err, docs) {
          if (err) throw err;
          res.json(docs);
        });
      });
      // Get the done date of done jobs
      app.get('/igrep/done', function(req, res) {
        if (v.init(req.query)
         .chk('email', 'must be valid', true).isEmail()
         .chk('skip', 'must be a non-negative integer', false).isInt()
         .failed()) {
          return res.json(v.err);
        }
        f.init(req.query)
         .snt('email').toLowerCase()
         .snt('skip', 0).toInt();
        igrep.find({'email': f.res.email, 'done': {'$exists': 1}}, {'_id': 0, 'done': 1}, function(err, cursor) {
          if (err) throw err;
          cursor.sort({'submitted': 1}).skip(f.res.skip).toArray(function(err, docs) {
            if (err) throw err;
            cursor.close();
            res.json(docs);
          });
        });
      });
      // Start listening
      var http_port = 3000, spdy_port = 3443;
      app.listen(http_port);
      require('spdy').createServer(require('https').Server, {
        key: fs.readFileSync(__dirname + '/key.pem'),
        cert: fs.readFileSync(__dirname + '/cert.pem')
      }, app).listen(spdy_port);
      console.log('Worker %d listening on HTTP port %d and SPDY port %d in %s mode', process.pid, http_port, spdy_port, app.settings.env);
    });
  });
}
