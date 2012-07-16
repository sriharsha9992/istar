var validator = require('./validator');
var v = new validator.Validator();
var f = new validator.Filter();
var mongodb = require('mongodb');
var db = new mongodb.Db('istar', new mongodb.Server('137.189.90.124', 27017));
var username = 'daemon';
var password = '2qR8dVM9d';
var collection = 'igrep';

// Get jobs by email
exports.get = function(query, cb) {
  if (v.init(query).chk('email', 'must be valid', true).isEmail().failed()) {
    return v.err;
  }
  db.open(function(err, db) {
    if (err) throw err;
    db.authenticate(username, password, function(err, res) {
      if (err) throw err;
      db.collection(collection, function(err, coll) {
        if (err) throw err;
        coll.find({'email': query['email']}, function(err, cursor) {
          if (err) throw err;
          cursor.toArray(function (err, docs) {
            db.close();
            cb(docs);
          });
        });
      });
    });
  });
}

// Create a new job
exports.create = function(job) {
  if (v.init(job)
   .chk('genome', 'must be one of the 17 genomes', true).isIn(["13616", "9598", "9606", "9544", "10116", "10090", "9913", "9615", "9796", "7955", "9031", "59729", "9823", "9258", "29760", "7460", "7070"])
   .chk('query', 'must conform to the specifications', true).len(2, 66000).regex(/^([ACGTN]{1,64}\d\n){0,9999}[ACGTN]{1,64}\d\n?$/ig)
   .failed()) {
    return v.err;
  }
  f.init(job)
   .snt('genome').toInt()
   .snt('query').xss();
  //job.time = Date.now();
  //job.progress = 0;
  db.open(function(err, db) {
    if (err) throw err;
    db.authenticate(username, password, function(err, res) {
      if (err) throw err;
      db.collection(collection, function(err, coll) {
        if (err) throw err;
        coll.insert(f.res, function(err, docs) {
          if (err) throw err;
          db.close();
        });
      });
    });
  });
}
