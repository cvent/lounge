var couchbase = require('couchbase');
var _ = require('lodash');
var utils = require('./utils');

function Driver(bucket) {
  this.bucket = bucket;
}

/**
 * A simplified get for our use.
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

  if (!keys || (Array.isArray(keys) && !keys.length)) {
    return process.nextTick(function () {
      return fn();
    });
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
          else if (getRes[k].error && utils.isKeyNotFound(getRes[k].error)) {
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
        if (utils.isKeyNotFound(err)) {
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
