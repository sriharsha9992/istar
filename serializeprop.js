#!/usr/bin/env node

var fs = require('fs');
var buf = new require('buffer').Buffer(26);
var fd = fs.openSync('16_prop.bin', 'w');
require('carrier').carry(fs.createReadStream('16_prop.tsv'), function(line) {
  var t1 = line.indexOf('\t', 3);
  var t2 = line.indexOf('\t', t1 + 5);
  var t3 = line.indexOf('\t', t2 + 2);
  var t4 = line.indexOf('\t', t3 + 2);
  var t5 = line.indexOf('\t', t4 + 2);
  var t6 = line.indexOf('\t', t5 + 2);
  var t7 = line.indexOf('\t', t6 + 2);
  var t8 = line.indexOf('\t', t7 + 2);
  var mwt = parseFloat(line.substr(0, t1));
  var logp = parseFloat(line.substr(t1 + 1, t2 - t1 - 1));
  var ad = parseFloat(line.substr(t2 + 1, t3 - t2 - 1));
  var pd = parseFloat(line.substr(t3 + 1, t4 - t3 - 1));
  var hbd = parseInt(line.substr(t4 + 1, t5 - t4 - 1));
  var hba = parseInt(line.substr(t5 + 1, t6 - t5 - 1));
  var tpsa = parseInt(line.substr(t6 + 1, t7 - t6 - 1));
  var charge = parseInt(line.substr(t7 + 1, t8 - t7 - 1));
  var nrb = parseInt(line.substr(t8 + 1));
//  console.log("%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d", mwt, logp, ad, pd, hbd, hba, tpsa, charge ,nrb);
  buf.writeFloatLE(mwt, 0);
  buf.writeFloatLE(logp, 4);
  buf.writeFloatLE(ad, 8);
  buf.writeFloatLE(pd, 12);
  buf.writeUInt16LE(hbd, 16);
  buf.writeUInt16LE(hba, 18);
  buf.writeUInt16LE(tpsa, 20);
  buf.writeInt16LE(charge, 22);
  buf.writeUInt16LE(nrb, 24);
  fs.writeSync(fd, buf, 0, 26);
});
