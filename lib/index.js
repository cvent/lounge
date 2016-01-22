var _ = require('lodash');
var couchbase = require('couchbase');
var debug = require('debug')('lounge');

var Schema = require('./schema');
var Document = require('./document');
var CouchbaseDocument = require('./couchdoc');
var Model = require('./model');
var utils = require('./utils');
var driver = require('./driver');

var schemaConfigOptions = utils.schemaConfigOptionKeys;

/**
 * Lounge constructor.
 *
 * The exports object of the `lounge` module is an instance of this class.
 * Most apps will only use this one instance.
 *
 * @api public
 * @param options
 * - `keyPrefix` - key prefix for all keys. No default. Generally useful if you wish to namespace documents. Example: `app::env::`.
 * - `keySuffix` - Similar as prefix but used as a suffix
 * - `storeFullReferenceId` - whether to store embedded document keys as fully expanded keys (with prefix and suffix applied)
 * or just the minimized version. default: false
 * - `storeFullKey` - Similarly to store the fully expanded document key inside the key property. default: false
 * - `alwaysReturnArrays` - set to true to force `findyById` to always return an array of documents even if only
 * a single key is passed in
 * - `refIndexKeyPrefix` - reference lookup index document key prefix. The name of the index is appended. default: '$_ref_by_'
 * - `delimiter` - delimiter string used for concatenation in reference document key expansion / generation.
 * default: '_'. This is prepended to the reference document key.
 * - `waitForIndex` - When documents are saved, indexes are updated. We can wait for this operation to finish before
 * returning from `save()`. Default: false
 * - `minimize` - "minimize" schemas by removing empty objects. Default: true
 */

function Lounge(options) {
  this.models = {};
  this.bucket = null;
  this.db = null;
  this.config = _.defaults(options || {}, utils.defaultOptions);
}

/**
 * Connect to database
 * @api public
 * @param options
 * - `connectionString` - connection string for the cluster
 * - `bucket` - name of the bucket or the actual Couchbase `bucket` instance
 * - `password` - password
 * - `certpath` - certpath for cluster
 * @param {Function} fn callback
 * @param mock {Boolean} whether to use Couchbase mocking mechanism
 * @return {Object} Couchbase Bucket instance
 */
Lounge.prototype.connect = function (options, fn, mock) {
  if (typeof fn === 'boolean') {
    mock = fn;
    fn = _.noop;
  }

  if (!fn) {
    fn = _.noop;
  }

  function retFn(err, bucket) {
    fn(err, bucket || this.bucket);
  }

  if (options.bucket && typeof options.bucket === 'object') {
    this.bucket = options.bucket;

    if (this.bucket) {
      this.db = driver.wrap(this.bucket);
      this.db.models = this.models;
    }

    retFn(null, this.bucket);
  }
  else if (options.bucket && typeof options.bucket === 'string' &&
    options.connectionString && typeof options.connectionString === 'string') {

    debug('connect. cluster: ' + options.connectionString + ' bucket: ' + options.bucket);

    var cluster;
    var custerOpts = options.certpath ? {certpath: options.certpath} : null;

    if (mock || process.env.LOUNGE_COUCHBASE_MOCK) {
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

  return this.bucket;
};

/**
 * Disconnect from the bucket. Deletes all defined models.
 *
 * @api public
 * @method disconnect
 */
Lounge.prototype.disconnect = function () {
  debug('disconnect');
  if (this.bucket) {
    this.bucket.disconnect();
  }

  delete this.models;
  delete this.db;

  this.models = {};
  this.db = null;
};

/**
 * Creates a schema. Prefer to use this over Schema constructor as this will pass along Lounge config settings.
 *
 * @api public
 * @param {Object} descriptor
 * @param {Object} options Schema options
 * @return {Object} created Schema instance
 */

Lounge.prototype.schema = function (descriptor, options) {
  var opts = _.defaults(options || {}, _.pick(this.config, schemaConfigOptions));
  return new Schema(descriptor, opts);
};


/**
 * Creates a model from a schema.
 *
 * @api public
 * @param {String} name name of the model.
 * @param {Schema} schema instance
 * @param {Object} options
 * - `freeze` - to Freeze model. See `Object.freeze`. Default: true
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
 * Returns the model given the name.
 * @param name
 * @returns {*}
 */
Lounge.prototype.getModel = function (name) {
  return this.models[name];
};

/**
 * Sets lounge config options
 *
 * @api public
 * @param key {String} the config key
 * @param value {*} option value
 */
Lounge.prototype.setOption = function (key, value) {
  if (arguments.length === 1) {
    return this.config[key];
  }

  this.config[key] = value;
  return this;
};

/**
 * Get config option.
 * @type {Function|*}
 * @return {*} Option value
 */
Lounge.prototype.getOption = Lounge.prototype.setOption;

/**
 * Returns an array of model names created on this instance of Lounge.
 *
 * @api public
 * @return {Array} Array of model names registered.
 */
Lounge.prototype.modelNames = function () {
  return Object.keys(this.models);
};

/**
 * Inherit all Couchbase Bucket functions and apply them to our bucket
 */
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

/**
 * Inherit all Couchbase Bucket properties and apply them to our bucket
 */
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
 * The Lounge Schema constructor
 *
 * @method Schema
 * @api public
 */

Lounge.prototype.Schema = Schema;

/**
 * The Lounge Model constructor.
 *
 * @method Model
 * @api public
 */

Lounge.prototype.Model = Model;

/**
 * The Lounge CouchbaseDocument constructor.
 *
 * @method CouchbaseDocument
 * @api public
 */

Lounge.prototype.CouchbaseDocument = CouchbaseDocument;

/**
 * The Lounge Document constructor.
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
 * @method Lounge
 * @api public
 */

Lounge.prototype.Lounge = Lounge;

module.exports = new Lounge;
