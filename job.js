var fs = require('fs'),
    mongodb = require("mongodb");

exports.insert = function (job, receptor) {
  new mongodb.Db('istar', new mongodb.Server('137.189.90.124', 27017)).open(function(err, db) {
    db.authenticate('daemon', '2qR8dVM9d', function(err, result) {
      db.collection('jobs', function(err, collection) {
        // Add additional fields for job, like time = Date.now()
        collection.insert(job, { safe: true }, function(err, docs) {
          db.close();
          var _id = docs[0]._id,
              folder = __dirname + '/public/jobs/' + _id;
          fs.mkdir(folder, function() {
            fs.writeFile(folder + '/receptor.pdbqt', receptor);
          });
        });
      });
    });
  });
};
