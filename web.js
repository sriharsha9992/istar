#!/usr/bin/env node

var fs = require('fs'),
	cluster = require('cluster');
if (cluster.isMaster) {
	// Allocate arrays to hold ligand properties
	var num_ligands = 17224424,
		mwt = new Float32Array(num_ligands),
		lgp = new Float32Array(num_ligands),
		ads = new Float32Array(num_ligands),
		pds = new Float32Array(num_ligands),
		hbd = new Int16Array(num_ligands),
		hba = new Int16Array(num_ligands),
		psa = new Int16Array(num_ligands),
		chg = new Int16Array(num_ligands),
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
				mwt[i] = buf.readFloatLE(o +  0);
				lgp[i] = buf.readFloatLE(o +  4);
				ads[i] = buf.readFloatLE(o +  8);
				pds[i] = buf.readFloatLE(o + 12);
				hbd[i] = buf.readInt16LE(o + 16);
				hba[i] = buf.readInt16LE(o + 18);
				psa[i] = buf.readInt16LE(o + 20);
				chg[i] = buf.readInt16LE(o + 22);
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
						if ((m.mwt_lb <= mwt[i]) && (mwt[i] <= m.mwt_ub) && (m.lgp_lb <= lgp[i]) && (lgp[i] <= m.lgp_ub) && (m.ads_lb <= ads[i]) && (ads[i] <= m.ads_ub) && (m.pds_lb <= pds[i]) && (pds[i] <= m.pds_ub) && (m.hbd_lb <= hbd[i]) && (hbd[i] <= m.hbd_ub) && (m.hba_lb <= hba[i]) && (hba[i] <= m.hba_ub) && (m.psa_lb <= psa[i]) && (psa[i] <= m.psa_ub) && (m.chg_lb <= chg[i]) && (chg[i] <= m.chg_ub) && (m.nrb_lb <= nrb[i]) && (nrb[i] <= m.nrb_ub)) ++ligands;
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
	new mongodb.MongoClient(new mongodb.Server(process.argv[2], 27017)).open(function(err, mongoClient) {
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
				app.use(express.json());
				app.use(express.urlencoded());
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
			var child_process = require('child_process');
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
				'done': 1
			};
			for (var i = 0; i < 10; ++i) {
				idockJobFields[i.toString()] = 1;
			}
			var idockProgressFields = {
				'_id': 0,
				'scheduled': 1,
				'done': 1
			};
			for (var i = 0; i < 10; ++i) {
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
					.chk('receptor', 'must conform to PDB specification', true).len(1, 10485760).regex(/^(((ATOM  |HETATM).{24}(.{3}\d\.\d{3}){3}.{26}\n){1,39999}TER   .{74}\n){1,26}(HETATM.{24}(.{3}\d\.\d{3}){3}.{26}\n){0,99}(CONECT(.{4}\d){2}.{64}\n){0,999}$/g) // 10MB
					.chk('center_x', 'must be a decimal within [-999, 999]', true).isDecimal().min(-999).max(999)
					.chk('center_y', 'must be a decimal within [-999, 999]', true).isDecimal().min(-999).max(999)
					.chk('center_z', 'must be a decimal within [-999, 999]', true).isDecimal().min(-999).max(999)
					.chk('size_x', 'must be an integer within [10, 30]', true).isDecimal().min(10).max(30)
					.chk('size_y', 'must be an integer within [10, 30]', true).isDecimal().min(10).max(30)
					.chk('size_z', 'must be an integer within [10, 30]', true).isDecimal().min(10).max(30)
					.chk('description', 'must be provided, at most 20 characters', true).len(1, 20)
					.chk('mwt_lb', 'must be a decimal within [55, 567]', false).isDecimal().min(55).max(567)
					.chk('mwt_ub', 'must be a decimal within [55, 567]', false).isDecimal().min(55).max(567)
					.chk('lgp_lb', 'must be a decimal within [-6, 12]', false).isDecimal().min(-6).max(12)
					.chk('lgp_ub', 'must be a decimal within [-6, 12]', false).isDecimal().min(-6).max(12)
					.chk('ads_lb', 'must be a decimal within [-25, 29]', false).isDecimal().min(-25).max(29)
					.chk('ads_ub', 'must be a decimal within [-25, 29]', false).isDecimal().min(-25).max(29)
					.chk('pds_lb', 'must be a decimal within [-504, 1]', false).isDecimal().min(-504).max(1)
					.chk('pds_ub', 'must be a decimal within [-504, 1]', false).isDecimal().min(-504).max(1)
					.chk('hbd_lb', 'must be an integer within [0, 20]', false).isInt().min(0).max(20)
					.chk('hbd_ub', 'must be an integer within [0, 20]', false).isInt().min(0).max(20)
					.chk('hba_lb', 'must be an integer within [0, 18]', false).isInt().min(0).max(18)
					.chk('hba_ub', 'must be an integer within [0, 18]', false).isInt().min(0).max(18)
					.chk('psa_lb', 'must be an integer within [0, 317]', false).isInt().min(0).max(317)
					.chk('psa_ub', 'must be an integer within [0, 317]', false).isInt().min(0).max(317)
					.chk('chg_lb', 'must be an integer within [-5, 5]', false).isInt().min(-5).max(5)
					.chk('chg_ub', 'must be an integer within [-5, 5]', false).isInt().min(-5).max(5)
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
					.snt('mwt_ub', 420).toFloat()
					.snt('lgp_lb', 0).toFloat()
					.snt('lgp_ub', 2).toFloat()
					.snt('ads_lb', 0).toFloat()
					.snt('ads_ub', 5).toFloat()
					.snt('pds_lb', -20).toFloat()
					.snt('pds_ub', 0).toFloat()
					.snt('hbd_lb', 2).toInt()
					.snt('hbd_ub', 4).toInt()
					.snt('hba_lb', 4).toInt()
					.snt('hba_ub', 6).toInt()
					.snt('psa_lb', 60).toInt()
					.snt('psa_ub', 80).toInt()
					.snt('chg_lb', 0).toInt()
					.snt('chg_ub', 0).toInt()
					.snt('nrb_lb', 4).toInt()
					.snt('nrb_ub', 6).toInt()
					.res)
					.rng('mwt_lb', 'mwt_ub')
					.rng('lgp_lb', 'lgp_ub')
					.rng('ads_lb', 'ads_ub')
					.rng('pds_lb', 'pds_ub')
					.rng('hbd_lb', 'hbd_ub')
					.rng('hba_lb', 'hba_ub')
					.rng('psa_lb', 'psa_ub')
					.rng('chg_lb', 'chg_ub')
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
					lgp_lb: f.res.lgp_lb,
					lgp_ub: f.res.lgp_ub,
					ads_lb: f.res.ads_lb,
					ads_ub: f.res.ads_ub,
					pds_lb: f.res.pds_lb,
					pds_ub: f.res.pds_ub,
					hbd_lb: f.res.hbd_lb,
					hbd_ub: f.res.hbd_ub,
					hba_lb: f.res.hba_lb,
					hba_ub: f.res.hba_ub,
					psa_lb: f.res.psa_lb,
					psa_ub: f.res.psa_ub,
					chg_lb: f.res.chg_lb,
					chg_ub: f.res.chg_ub,
					nrb_lb: f.res.nrb_lb,
					nrb_ub: f.res.nrb_ub
				});
				sync(function() {
					f.res.ligands = ligands;
					f.res.scheduled = 0;
					f.res.completed = 0;
					for (var i = 0; i < 10; ++i) {
						f.res[i.toString()] = 0;
					}
					f.res.submitted = new Date();
					f.res._id = new mongodb.ObjectID();
					var dir = '/home/hjli/nfs/hjli/istar/public/idock/jobs/' + f.res._id;
					fs.mkdir(dir, function (err) {
						if (err) throw err;
						fs.writeFile(dir + '/receptor.pdb', req.body['receptor'], function(err) {
							if (err) throw err;
							child_process.execFile('python2.5', [process.env.HOME + '/mgltools_x86_64Linux2_1.5.6/MGLToolsPckgs/AutoDockTools/Utilities24/prepare_receptor4.pyo', '-A', 'checkhydrogens', '-U', 'nphs_lps_waters_deleteAltB', '-r', 'receptor.pdb'], { cwd: dir }, function(err, stdout, stderr) {
								if (err) {
									fs.unlink(dir + '/receptor.pdb', function(err) {
										if (err) throw err;
										fs.rmdir(dir, function (err) {
											if (err) throw err;
											res.json({ receptor: 'must conform to PDB specification' });
										});
									});
								} else {
									fs.writeFile(dir + '/box.conf', ['center_x', 'center_y', 'center_z', 'size_x', 'size_y', 'size_z'].map(function(key) {
										return key + '=' + req.body[key] + '\n';
									}).join(''), function(err) {
										if (err) throw err;
										idock.insert(f.res, { w: 0 });
										res.json({});
									});
								}
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
					.chk('lgp_lb', 'must be a decimal within [-6, 12]', true).isDecimal().min(-6).max(12)
					.chk('lgp_ub', 'must be a decimal within [-6, 12]', true).isDecimal().min(-6).max(12)
					.chk('ads_lb', 'must be a decimal within [-25, 29]', true).isDecimal().min(-25).max(29)
					.chk('ads_ub', 'must be a decimal within [-25, 29]', true).isDecimal().min(-25).max(29)
					.chk('pds_lb', 'must be a decimal within [-504, 1]', true).isDecimal().min(-504).max(1)
					.chk('pds_ub', 'must be a decimal within [-504, 1]', true).isDecimal().min(-504).max(1)
					.chk('hbd_lb', 'must be an integer within [0, 20]', true).isInt().min(0).max(20)
					.chk('hbd_ub', 'must be an integer within [0, 20]', true).isInt().min(0).max(20)
					.chk('hba_lb', 'must be an integer within [0, 18]', true).isInt().min(0).max(18)
					.chk('hba_ub', 'must be an integer within [0, 18]', true).isInt().min(0).max(18)
					.chk('psa_lb', 'must be an integer within [0, 317]', true).isInt().min(0).max(317)
					.chk('psa_ub', 'must be an integer within [0, 317]', true).isInt().min(0).max(317)
					.chk('chg_lb', 'must be an integer within [-5, 5]', true).isInt().min(-5).max(5)
					.chk('chg_ub', 'must be an integer within [-5, 5]', true).isInt().min(-5).max(5)
					.chk('nrb_lb', 'must be an integer within [0, 35]', true).isInt().min(0).max(35)
					.chk('nrb_ub', 'must be an integer within [0, 35]', true).isInt().min(0).max(35)
					.failed()) {
					return res.json(v.err);
				}
				var f = new validator.Filter();
				if (v.init(f.init(req.query)
					.snt('mwt_lb').toFloat()
					.snt('mwt_ub').toFloat()
					.snt('lgp_lb').toFloat()
					.snt('lgp_ub').toFloat()
					.snt('ads_lb').toFloat()
					.snt('ads_ub').toFloat()
					.snt('pds_lb').toFloat()
					.snt('pds_ub').toFloat()
					.snt('hbd_lb').toInt()
					.snt('hbd_ub').toInt()
					.snt('hba_lb').toInt()
					.snt('hba_ub').toInt()
					.snt('psa_lb').toInt()
					.snt('psa_ub').toInt()
					.snt('chg_lb').toInt()
					.snt('chg_ub').toInt()
					.snt('nrb_lb').toInt()
					.snt('nrb_ub').toInt()
					.res)
					.rng('mwt_lb', 'mwt_ub')
					.rng('lgp_lb', 'lgp_ub')
					.rng('ads_lb', 'ads_ub')
					.rng('pds_lb', 'pds_ub')
					.rng('hbd_lb', 'hbd_ub')
					.rng('hba_lb', 'hba_ub')
					.rng('psa_lb', 'psa_ub')
					.rng('chg_lb', 'chg_ub')
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
				igrep.insert(f.res, {w: 0});
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
