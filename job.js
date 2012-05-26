// Set up validator
var validator = require('validator'),
    Validator = validator.Validator;

Validator.prototype.error = function(msg) {
  this._errors.push(msg);
}

Validator.prototype.getErrors = function() {
  return this._errors;
}

var center_x_fail_msg = 'center_x must be a decimal',
    center_y_fail_msg = 'center_y must be a decimal',
    center_z_fail_msg = 'center_z must be a decimal',
    size_x_fail_msg = 'size_x must be within [1, 30]',
    size_y_fail_msg = 'size_y must be within [1, 30]',
    size_z_fail_msg = 'size_z must be within [1, 30]',
    description_fail_msg = 'description must be provided',
    email_fail_msg = 'email must be provided';

// Create a new job
exports.create = function(config, receptor, error, success) {

  // Validate config
  var val = new Validator();
  val.check(config.center_x, center_x_fail_msg).isDecimal();
  val.check(config.center_y, center_y_fail_msg).isDecimal();
  val.check(config.center_z, center_z_fail_msg).isDecimal();
  val.check(config.size_x, size_x_fail_msg).isInt();
  val.check(config.size_x, size_x_fail_msg).min(1);
  val.check(config.size_x, size_x_fail_msg).max(30);
  val.check(config.size_y, size_y_fail_msg).isInt();
  val.check(config.size_y, size_y_fail_msg).min(1);
  val.check(config.size_y, size_y_fail_msg).max(30);
  val.check(config.size_z, size_z_fail_msg).isInt()
  val.check(config.size_z, size_z_fail_msg).min(1);
  val.check(config.size_z, size_z_fail_msg).max(30);
  val.check(config.description, description_fail_msg).len(1, 1000);
  val.check(config.email, email_fail_msg).isEmail();

  var errors = val.getErrors();
  if (errors.length) {
    error && error(errors);
    return;
  }

  // Sanitize config
  var job = {};
  job.center_x = validator.sanitize(config.center_x).toFloat();
  job.center_y = validator.sanitize(config.center_y).toFloat();
  job.center_z = validator.sanitize(config.center_z).toFloat();
  job.size_x = validator.sanitize(config.size_x).toInt();
  job.size_y = validator.sanitize(config.size_y).toInt();
  job.size_z = validator.sanitize(config.size_z).toInt();
  job.description = validator.sanitize(config.description).xss();

  // Add additional fields to job
  job.time = Date.now();
  job.progress = 0;

  // Insert the new job into MongoDB
  var mongodb = require("mongodb");
  new mongodb.Db('istar', new mongodb.Server('137.189.90.124', 27017)).open(function(err, db) {
    if (err) throw err;
    db.authenticate('daemon', '2qR8dVM9d', function(err, result) {
      if (err) throw err;
      db.collection('jobs', function(err, collection) {
        if (err) throw err;
        collection.insert(job, { safe: true }, function(err, docs) {
          if (err) throw err;
          db.close();
          var _id = docs[0]._id;
          success && success(_id);

          // Create job folder and save receptor
          var fs = require('fs'),
              folder = __dirname + '/public/jobs/' + _id;
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
