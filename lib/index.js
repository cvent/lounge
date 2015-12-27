var _ = require('lodash');
var couchbase = require('couchbase');

var Schema = require('./schema');
var Document = require('./document');
var Model = require('./model');
var utils = require('./utils');
var driver = require('./driver');

var schemaConfigOptions = ['keyPrefix', 'keySuffix', 'refIndexKeyPrefix'];

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
  this.bucket = null;
  this.db = null;
  this.config = _.defaults(options || {}, {
    storeFullReferenceId: false,
    storeFullKey: false,
    alwaysReturnArrays: false,
    refIndexKeyPrefix: '$_ref_by_',
    waitForIndex: false
  });
}

/**
 * Connect to database
 * @param options
 *          connectionString - connection string for the cluster
 *          bucket - name of the bucket or the actual bucket
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

  function retFn(err) {
    return fn(err);
  }

  if (options.bucket && typeof options.bucket === 'object') {
    this.bucket = options.bucket;

    if (this.bucket) {
      this.db = driver.wrap(this.bucket);
      this.db.models = this.models;
    }

    retFn();
  }
  else if (options.bucket && typeof options.bucket === 'string' &&
    options.connectionString && typeof options.connectionString === 'string') {
    var cluster;
    var custerOpts = options.certpath ? {certpath: options.certpath} : null;

    if (mock || process.env.COUCHBASE_MOCK) {
      cluster = new couchbase.Mock.Cluster(options.connectionString, custerOpts);
    }
    else {
      cluster = new couchbase.Cluster(options.connectionString, custerOpts);
    }

    if (options.password) {
      this.bucket = cluster.openBucket(options.bucket, options.password, retFn);
    }
    else {
      this.bucket = cluster.openBucket(options.bucket, retFn);
    }

    if (this.bucket) {
      this.db = driver.wrap(this.bucket);
      this.db.models = this.models;
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
  delete this.db;

  this.models = {};
  this.db = null;
};

/**
 * Creates a schema
 *
 * @api public
 * @function lounge.schema
 * @param {Object} descriptor
 * @param {Object} options
 */

Lounge.prototype.schema = function (descriptor, options) {
  var opts = _.defaults(options || {}, _.pick(this.config, schemaConfigOptions));
  return new Schema(descriptor, opts);
};


/**
 * Creates a model from a schema
 *
 * @api public
 * @function lounge.model
 * @param {String} name
 * @param {Schema} schema
 * @param {Object} options
 */

Lounge.prototype.model = function (name, schema, options) {
  if (!(schema instanceof Schema))
    throw new TypeError('lounge.model expects an instance of Schema. Got \'' + typeof schema + '\'');
  else {
    options = (utils.isPlainObject(options)) ? options : {};

    if (this.models[name])
      return this.models[name];

    var m = Model.compile(name, schema, this.db, this.config, options);
    this.models[name] = m;
    return m;
  }
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
    return this.config[key];
  }

  this.config[key] = value;
  return this;
};

Lounge.prototype.getOption = Lounge.prototype.setOption;

/**
 * Returns an array of model names created on this instance of Mongoose.
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
        return this.bucket[key].apply(this.bucket, arguments);
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
 * The Lounge [Model](#model_Model) constructor.
 *
 * @method Model
 * @api public
 */

Lounge.prototype.Model = Model;

/**
 * The Lounge [Document] constructor.
 *
 * @method Document
 * @api public
 */

Lounge.prototype.Document = Document;

/**
 * The Lounge constructor
 *
 * The exports of the Lounge module is an instance of this class.
 *
 * ####Example:
 *
 *     var lounge = require('lounge');
 *     var lounge = new lounge.Lounge();
 *
 * @method Lounge
 * @api public
 */

Lounge.prototype.Lounge = Lounge;

module.exports = new Lounge;
