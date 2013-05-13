var validator = module.exports = require('validator');
validator.Validator.prototype.init = function(obj) {
  this.obj = obj;
  this.err = {};
  return this;
}
validator.Validator.prototype.chk = function(key, fail_msg, compulsory) {
  this.error = function(msg) {
    if ((this.obj.hasOwnProperty(key) || compulsory) && (!this.err.hasOwnProperty(key))) {
      this.err[key] = msg;
    }
    return this;
  }
  return this.check(this.obj[key], fail_msg);
}
validator.Validator.prototype.failed = function() {
  return Object.keys(this.err).length;
}
validator.Validator.prototype.rng = function(lb, ub) {
  if (!(this.obj[lb] <= this.obj[ub])) {
    this.err[lb] = lb + ' must be less than or equal to ' + ub;
  }
  return this;
}
validator.Filter.prototype.init = function(obj) {
  this.obj = obj;
  this.res = {};
  return this;
}
validator.Filter.prototype.snt = function(key, def) {
  this.modify = function(value) {
    this.res[key] = value;
  }
  return this.sanitize(this.obj.hasOwnProperty(key) ? this.obj[key]: def);
}
validator.Filter.prototype.wrap = function(value) {
  return this;
}
validator.Filter.prototype.copy = function() {
  this.modify(this.str);
  return this.wrap(this.str);
}
validator.Filter.prototype.toLowerCase = function() {
  this.modify(this.str.toLowerCase());
  return this.wrap(this.str);
}
