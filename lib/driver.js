var couchbase = require('couchbase');
var _ = require('lodash');
var util = require("util");
var errors = couchbase.errors;

function isKeyNotFound(err) {
  var keyNotFound = false;
  if (err) {
    if (err.message && err.message === 'key not found') {
      keyNotFound = true;
    }
    else if (err.message && err.message.indexOf('key does not exist') >= 0) {
      keyNotFound = true;
    }
    else if (err.message && err.message.indexOf('key not found') >= 0) {
      keyNotFound = true;
    }
    else if (err.code && err.code === errors.keyNotFound) {
      keyNotFound = true;
    }
    else if (err.code && err.code.toString() === '13') {
      keyNotFound = true;
    }
  }

  return keyNotFound;
}

function Driver(bucket) {
  this.bucket = bucket;
}

/**
 * A simplified get for out use.
 * @param keys a single key or multiple keys
 * @param options
 * @param fn
 */
Driver.prototype.get = function (keys, options, fn) {
  if (options instanceof Function) {
    fn = options;
    options = {};
  }

  if (!fn) {
    fn = _.noop;
  }

  if (Array.isArray(keys)) {
    this.bucket.getMulti(keys, function (err, getRes) {
      var misses = [];
      var results = [];
      var errors = [];

      keys.forEach(function (k) {
        if (getRes.hasOwnProperty(k) && getRes[k]) {
          if (getRes[k].value) {
            results.push({
              value: getRes[k].value,
              cas: getRes[k].cas
            });
          }
          else if (getRes[k].error && isKeyNotFound(getRes[k].error)) {
            misses.push(k);
          }
          else if (getRes[k].error) {
            errors.push[getRes[k].error];
          }
        }
      });

      if (errors.length === 0) {
        errors = null;
      }

      return fn(errors, results, misses);
    });
  }
  else {
    this.bucket.get(keys, options, function (err, getRes) {
      if (err) {
        if (isKeyNotFound(err)) {
          return fn();
        }
        return fn(err);
      }

      return fn(null, getRes);
    });
  }
};

exports.wrap = function (bucket) {
  var bucketPrototype = Object.getPrototypeOf(bucket);

  var fnNames = [];
  var p;
  for (p in bucketPrototype) {
    if (bucketPrototype.hasOwnProperty(p) && p.charAt(0) !== '_' &&
      typeof bucketPrototype[p] === 'function' && !Driver.prototype[p]) {
      fnNames.push(p);
    }
  }

  fnNames.forEach(function (fnName) {
    Driver.prototype[fnName] = function () {
      this.bucket[fnName].apply(this.bucket, arguments);
    }
  });

  return new Driver(bucket);
};