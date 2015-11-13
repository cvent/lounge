var _ = require('lodash');
var couchbase = require('couchbase');
var utils = require('./utils');
var Schema = require('./schema');
/* var Connection = require('./connection');
 var Document = require('./document');
 var Model = require('./model');*/

/**
 * Lounge constructor.
 *
 * The exports object of the `lounge` module is an instance of this class.
 * Most apps will only use this one instance.
 *
 * @api public
 */

function Lounge(options) {
  this.models = {};
  this.schemas = {};
  this.options = {};
  this.bucket = null;
  this.cluster = null;
}

/**
 * Connect to database
 * @param options
 *          connectionString - connection string for the cluster
 *          bucket - name of the bucket
 *          password - password
 *          certpath - certpath for cluster
 * @param fn
 * @param mock
 */
Lounge.prototype.connect = function (options, fn, mock) {
  if (typeof fn === 'boolean') {
    mock = fn;
    fn = _.noop;
  }

  if (!fn) {
    fn = _.noop;
  }

  var custerOpts = options.certpath ? {certpath: options.certpath} : null;

  if (mock || process.env.COUCHBASE_MOCK) {
    this.cluster = new couchbase.Mock.Cluster(options.connectionString, custerOpts);
  }
  else {
    this.cluster = new couchbase.Cluster(options.connectionString, custerOpts);
  }

  if (options.bucket) {
    if (options.password) {
      this.bucket = this.cluster.openBucket(options.bucket, options.password, fn);
    }
    else {
      this.bucket = this.cluster.openBucket(options.bucket, fn);
    }
  }
};

/**
 * Disconnect from a specific bucket or from all buckets.
 *
 * @method disconnect
 */
Lounge.prototype.disconnect = function () {
  if (this.bucket) {
    this.bucket.disconnect();
  }

  delete this.models;
  delete this.schemas;
};

/**
 * Sets lounge options
 *
 * ####Example:
 *
 *     lounge.setOption('debug', true) // enable logging collection methods + arguments to the console
 *
 * @param key {String}
 * @param value {mixed}
 * @api public
 */
Lounge.prototype.setOption = function (key, value) {
  if (arguments.length === 1) {
    return this.options[key];
  }

  this.options[key] = value;
  return this;
};

Lounge.prototype.getOption = Lounge.prototype.setOption;

/**
 * Returns an array of model names created on this instance of Mongoose.
 *
 * ####Note:
 *
 * _Does not include names of models created using `connection.model()`._
 *
 * @api public
 * @return {Array}
 */

Lounge.prototype.modelNames = function () {
  return Object.keys(this.models);
};

// methods of default bucket
[
  'append', 'counter', 'get', 'getAndLock', 'getAndTouch', 'getMulti', 'getReplica', 'insert', 'manager', 'prepend',
  'query', 'remove', 'replace', 'set', 'setTranscoder', 'touch', 'unlock', 'upsert'

].forEach(function (key) {
    Lounge.prototype[key] = function () {
      if (this.bucket) {
        return this.defaultBucket[key].apply(this.defaultBucket, arguments);
      }
    }
  });

// properties of default bucket
[
  'configThrottle', 'connectionTimeout', 'durabilityInterval', 'durabilityTimeout', 'managementTimeout',
  'nodeConnectionTimeout', 'operationTimeout', 'viewTimeout'
].forEach(function (key) {
    Object.defineProperty(Lounge.prototype, key, {
      get: propertyGetWrapper(key),
      set: propertySetWrapper(key)
    });
  });

function propertyGetWrapper(key) {
  return function () {
    if (this.bucket) {
      return this.bucket[key];
    }
  }
}
function propertySetWrapper(key) {
  return function (value) {
    if (this.bucket) {
      return this.bucket[key] = value;
    }
  }
}

/**
 * The Lounge [Schema](#schema_Schema) constructor
 *
 * ####Example:
 *
 *     var lounge = require('lounge');
 *     var Schema = lounge.Schema;
 *     var CatSchema = new Schema(..);
 *
 * @method Schema
 * @api public
 */

Lounge.prototype.Schema = Schema;

/**
 * The Lounge constructor
 *
 * The exports of the Lounge module is an instance of this class.
 *
 * ####Example:
 *
 *     var lounge = require('lounge');
 *     var lounge = new mongoose.Lounge();
 *
 * @method Lounge
 * @api public
 */

Lounge.prototype.Lounge = Lounge;

module.exports = new Lounge;