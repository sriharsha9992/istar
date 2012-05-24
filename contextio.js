#!/usr/bin/env node
// node contextio.js key secret account_id

var ContextIO = require('contextio');

// Initialize the context.io client
var ctxioClient = new ContextIO.Client({
  key: process.argv[2],
  secret: process.argv[3]
});

// Get messages
ctxioClient.accounts(process.argv[4]).messages().get({ include_body: 1, body_type: 'text/plain', offset: 0, limit: 10 }, function (err, res) {
  if (err) throw err;
  res.body.forEach(function(msg) {
    var content = msg.body[0].content;
	console.log(content);
    var data = JSON.parse(content);
	console.log(data.center_x);
  });
});