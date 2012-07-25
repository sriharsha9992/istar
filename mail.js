#!/usr/bin/env node

// Define helper variables
var fs = require('fs');
var idock = require('./idock');
// Parse server configuration file
fs.readFile('mail.conf', function (err, data) {
  if (err) throw err;
  var conf = JSON.parse(data);
  // Initialize context.io client
  var ContextIO = require('contextio');
  var ctxioClient = new ContextIO.Client({
    key: conf.key,
    secret: conf.secret
  });
  // Read offset from file
  fs.readFile('mail.offset', function (err, data) {
    if (err) throw err;
    var offset = parseInt(data);
    // Get messages every hour
//  setInterval(function () {
      ctxioClient.accounts(conf.account_id).messages().get({ include_body: 1, body_type: 'text/plain', offset: offset, limit: 10 }, function (err, res) {
        if (err) throw err;
        res.body.forEach(function (msg) {
          // Parse and validate JSON body
          var j = JSON.parse(msg.body[0].content);
          j.email = msg.addresses.from.email;
          // There should be only one attachment and its size must not exceed 10MB
          if (msg.files.length !== 1) return;
          var file = msg.files[0];
          if (file.size > 10485760) return;
          // Retrieve file content as receptor
          ctxioClient.accounts(conf.account_id).files(file.file_id).content().get(function (err, res) {
            if (err) throw err;
	        j.receptor = res.body;
            idock.create(j);
          });
        });
        // Aggregate the number of messages actually returned
        offset += res.body.length;
        // Save offset to file
        fs.writeFile('mail.offset', offset, function (err) {
          if (err) throw err;
        });
      });
//  }, 1000 * 60 * 60);
  });
});
