#!/usr/bin/env node

// Require express
var express = require('express'),
    app = express.createServer(),
    expressValidator = require('express-validator');

// Configure express
app.configure(function(){
  app.use(express.bodyParser());
//  app.use(express.cookieParser());
  app.use(expressValidator);
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000; // 1000 * 60 * 60 * 24 * 365.25
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.favicon(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

// Configure routes
app.post('/jobs', function(req, res) {

  // Validate user input
  req.check('receptor', 'receptor must be provided').len(1, 10485760);
  req.check('center_x', 'center_x must be a decimal').isDecimal();
  req.check('center_y', 'center_y must be a decimal').isDecimal();
  req.check('center_z', 'center_z must be a decimal').isDecimal();
  req.check('size_x', 'size_x must be within [1, 30]').isInt().min(1).max(30);
  req.check('size_y', 'size_y must be within [1, 30]').isInt().min(1).max(30);
  req.check('size_z', 'size_z must be within [1, 30]').isInt().min(1).max(30);
  req.check('description', 'description must be provided').len(1, 1000);
  req.check('email', 'email must be provided').isEmail();

  // Obtain validation errors
  var err = req.validationErrors();
  if (err) {
    res.json(err);
    return;
  }

  // Sanitize user input
  req.sanitize('receptor').xss();
  req.sanitize('center_x').toFloat();
  req.sanitize('center_y').toFloat();
  req.sanitize('center_z').toFloat();
  req.sanitize('size_x').toInt();
  req.sanitize('size_y').toInt();
  req.sanitize('size_z').toInt();
  req.sanitize('description').xss();

  // Insert the new job into MongoDB
  var mongodb = require("mongodb");
  new mongodb.Db('istar', new mongodb.Server('137.189.90.124', 27017)).open(function(err, db) {
    db.authenticate('daemon', '2qR8dVM9d', function(err, result) {
      db.collection('jobs', function(err, collection) {
        collection.insert({ // Note that receptor is not inserted.
          center_x: req.param('center_x'),
          center_y: req.param('center_y'),
          center_z: req.param('center_z'),
          size_x: req.param('size_x'),
          size_y: req.param('size_y'),
          size_z: req.param('size_z'),
          description: req.param('description'),
          email: req.param('email'),
          ip: req.connection.remoteAddress,
          time: Date.now()
//        min_mw: min_mw,
//        max_mw: max_mw,
//        slices: slices,
//        progress: 0,
        }, { safe: true }, function(err, docs) {
          db.close();

          // Create a job folder and dump the receptor.
          var _id = docs[0]._id,
              folder = __dirname + '/public/jobs/' + _id,
              fs = require('fs');
          fs.mkdir(folder, function() {
            fs.writeFile(folder + '/receptor.pdbqt', req.param('receptor'));
          });
          res.json({ _id: _id }); // Or write cookie?
        });
      });
    });
  });
});

// Fork child processes with cluster
var cluster = require('cluster');
if (cluster.isMaster) {
  var numCPUs = require('os').cpus().length;
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('death', function(worker) {
    console.log('Worker process ' + worker.pid + ' died. restart...');
    cluster.fork();
  });
} else {
  var port = 3000;
  app.listen(port);
  console.log('Worker %d running express server listening on port %d in %s mode', process.env.NODE_WORKER_ID, port, app.settings.env);
}
