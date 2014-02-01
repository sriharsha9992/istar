#!/usr/bin/env node

var fs = require('fs'),
	cluster = require('cluster');
if (cluster.isMaster) {
	// Allocate arrays to hold ligand properties
	var num_ligands = 23129083,
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
			var validator = require('./public/validator');
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
				var v = new validator(req.query);
				if (v
					.field('skip').message('must be a non-negative integer').int(0).min(0)
					.field('count').message('must be a non-negative integer').int(0).min(0)
					.failed() || v
					.range('skip', 'count')
					.failed()) {
					return res.json(v.err);
				};
				idock.count(function(err, count) {
					if (err) throw err;
					if (v
						.field('count').message('must be no greater than ' + count).max(count)
						.failed()) {
						return res.json(v.err);
					}
					idock.find({}, {
						fields: v.res.count == count ? idockProgressFields : idockJobFields,
						sort: {'submitted': 1},
						skip: v.res.skip,
						limit: count - v.res.skip
					}).toArray(function(err, docs) {
						if (err) throw err;
						res.json(docs);
					});
				});
			});
			// Post a new idock job
			app.post('/idock/jobs', function(req, res) {
				var v = new validator(req.body);
				if (v
					.field('email').message('must be valid').email().copy()
					.field('receptor').message('must conform to PDB specification').length(1, 10485760).receptor()
					.field('description').message('must be provided, at most 20 characters').length(1, 20).xss()
					.field('center_x').message('must be a decimal within [-999, 999]').float().min(-999).max(999)
					.field('center_y').message('must be a decimal within [-999, 999]').float().min(-999).max(999)
					.field('center_z').message('must be a decimal within [-999, 999]').float().min(-999).max(999)
					.field('size_x').message('must be an integer within [10, 30]').float().min(10).max(30)
					.field('size_y').message('must be an integer within [10, 30]').float().min(10).max(30)
					.field('size_z').message('must be an integer within [10, 30]').float().min(10).max(30)
					.field('mwt_lb').message('must be a decimal within [55, 567]').float(400).min(55).max(567)
					.field('mwt_ub').message('must be a decimal within [55, 567]').float(420).min(55).max(567)
					.field('lgp_lb').message('must be a decimal within [-6, 12]').float(0).min(-6).max(12)
					.field('lgp_ub').message('must be a decimal within [-6, 12]').float(2).min(-6).max(12)
					.field('ads_lb').message('must be a decimal within [-57, 29]').float(0).min(-25).max(29)
					.field('ads_ub').message('must be a decimal within [-57, 29]').float(5).min(-25).max(29)
					.field('pds_lb').message('must be a decimal within [-543, 1]').float(-20).min(-504).max(1)
					.field('pds_ub').message('must be a decimal within [-543, 1]').float(0).min(-504).max(1)
					.field('hbd_lb').message('must be an integer within [0, 20]').int(2).min(0).max(20)
					.field('hbd_ub').message('must be an integer within [0, 20]').int(4).min(0).max(20)
					.field('hba_lb').message('must be an integer within [0, 18]').int(4).min(0).max(18)
					.field('hba_ub').message('must be an integer within [0, 18]').int(6).min(0).max(18)
					.field('psa_lb').message('must be an integer within [0, 317]').int(60).min(0).max(317)
					.field('psa_ub').message('must be an integer within [0, 317]').int(80).min(0).max(317)
					.field('chg_lb').message('must be an integer within [-5, 5]').int(0).min(-5).max(5)
					.field('chg_ub').message('must be an integer within [-5, 5]').int(0).min(-5).max(5)
					.field('nrb_lb').message('must be an integer within [0, 35]').int(4).min(0).max(35)
					.field('nrb_ub').message('must be an integer within [0, 35]').int(6).min(0).max(35)
					.failed() || v
					.range('mwt_lb', 'mwt_ub')
					.range('lgp_lb', 'lgp_ub')
					.range('ads_lb', 'ads_ub')
					.range('pds_lb', 'pds_ub')
					.range('hbd_lb', 'hbd_ub')
					.range('hba_lb', 'hba_ub')
					.range('psa_lb', 'psa_ub')
					.range('chg_lb', 'chg_ub')
					.range('nrb_lb', 'nrb_ub')
					.failed()) {
					return res.json(v.err);
				}
				// Send query to master process
				ligands = -1;
				process.send({
					query: '/idock/ligands',
					mwt_lb: v.res.mwt_lb,
					mwt_ub: v.res.mwt_ub,
					lgp_lb: v.res.lgp_lb,
					lgp_ub: v.res.lgp_ub,
					ads_lb: v.res.ads_lb,
					ads_ub: v.res.ads_ub,
					pds_lb: v.res.pds_lb,
					pds_ub: v.res.pds_ub,
					hbd_lb: v.res.hbd_lb,
					hbd_ub: v.res.hbd_ub,
					hba_lb: v.res.hba_lb,
					hba_ub: v.res.hba_ub,
					psa_lb: v.res.psa_lb,
					psa_ub: v.res.psa_ub,
					chg_lb: v.res.chg_lb,
					chg_ub: v.res.chg_ub,
					nrb_lb: v.res.nrb_lb,
					nrb_ub: v.res.nrb_ub
				});
				sync(function() {
					if (ligands < 1) {
						res.json({'ligands': 'the number of filtered ligands must be at least 1'});
					}
					v.res.ligands = ligands;
					v.res.scheduled = 0;
					v.res.completed = 0;
					for (var i = 0; i < 10; ++i) {
						v.res[i.toString()] = 0;
					}
					v.res.submitted = new Date();
					v.res._id = new mongodb.ObjectID();
					var dir = '/home/hjli/nfs/hjli/istar/public/idock/jobs/' + v.res._id;
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
										idock.insert(v.res, { w: 0 });
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
				var v = new validator(req.query);
				if (v
					.field('mwt_lb').message('must be a decimal within [55, 567]').float().min(55).max(567)
					.field('mwt_ub').message('must be a decimal within [55, 567]').float().min(55).max(567)
					.field('lgp_lb').message('must be a decimal within [-6, 12]').float().min(-6).max(12)
					.field('lgp_ub').message('must be a decimal within [-6, 12]').float().min(-6).max(12)
					.field('ads_lb').message('must be a decimal within [-57, 29]').float().min(-25).max(29)
					.field('ads_ub').message('must be a decimal within [-57, 29]').float().min(-25).max(29)
					.field('pds_lb').message('must be a decimal within [-543, 1]').float().min(-504).max(1)
					.field('pds_ub').message('must be a decimal within [-543, 1]').float().min(-504).max(1)
					.field('hbd_lb').message('must be an integer within [0, 20]').int().min(0).max(20)
					.field('hbd_ub').message('must be an integer within [0, 20]').int().min(0).max(20)
					.field('hba_lb').message('must be an integer within [0, 18]').int().min(0).max(18)
					.field('hba_ub').message('must be an integer within [0, 18]').int().min(0).max(18)
					.field('psa_lb').message('must be an integer within [0, 317]').int().min(0).max(317)
					.field('psa_ub').message('must be an integer within [0, 317]').int().min(0).max(317)
					.field('chg_lb').message('must be an integer within [-5, 5]').int().min(-5).max(5)
					.field('chg_ub').message('must be an integer within [-5, 5]').int().min(-5).max(5)
					.field('nrb_lb').message('must be an integer within [0, 35]').int().min(0).max(35)
					.field('nrb_ub').message('must be an integer within [0, 35]').int().min(0).max(35)
					.failed() || v
					.range('mwt_lb', 'mwt_ub')
					.range('lgp_lb', 'lgp_ub')
					.range('ads_lb', 'ads_ub')
					.range('pds_lb', 'pds_ub')
					.range('hbd_lb', 'hbd_ub')
					.range('hba_lb', 'hba_ub')
					.range('psa_lb', 'psa_ub')
					.range('chg_lb', 'chg_ub')
					.range('nrb_lb', 'nrb_ub')
					.failed()) {
					return res.json(v.err);
				}
				// Send query to master process
				ligands = -1;
				v.res.query = '/idock/ligands';
				process.send(v.res);
				sync(function() {
					res.json(ligands);
				});
			});
			// Get igrep jobs
			app.get('/igrep/jobs', function(req, res) {
				var v = new validator(req.query);
				if (v
					.field('skip').message('must be a non-negative integer').int(0).min(0)
					.failed()) {
					return res.json(v.err);
				};
				igrep.find({}, {
					fields: {'taxid': 1, 'submitted': 1, 'done': 1},
					sort: {'submitted': 1},
					skip: v.res.skip
				}).toArray(function(err, docs) {
					if (err) throw err;
					res.json(docs);
				});
			});
			// Post a new igrep job
			app.post('/igrep/jobs', function(req, res) {
				var v = new validator(req.body);
				if (v
					.field('email').message('must be valid').email().copy()
					.field('taxid').message('must be the taxonomy id of one of the 26 genomes').int().in([13616, 9598, 9606, 9601, 10116, 9544, 9483, 10090, 9913, 9823, 9796, 9615, 9986, 7955, 28377, 9103, 59729, 9031, 3847, 9258, 29760, 15368, 7460, 30195, 7425, 7070])
					.field('queries').message('must conform to the specifications').length(2, 66000).queries().copy()
					.failed()) {
					return res.json(v.err);
				}
				v.res.submitted = new Date();
				igrep.insert(v.res, {w: 0});
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
