var couchbase = require('couchbase');
var _ = require('lodash');
var debug = require('debug')('lounge');
var utils = require('./utils');
var memoize = require('memoizee');

/**
 * Couchbase driver util class. Just wraps couchbase Bucket and overrides some functions.
 * Clients should never have to call this directly.
 *
 * @param {Object} bucket the Couchbase Bucket
 * @constructor
 */
function Driver(bucket) {
  this.bucket = bucket;
  this.getm = memoize(this.get.bind(this), {async: true, length: 1, maxAge: 5000});
}


/**
 * A simplified get for our use. Properly handles key not found errors. In case of multi call, returns array of found
 * and an array of misses.
 * @param {String|Array} keys a single key or multiple keys
 * @param {Object} options Options for bucket `get` function
 * @param {Function} fn callback
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
    debug('driver.getMulti. keys: ' + keys);
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
            errors.push([getRes[k].error]);
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
    debug('driver.get. keys: ' + keys);
    this.bucket.get(keys, options, function (err, getRes) {
      if (err && utils.isKeyNotFound(err)) {
        err = null;
      }

      return fn(err, getRes);
    });
  }
};

/**
 * Our implementation of Bucket.remove that properly ignores key not found errors.
 * @param {String} key document key to remove
 * @param {Object} options Options to pass to Bucket.remove
 * @param {Function} fn callback
 * @returns {*}
 */
Driver.prototype.remove = function (key, options, fn) {
  if (options instanceof Function) {
    fn = options;
    options = {};
  }

  if (!fn) {
    fn = _.noop;
  }

  if (!key) {
    return process.nextTick(function () {
      return fn();
    });
  }

  debug('Driver.remove. key: ' + key);
  this.bucket.remove(key, options, function (err, rres) {
    if (err && utils.isKeyNotFound(err)) {
      err = null;
    }

    return fn(err, rres);
  });
};


/**
 * Wrap the Couchbase bucket and return a new Driver instance.
 * @param bucket {Object} The Couchbase Bucket instance to wrap.
 * @returns {Driver}
 */
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
