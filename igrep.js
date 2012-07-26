var validator = require('./validator'),
    v = new validator.Validator(),
    f = new validator.Filter(),
    coll;

// Initialize the coll variable
exports.setCollection = function(collection) {
  coll = collection;
}

// Get jobs by email
exports.get = function(query, callback) {
  if (v.init(query)
   .chk('email', 'must be valid', true).isEmail()
   .chk('page', 'must be an integer within [0, 999]', false).isInt().min(0).max(999)
   .failed()) {
    return callback(v.err, null);
  }
  f.init(query)
   .snt('email').copy()
   .snt('page', 0).toInt();
  coll.find({'email': f.res.email}, {'genome': 1, 'submitted': 1, 'done': 1}, function(err, cursor) {
    if (err) throw err;
    cursor.sort({'submitted': -1}).toArray(function(err, docs) {
      if (err) throw err;
      callback(null, docs);
    });
  });
}

// Create a new job
exports.create = function(job, callback) {
  if (v.init(job)
   .chk('email', 'must be valid', true).isEmail()
   .chk('genome', 'must be one of the 17 genomes', true).isIn(["13616", "9598", "9606", "9544", "10116", "10090", "9913", "9615", "9796", "7955", "9031", "59729", "9823", "9258", "29760", "7460", "7070"])
   .chk('queries', 'must conform to the specifications', true).len(2, 66000).regex(/^([ACGTN]{1,64}\d\n){0,9999}[ACGTN]{1,64}\d\n?$/ig)
   .failed()) {
    return callback(v.err, null);
  }
  f.init(job)
   .snt('email').copy()
   .snt('genome').toInt()
   .snt('queries').copy()
   .res.submitted = new Date();
  coll.insert(f.res, function(err, docs) {
    if (err) throw err;
    callback(null, docs);
  });
}
