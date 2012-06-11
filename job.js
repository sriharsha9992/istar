var fs = require('fs');
var mongodb = require("mongodb");

// Create a new job
exports.create = function(config, receptor) {
  // Add additional fields to job
  var job = config;
  job.time = Date.now();
  job.progress = 0;
  // Insert the new job into MongoDB
  new mongodb.Db('istar', new mongodb.Server('137.189.90.124', 27017)).open(function(err, db) {
    if (err) throw err;
    db.authenticate('daemon', '2qR8dVM9d', function(err, result) {
      if (err) throw err;
      db.collection('jobs', function(err, coll) {
        if (err) throw err;
        coll.insert(job, { safe: true }, function(err, docs) {
          if (err) throw err;
          db.close();
          // Create job folder and save receptor
          var folder = __dirname + '/public/jobs/' + docs[0]._id;
          fs.mkdir(folder, function(err) {
            if (err) throw err;
            fs.writeFile(folder + '/receptor.pdbqt', receptor, function(err) {
              if (err) throw err;
            });
          });
        });
      });
    });
  });
}
