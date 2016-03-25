const _ = require('lodash');
const debug = require('debug')('lounge');
const utils = require('./utils');

export default class Driver {
  /**
   * @classdesc Couchbase driver util class. Just wraps couchbase Bucket and overrides some functions.
   *
   * @description Clients should never have to call this directly.
   * @param {Object} bucket the Couchbase <code>Bucket</code>
   * @class
   */
  constructor(bucket) {
    this.bucket = bucket;
  }

  /**
   * A simplified get for our use. Properly handles key not found errors. In case of multi call, returns array of found
   * and an array of misses.
   * @param {String|Array} keys - a single key or multiple keys
   * @param {Object} options - Options for bucket <code>get</code> function
   * @param {Function} fn callback
   */
  get(keys, options, fn) {
    if (options instanceof Function) {
      fn = options;
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    if (!keys || (Array.isArray(keys) && !keys.length)) {
      return process.nextTick(() => {
        return fn();
      });
    }

    if (Array.isArray(keys)) {
      debug(`driver.getMulti. keys: ${keys}`);
      this.bucket.getMulti(keys, (err, getRes) => {
        const misses = [];
        const results = [];
        let errors = [];

        keys.forEach(k => {
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
      debug(`driver.get. keys: ${keys}`);
      this.bucket.get(keys, options, (err, getRes) => {
        if (err && utils.isKeyNotFound(err)) {
          err = null;
        }

        return fn(err, getRes);
      });
    }
  }

  /**
   * Our implementation of Bucket.remove that properly ignores key not found errors.
   * @param {String} key - document key to remove
   * @param {Object} options - Options to pass to Bucket.remove
   * @param {Function} fn - callback
   * @returns {*}
   */
  remove(key, options, fn) {
    if (options instanceof Function) {
      fn = options;
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    if (!key) {
      return process.nextTick(() => {
        return fn();
      });
    }

    debug(`Driver.remove. key: ${key}`);
    this.bucket.remove(key, options, (err, rres) => {
      if (err && utils.isKeyNotFound(err)) {
        err = null;
      }

      return fn(err, rres);
    });
  }

  /**
   * Wrap the Couchbase bucket and return a new <code>Driver</code> instance.
   * @param bucket {Object} The Couchbase <code>Bucket</code> instance to wrap.
   * @returns {Driver}
   */
  static wrap(bucket) {
    const bucketPrototype = Object.getPrototypeOf(bucket);

    const fnNames = [];
    let p;
    for (p in bucketPrototype) {
      if (bucketPrototype.hasOwnProperty(p) && p.charAt(0) !== '_' &&
        typeof bucketPrototype[p] === 'function' && !Driver.prototype[p]) {
        fnNames.push(p);
      }
    }

    fnNames.forEach(fnName => {
      Driver.prototype[fnName] = function () {
        this.bucket[fnName](...arguments);
      };
    });

    return new Driver(bucket);
  }
}
