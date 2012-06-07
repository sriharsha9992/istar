#!/usr/bin/env node

// Configure express
var express = require('express'),
    app = express.createServer();

app.configure(function(){
  app.use(express.bodyParser());
//app.use(express.cookieParser());
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
var job = require('./job');
app.post('/jobs', function(req, res) {
  job.create({
    center_x: req.param('center_x'),
    center_y: req.param('center_y'),
    center_z: req.param('center_z'),
    size_x: req.param('size_x'),
    size_y: req.param('size_y'),
    size_z: req.param('size_z'),
    description: req.param('description'),
    email: req.param('email')
  }, req.param('receptor'), function(err) {
    res.json(err);
  }, function(_id) {
    res.json({ _id: _id });
  });
});

app.get('/ligands', function(req, res) {
  var mongodb = require("mongodb");
  new mongodb.Db('istar', new mongodb.Server('localhost', 27017)).open(function(err, db) {
    if (err) throw err;
    db.authenticate('guest', '2qR8dVM9d', function(err, result) {
      if (err) throw err;
      db.collection('ligands', function(err, coll) {
        if (err) throw err;
        coll.find({ MWT: {$gte: 300, $lte: 400}, LogP: {$gte: -1, $lte: 6}, NRB: {$gte: 2, $lte: 9}, HBD: {$gte: 1, $lte: 6}, HBA: {$gte: 1, $lte: 10}, Charge: {$gte: -1, $lte: 1}, Desolv_apolar: {$gte: -50, $lte: 50}, Desolv_polar: {$gte: -150, $lte: 0}, tPSA: {$gte: 20, $lte: 80}}).count(function(err, count) {
          if (err) throw err;
          db.close();
		  res.json(count);
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
