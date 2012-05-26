#!/usr/bin/env node

var fs = require('fs'),
    mongodb = require("mongodb");

// Parse server configuration file
var conf = JSON.parse(fs.readFileSync('server.conf'));

// Set up validator
var validator = require('validator'),
    Validator = validator.Validator;

Validator.prototype.error = function(msg) {
    this._errors.push(msg);
}

Validator.prototype.getErrors = function() {
    return this._errors;
}

// Create a new job
create = function(config, receptor, cb) {

  // Validate config
  var val = new Validator();
  val.check(config.center_x, 'center_x must be a decimal').isDecimal();
  val.check(config.center_y, 'center_y must be a decimal').isDecimal();
  val.check(config.center_z, 'center_z must be a decimal').isDecimal();
  val.check(config.size_x, 'size_x must be within [1, 30]').isInt().min(1).max(30);
  val.check(config.size_y, 'size_y must be within [1, 30]').isInt().min(1).max(30);
  val.check(config.size_z, 'size_z must be within [1, 30]').isInt().min(1).max(30);
  val.check(config.description, 'description must be provided').len(1, 1000);
  val.check(config.email, 'email must be provided').isEmail();

  var errors = val.getErrors();
  if (errors) {
    cb(errors);
    return;
  }

  // Sanitize config
  var job;
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
  new mongodb.Db('istar', new mongodb.Server('137.189.90.124', 27017)).open(function(err, db) {
    db.authenticate('daemon', '2qR8dVM9d', function(err, result) {
      db.collection('jobs', function(err, collection) {
        collection.insert(job, { safe: true }, function(err, docs) {
          db.close();
          var _id = docs[0]._id;
          cb(_id);

          // Create job folder and save receptor
          var folder = __dirname + '/public/jobs/' + _id;
          fs.mkdir(folder, function() {
            fs.writeFile(folder + '/receptor.pdbqt', receptor);
          });
        });
      });
    });
  });
};

// Initialize context.io client
var ctxioClient = new require('contextio').Client({
  key: conf.key,
  secret: conf.secret
});

// Read offset from file
var log = 'contextio.log',
    offset = parseInt(fs.readFileSync(log));

// Get messages every hour
//setInterval(function() {
  ctxioClient.accounts(conf.account_id).messages().get({ include_body: 1, body_type: 'text/plain', offset: offset, limit: 10 }, function (err, res) {
    if (err) throw err;
    res.body.forEach(function(msg) {
      var config = JSON.parse(msg.body[0].content);


      if (msg.files.length !== 1) return;
	  var file = msg.files[0];
      if (file.size > 10485760) return;
      ctxioClient.accounts(process.argv[4]).files(file.file_id).content().get(function (err, res) {
        if (err) throw err;
        job.create({
          center_x: config.center_x,
          center_y: config.center_y,
          center_z: config.center_z,
          size_x: config.size_x,
          size_y: config.size_y,
          size_z: config.size_z,
          description: msg.subject,
          email: msg.addresses.from.email
        }, res.body);
      });
    });

    // Save offset to file
    offset += res.body.length; // Number of messages actually returned
    fs.readFileSync(log, offset);
  });
//}, 1000 * 60 * 60);
