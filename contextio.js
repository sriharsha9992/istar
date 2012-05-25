#!/usr/bin/env node
// node contextio.js key secret account_id

var fs = require('fs'),
    path = require('path'),
    ContextIO = require('contextio');

// Initialize the context.io client
var ctxioClient = new ContextIO.Client({
  key: process.argv[2],
  secret: process.argv[3]
});

// Read offset from file
var offset = 0;

// Get messages every minute
//setInterval(function() {
  ctxioClient.accounts(process.argv[4]).messages().get({ offset: offset }, function (err, res) {
    if (err) throw err;
    res.body.forEach(function(msg) {
	  console.log(msg.subject);
	  console.log(msg.addresses.from.email);
	  msg.files.forEach(function(file) {
	    if (file.size > 10485760) return;
        ctxioClient.accounts(process.argv[4]).files(file.file_id).content().get(function (err, res) {
          if (err) throw err;
	      switch (path.extname(file.file_name)) {
	        case '.pdbqt':
	          fs.writeFile(file.file_name, res.body);
              break;
			case '.txt':
              var config = JSON.parse(res.body.toString());
              console.log(config.center_x);
              break;
          }
        });
      });
    });
    offset += res.body.length; // Number of messages actually returned
	// Save offset to file
  });
//}, 1000 * 60 * 60);
