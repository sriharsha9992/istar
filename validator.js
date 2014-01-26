(function (name, definition) {
    if (typeof module !== 'undefined') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        this[name] = definition();
    }
})('validator', function (validator) {
    'use strict';
	var validator = function(obj) {
		this.obj = obj;
		this.err = {};
		this.res = {};
		return this;
	};
	validator.prototype.field = function(key) {
		this.key = key;
		this.val = this.res[key] === undefined ? this.obj[key] : this.res[key];
		return this;
	};
	validator.prototype.message = function(msg) {
		this.msg = msg;
		return this;
	};
	validator.prototype.error = function() {
		this.err[this.key] = this.msg;
	};
	validator.prototype.length = function(min, max) {
		if (this.val === undefined || !(min <= this.val.length && this.val.length <= max)) this.error();
		return this;
	};
	validator.prototype.min = function(val) {
		if (this.val < val) this.error();
		return this;
	};
	validator.prototype.max = function(val) {
		if (this.val > val) this.error();
		return this;
	};
	validator.prototype.in = function(options) {
		if (!options.indexOf(this.val) == -1) this.error();
		return this;
	};
	validator.prototype.regex = function(regex) {
		if (!regex.test(this.val)) this.error();
		return this;
	};
	validator.prototype.email = function() {
		return this.regex(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/);
	};
	validator.prototype.range = function(key0, key1) {
		if (!(this.res[key0] <= this.res[key1])) {
			this.err[key0] = this.err[key1] = key0 + ' must be less than or equal to ' + key1;
		}
		return this;
	};
	validator.prototype.failed = function() {
		return Object.keys(this.err).length;
	};
	validator.prototype.int = function(def) {
		this.val = this.res[this.key] = this.val === undefined ? def : parseInt(this.val);
		return this;
	};
	validator.prototype.float = function(def) {
		this.val = this.res[this.key] = this.val === undefined ? def : parseFloat(this.val);
		if (isNaN(this.val)) this.error();
		return this;
	};
	validator.prototype.copy = function() {
		this.res[this.key] = this.val;
		return this;
	};
	validator.prototype.xss = function() {
		this.res[this.key] = this.val.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return this;
	};
	return validator;
});
