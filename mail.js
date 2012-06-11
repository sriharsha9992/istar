#!/usr/bin/env node

// Set up validator
var validator = require('validator'),
    Validator = validator.Validator;
Validator.prototype.error = function(msg) {
  this._errors.push(msg);
}
Validator.prototype.getErrors = function() {
  return this._errors;
}
// Define helper variables
var fs = require('fs');
var job = require('./job');
// Parse server configuration file
fs.readFile('mail.conf', function(err, data) {
  if (err) throw err;
  var conf = JSON.parse(data);
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
//  setInterval(function() {
      ctxioClient.accounts(conf.account_id).messages().get({ include_body: 1, body_type: 'text/plain', offset: offset, limit: 10 }, function(err, res) {
        if (err) throw err;
        res.body.forEach(function(msg) {
          // Parse and validate JSON body
          var config = JSON.parse(msg.body[0].content);
          var val = new Validator();
          val.check(config.center_x).isDecimal();
          val.check(config.center_y).isDecimal();
          val.check(config.center_z).isDecimal();
          val.check(config.size_xg).isInt();
          val.check(config.size_x).min(1);
          val.check(config.size_x).max(30);
          val.check(config.size_y).isInt();
          val.check(config.size_y).min(1);
          val.check(config.size_y).max(30);
          val.check(config.size_z).isInt()
          val.check(config.size_z).min(1);
          val.check(config.size_z).max(30);
          val.check(config.description).len(1, 1000);
          val.check(msg.addresses.from.email).isEmail();
          if (val.getErrors().length) return;
          // There should be only one attachment and its size should not exceed 10MB
          if (msg.files.length !== 1) return;
          var file = msg.files[0];
          if (file.size > 10485760) return;
          // Retrieve file content as receptor
          ctxioClient.accounts(conf.account_id).files(file.file_id).content().get(function(err, res) {
            if (err) throw err;
            job.create({
              center_x: validator.sanitize(config.center_x).toFloat(),
              center_y: validator.sanitize(config.center_y).toFloat(),
              center_z: validator.sanitize(config.center_z).toFloat(),
              size_x: validator.sanitize(config.size_x).toInt(),
              size_y: validator.sanitize(config.size_y).toInt(),
              size_z: validator.sanitize(config.size_z).toInt(),
              description: validator.sanitize(msg.subject).xss(),
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
//  }, 1000 * 60 * 60);
  });
});
