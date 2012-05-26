#!/usr/bin/env node
// node contextio.js key secret account_id

var fs = require('fs'),
    path = require('path'),
    ContextIO = require('contextio'),
//    validator = require('node-validator'),
    job = require('./job.js');

// Initialize the context.io client
var ctxioClient = new ContextIO.Client({
  key: process.argv[2],
  secret: process.argv[3]
});

// Read offset from file
var log = 'contextio.log',
    offset = parseInt(fs.readFileSync(log));

// Get messages every minute
//setInterval(function() {
  ctxioClient.accounts(process.argv[4]).messages().get({ include_body: 1, body_type: 'text/plain', offset: offset, limit: 10 }, function (err, res) {
    if (err) throw err;
    res.body.forEach(function(msg) {
      var config = JSON.parse(msg.body[0].content);
      // Validate user input
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
