var validator = module.exports = require('validator');
validator.Validator.prototype.init = function(job) {
  this.job = job;
  this.err = {};
  return this;
}
validator.Validator.prototype.chk = function(param, fail_msg, compulsory) {
  this.error = function(msg) {
    if ((this.job.hasOwnProperty(param) || compulsory) && (!this.err.hasOwnProperty(param))) {
      this.err[param] = msg;
    }
    return this;
  }
  return this.check(this.job[param], fail_msg);
}
validator.Validator.prototype.rng = function(lb, ub) {
  if (!(this.job[lb] <= this.job[ub])) {
    this.err[lb] = lb + ' must be less than or equal to ' + ub;
  }
  return this;
}
validator.Filter.prototype.init = function (job) {
  this.job = job;
  this.res = {};
  return this;
}
validator.Filter.prototype.snt = function(param, def) {
  this.modify = function(value) {
    this.res[param] = value;
  }
  return this.sanitize(this.job.hasOwnProperty(param) ? this.job[param]: def);
}
