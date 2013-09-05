#!/usr/bin/env node

var fs = require('fs'),
	cluster = require('cluster');
if (cluster.isMaster) {
	// Allocate arrays to hold ligand properties
	var num_ligands = 17224424,
		   mwt = new Float32Array(num_ligands),
		  logp = new Float32Array(num_ligands),
		    ad = new Float32Array(num_ligands),
		    pd = new Float32Array(num_ligands),
		   hbd = new Int16Array(num_ligands),
		   hba = new Int16Array(num_ligands),
		  tpsa = new Int16Array(num_ligands),
		charge = new Int16Array(num_ligands),
		   nrb = new Int16Array(num_ligands);
	// Parse ligand properties
	var prop = 'idock/16_prop.bin.gz';
	console.log('Parsing %s', prop);
	var start = Date.now();
	fs.readFile(prop, function(err, data) {
		if (err) throw err;
		require('zlib').gunzip(data, function(err, buf) {
			if (err) throw err;
			for (i = 0, o = 0; i < num_ligands; ++i, o += 26) {
				   mwt[i] = buf.readFloatLE(o +	 0);
				  logp[i] = buf.readFloatLE(o +	 4);
				    ad[i] = buf.readFloatLE(o +	 8);
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
					for (var i = 0; i < num_ligands; ++i) {
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
	new mongodb.MongoClient(new mongodb.Server(process.argv[2], 27017), {db: {native_parser: true}}).open(function(err, mongoClient) {
		if (err) throw err;
		var db = mongoClient.db('istar');
		db.authenticate(process.argv[3], process.argv[4], function(err, authenticated) {
			if (err) throw err;
			var idock = db.collection('idock');
			var igrep = db.collection('igrep');
			// Configure express server
			var express = require('express');
			var app = express();
			app.configure(function() {
				app.use(express.compress());
				app.use(express.bodyParser());
				app.use(app.router);
				app.use(function(req, res, next) {
					if (req.headers['user-agent'] && req.headers['user-agent'].indexOf('MSIE') > -1) {
						res.setHeader('X-UA-Compatible', 'IE=Edge');
					}
					next();
				});
			});
			app.configure('development', function() {
				app.use(express.static(__dirname + '/public'));
				app.use(express.static('/home/hjli/nfs/hjli/istar/public'));
				app.use(express.favicon(__dirname + '/public'));
				app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
			});
			app.configure('production', function() {
				var oneYear = 31557600000; // 1000 * 60 * 60 * 24 * 365.25
				app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
				app.use(express.static('/home/hjli/nfs/hjli/istar/public', { maxAge: oneYear }));
				app.use(express.favicon(__dirname + '/public', { maxAge: oneYear }));
				app.use(express.errorHandler());
			});
			// Define helper variables and functions
			var validator = require('./validator');
			var ligands;
			function sync(callback) {
				if (ligands == -1) setImmediate(function() {
					sync(callback);
				});
				else callback();
			};
			process.on('message', function(m) {
				if (m.ligands !== undefined) {
					ligands = m.ligands;
				}
			});
			var idockJobFields = {
				'description': 1,
				'ligands': 1,
				'submitted': 1,
				'scheduled': 1,
				'completed': 1,
				'refined': 1,
				'hits': 1,
				'done': 1
			};
			for (var i = 0; i < 100; ++i) {
				idockJobFields[i.toString()] = 1;
			}
			var idockProgressFields = {
				'_id': 0,
				'scheduled': 1,
				'completed': 1,
				'refined': 1,
				'hits': 1,
				'done': 1
			};
			for (var i = 0; i < 100; ++i) {
				idockProgressFields[i.toString()] = 1;
			}
			// Get idock jobs
			app.get('/idock/jobs', function(req, res) {
				var v = new validator.Validator();
				if (v.init(req.query)
					.chk('skip', 'must be a non-negative integer', false).isInt()
					.chk('count', 'must be a non-negative integer', false).isInt()
					.failed()) {
					return res.json(v.err);
				}
				var f = new validator.Filter();
				if (v.init(f.init(req.query)
					.snt('skip', 0).toInt()
					.snt('count', 0).toInt()
					.res)
					.rng('skip', 'count')
					.failed()) {
					return res.json(v.err);
				};
				idock.count(function(err, count) {
					if (err) throw err;
					if (v.init(f.res)
						.chk('count', 'must be no greater than ' + count, true).max(count)
						.failed()) {
						return res.json(v.err);
					}
					idock.find({}, {
						fields: f.res.count == count ? idockProgressFields : idockJobFields,
						sort: {'submitted': 1},
						skip: f.res.skip,
						limit: count - f.res.skip
					}).toArray(function(err, docs) {
						if (err) throw err;
						res.json(docs);
					});
				});
			});
			// Post a new idock job
			app.post('/idock/jobs', function(req, res) {
				var v = new validator.Validator();
				if (v.init(req.body)
					.chk('email', 'must be valid', true).isEmail()
					.chk('receptor', 'must be provided', true).len(1, 10485760).regex(/^(((ATOM	|HETATM).{24}(.{3}\d\.\d{3}){3}.{25}\n){1,39999}TER	 .{21,}\n){0,9}((ATOM	|HETATM).{24}(.{3}\d\.\d{3}){3}.{25}\n){1,39999}TER	 .{21,}\n?$/g) // 10MB
					.chk('center_x', 'must be a decimal within [-999, 999]', true).isDecimal().min(-999).max(999)
					.chk('center_y', 'must be a decimal within [-999, 999]', true).isDecimal().min(-999).max(999)
					.chk('center_z', 'must be a decimal within [-999, 999]', true).isDecimal().min(-999).max(999)
					.chk('size_x', 'must be an integer within [10, 30]', true).isInt().min(10).max(30)
					.chk('size_y', 'must be an integer within [10, 30]', true).isInt().min(10).max(30)
					.chk('size_z', 'must be an integer within [10, 30]', true).isInt().min(10).max(30)
					.chk('description', 'must be provided, at most 40 characters', true).len(1, 40)
					.chk('mwt_lb', 'must be a decimal within [55, 567]', false).isDecimal().min(55).max(567)
					.chk('mwt_ub', 'must be a decimal within [55, 567]', false).isDecimal().min(55).max(567)
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
					.chk('nrb_lb', 'must be an integer within [0, 35]', false).isInt().min(0).max(35)
					.chk('nrb_ub', 'must be an integer within [0, 35]', false).isInt().min(0).max(35)
					.failed()) {
					return res.json(v.err);
				}
				var f = new validator.Filter();
				if (v.init(f.init(req.body)
					.snt('email').copy()
					.snt('description').xss()
					.snt('mwt_lb', 400).toFloat()
					.snt('mwt_ub', 450).toFloat()
					.snt('logp_lb', 0).toFloat()
					.snt('logp_ub', 4).toFloat()
					.snt('ad_lb', 0).toFloat()
					.snt('ad_ub', 5).toFloat()
					.snt('pd_lb', -20).toFloat()
					.snt('pd_ub', 0).toFloat()
					.snt('hbd_lb', 2).toInt()
					.snt('hbd_ub', 5).toInt()
					.snt('hba_lb', 4).toInt()
					.snt('hba_ub', 8).toInt()
					.snt('tpsa_lb', 60).toInt()
					.snt('tpsa_ub', 80).toInt()
					.snt('charge_lb', 0).toInt()
					.snt('charge_ub', 0).toInt()
					.snt('nrb_lb', 4).toInt()
					.snt('nrb_ub', 6).toInt()
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
					f.res.refined = 0;
					f.res.hits = 1000;
					for (var i = 0; i < 100; ++i) {
						f.res[i.toString()] = 0;
					}
					f.res.submitted = new Date();
					idock.insert(f.res, {safe: true}, function(err, docs) {
						if (err) throw err;
						var dir = '/home/hjli/nfs/hjli/istar/public/idock/jobs/' + docs[0]._id;
						fs.mkdir(dir, function (err) {
							if (err) throw err;
							fs.writeFile(dir + '/receptor.pdbqt', req.body['receptor'], function(err) {
								if (err) throw err;
								fs.writeFile(dir + '/box.conf', ['center_x', 'center_y', 'center_z', 'size_x', 'size_y', 'size_z'].map(function(key) {
									return key + ' = ' + req.body[key] + '\n';
								}).join(''), function(err) {
									if (err) throw err;
									res.json({});
								});
							});
						});
					});
				});
			});
			// Get the number of ligands satisfying filtering conditions
			app.get('/idock/ligands', function(req, res) {
				// Validate and sanitize user input
				var v = new validator.Validator();
				if (v.init(req.query)
					.chk('mwt_lb', 'must be a decimal within [55, 567]', true).isDecimal().min(55).max(567)
					.chk('mwt_ub', 'must be a decimal within [55, 567]', true).isDecimal().min(55).max(567)
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
					.chk('nrb_lb', 'must be an integer within [0, 35]', true).isInt().min(0).max(35)
					.chk('nrb_ub', 'must be an integer within [0, 35]', true).isInt().min(0).max(35)
					.failed()) {
					return res.json(v.err);
				}
				var f = new validator.Filter();
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
			// Get igrep jobs
			app.get('/igrep/jobs', function(req, res) {
				var v = new validator.Validator();
				if (v.init(req.query)
					.chk('skip', 'must be a non-negative integer', false).isInt()
					.failed()) {
					return res.json(v.err);
				}
				var f = new validator.Filter();
				f.init(req.query)
					.snt('skip', 0).toInt();
				igrep.find({}, {
					fields: {'taxid': 1, 'submitted': 1, 'done': 1},
					sort: {'submitted': 1},
					skip: f.res.skip
				}).toArray(function(err, docs) {
					if (err) throw err;
					res.json(docs);
				});
			});
			// Post a new igrep job
			app.post('/igrep/jobs', function(req, res) {
				var v = new validator.Validator();
				if (v.init(req.body)
					.chk('email', 'must be valid', true).isEmail()
					.chk('taxid', 'must be the taxonomy id of one of the 26 genomes', true).isIn(['13616', '9598', '9606', '9601', '10116', '9544', '9483', '10090', '9913', '9823', '9796', '9615', '9986', '7955', '28377', '9103', '59729', '9031', '3847', '9258', '29760', '15368', '7460', '30195', '7425', '7070'])
					.chk('queries', 'must conform to the specifications', true).len(2, 66000).regex(/^([ACGTN]{1,64}\d\n){0,9999}[ACGTN]{1,64}\d\n?$/ig)
					.failed()) {
					return res.json(v.err);
				}
				var f = new validator.Filter();
				f.init(req.body)
					.snt('email').copy()
					.snt('taxid').toInt()
					.snt('queries').copy()
					.res.submitted = new Date();
				igrep.insert(f.res);
				res.json({});
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
