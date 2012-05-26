#!/usr/bin/env node

var fs = require('fs'),
    mongodb = require("mongodb");

// Parse server configuration file
var conf = JSON.parse(fs.readFileSync('mail.conf'));

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
    cb && cb(errors);
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
    if (err) throw err;
    db.authenticate('daemon', '2qR8dVM9d', function(err, result) {
      if (err) throw err;
      db.collection('jobs', function(err, collection) {
        if (err) throw err;
        collection.insert(job, { safe: true }, function(err, docs) {
          if (err) throw err;
          db.close();
          var _id = docs[0]._id;
          cb && cb(_id);

          // Create job folder and save receptor
          var folder = __dirname + '/public/jobs/' + _id;
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

// Initialize context.io client
var ContextIO = require('contextio');
var ctxioClient = new ContextIO.Client({
  key: conf.key,
  secret: conf.secret
});

// Read offset from file
fs.readFile('mail.offset', function(err, data) {
  if (err) throw err;
  var offset = parseInt(data);

  // Get messages every hour
//setInterval(function() {
    ctxioClient.accounts(conf.account_id).messages().get({ include_body: 1, body_type: 'text/plain', offset: offset, limit: 10 }, function(err, res) {
      if (err) throw err;
      res.body.forEach(function(msg) {

        // Parse JSON body into config
        var config = JSON.parse(msg.body[0].content);

        // There should be only one attachment and its size should not exceed 10MB
        if (msg.files.length !== 1) return;
        var file = msg.files[0];
        if (file.size > 10485760) return;

        // Retrieve file content as receptor
        ctxioClient.accounts(conf.account_id).files(file.file_id).content().get(function(err, res) {
          if (err) throw err;
          create({
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

      // Aggregate the number of messages actually returned
      offset += res.body.length;

      // Save offset to file
      fs.writeFile('mail.offset', offset, function(err) {
        if (err) throw err;
      });
    });
//}, 1000 * 60 * 60);
});
