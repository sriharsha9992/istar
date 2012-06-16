var validator = module.exports = require('validator');
validator.Validator.prototype.init = function(obj) {
  this.obj = obj;
  this.err = {};
  return this;
}
validator.Validator.prototype.chk = function(param, fail_msg, compulsory) {
  this.error = function(msg) {
    if ((this.obj.hasOwnProperty(param) || compulsory) && (!this.err.hasOwnProperty(param))) {
      this.err[param] = msg;
    }
    return this;
  }
  return this.check(this.obj[param], fail_msg);
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
validator.Filter.prototype.init = function (obj) {
  this.obj = obj;
  this.res = {};
  return this;
}
validator.Filter.prototype.snt = function(param, def) {
  this.modify = function(value) {
    this.res[param] = value;
  }
  return this.sanitize(this.obj.hasOwnProperty(param) ? this.obj[param]: def);
}
validator.Filter.prototype.wrap = function(value) {
  return this;
}

