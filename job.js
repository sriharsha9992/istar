var validator = require('./validator');
var v = new validator.Validator();
var f = new validator.Filter();
var mongodb = require('mongodb');

// Create a new job
exports.create = function(job) {
  v.init(job);
  v.chk('receptor', 'must be provided', true).len(1, 10485760); // 10MB
  v.chk('center_x', 'must be a decimal within [-1000, 1000]', true).isDecimal().min(-1000).max(1000);
  v.chk('center_y', 'must be a decimal within [-1000, 1000]', true).isDecimal().min(-1000).max(1000);
  v.chk('center_z', 'must be a decimal within [-1000, 1000]', true).isDecimal().min(-1000).max(1000);
  v.chk('size_x', 'must be an integer within [1, 30]', true).isInt().min(1).max(30);
  v.chk('size_y', 'must be an integer within [1, 30]', true).isInt().min(1).max(30);
  v.chk('size_z', 'must be an integer within [1, 30]', true).isInt().min(1).max(30);
  v.chk('description', 'must be provided', true).len(1, 1000);
  v.chk('email', 'must be valid', true).isEmail();
  v.chk('mwt_lb', 'must be a decimal within [55, 566]', false).isDecimal().min(55).max(566);
  v.chk('mwt_ub', 'must be a decimal within [55, 566]', false).isDecimal().min(55).max(566);
  v.chk('logp_lb', 'must be a decimal within [-6, 12]', false).isDecimal().min(-6).max(12);
  v.chk('logp_ub', 'must be a decimal within [-6, 12]', false).isDecimal().min(-6).max(12);
  v.chk('nrb_lb', 'must be an integer within [0, 34]', false).isInt().min(0).max(34);
  v.chk('nrb_ub', 'must be an integer within [0, 34]', false).isInt().min(0).max(34);
  v.chk('hbd_lb', 'must be an integer within [0, 20]', false).isInt().min(0).max(20);
  v.chk('hbd_ub', 'must be an integer within [0, 20]', false).isInt().min(0).max(20);
  v.chk('hba_lb', 'must be an integer within [0, 18]', false).isInt().min(0).max(18);
  v.chk('hba_ub', 'must be an integer within [0, 18]', false).isInt().min(0).max(18);
  v.chk('charge_lb', 'must be an integer within [-5, 5]', false).isInt().min(-5).max(5);
  v.chk('charge_ub', 'must be an integer within [-5, 5]', false).isInt().min(-5).max(5);
  v.chk('ad_lb', 'must be a decimal within [-25, 29]', false).isDecimal().min(-25).max(29);
  v.chk('ad_ub', 'must be a decimal within [-25, 29]', false).isDecimal().min(-25).max(29);
  v.chk('pd_lb', 'must be a decimal within [-504, 1]', false).isDecimal().min(-504).max(1);
  v.chk('pd_ub', 'must be a decimal within [-504, 1]', false).isDecimal().min(-504).max(1);
  v.chk('tpsa_lb', 'must be a decimal within [0, 317]', false).isDecimal().min(0).max(317);
  v.chk('tpsa_ub', 'must be a decimal within [0, 317]', false).isDecimal().min(0).max(317);
  if (Object.keys(v.err).length) {
    return v.err;
  }
  f.init(job);
  f.snt('receptor').xss();
  f.snt('center_x').toFloat();
  f.snt('center_y').toFloat();
  f.snt('center_z').toFloat();
  f.snt('size_x').toInt();
  f.snt('size_y').toInt();
  f.snt('size_z').toInt();
  f.snt('description').xss();
  f.snt('mwt_lb', 400).toFloat();
  f.snt('mwt_ub', 500).toFloat();
  f.snt('logp_lb', 0).toFloat();
  f.snt('logp_ub', 5).toFloat();
  f.snt('nrb_lb', 2).toInt();
  f.snt('nrb_ub', 8).toInt();
  f.snt('hbd_lb', 2).toInt();
  f.snt('hbd_ub', 5).toInt();
  f.snt('hba_lb', 2).toInt();
  f.snt('hba_ub', 10).toInt();
  f.snt('charge_lb', 0).toInt();
  f.snt('charge_ub', 0).toInt();
  f.snt('ad_lb', 0).toFloat();
  f.snt('ad_ub', 12).toFloat();
  f.snt('pd_lb', -50).toFloat();
  f.snt('pd_ub', 0).toFloat();
  f.snt('tpsa_lb', 20).toFloat();
  f.snt('tpsa_ub', 100).toFloat();
  v.init(f.res);
  v.rng('mwt_lb', 'mwt_ub').rng('logp_lb', 'logp_ub').rng('nrb_lb', 'nrb_ub').rng('hbd_lb', 'hbd_ub').rng('hba_lb', 'hba_ub').rng('charge_lb', 'charge_ub').rng('ad_lb', 'ad_ub').rng('pd_lb', 'pd_ub').rng('tpsa_lb', 'tpsa_ub');
  if (Object.keys(v.err).length) {
    return v.err;
  }
  //job.time = Date.now();
  //job.progress = 0;
  new mongodb.Db('istar', new mongodb.Server('137.189.90.124', 27017)).open(function(err, db) {
    if (err) throw err;
    db.authenticate('daemon', '2qR8dVM9d', function(err, res) {
      if (err) throw err;
      db.collection('jobs', function(err, coll) {
        if (err) throw err;
        coll.insert(job, function(err, docs) {
          if (err) throw err;
          db.close();
        });
      });
    });
  });
}
