var inspect = require('util').inspect;
var uuid = require('uuid');
var EventEmitter = require('events').EventEmitter;

var Schema = require('./schema');
var Tree = require('./tree');
var utils = require('./utils');
var docUtil = require('./doc-utils');

module.exports = Document;

/**
 * Base constructor for all created Model instances.
 * Represents just the document data and generic properties and functions.
 * Clients should never have to call this directly.
 *
 * @constructor Model
 * @api public
 * @param {Object} data
 */
function Document(data) {
  var self = this;

  this.$_emitter = new EventEmitter();

  // exposed internal data variable for some extra storage that's not part of document
  this.$_data = {};

  // internal memory
  var table = this.$_table = {};

  // ensure an object if not undefined
  if (data !== undefined && typeof data !== 'object') throw new TypeError('Model expects an object. Got \"' + typeof data + '\"');

  // ensure the schema set
  if (!this.schema || !(this.schema instanceof Schema)) throw new TypeError('.schema hasn\'t been set');

  var build = docUtil.build.bind(this);

  // overload refresh method on prototype
  var refresh = function () {
    if (utils.isFrozen(this)) return false;
    var defineFromTree = docUtil.defineFromTree.bind(this);

    // define
    defineFromTree(self.schema.tree, this, table);
    // free if in strict mode
    if (self.schema.options.strict) utils.freeze(this);
  };

  // overload set method on prototype
  utils.define(this, 'set', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: function (key, value) {
      // allow setting full object data
      if (typeof key === 'object' && !value) {
        for (var k in key) {
          if (key.hasOwnProperty(k)) {
            this.set(k, key[k]);
          }
        }
        return this;
      }
      else if (key && value) {
        // if set for prop is defined try it with that
        if (this[key] && utils.isFunction(this[key].set)) {
          return this[key].set(value);
        }
        return this[key] = value;
      }
    }
  });

  utils.define(this, 'get', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (key) {
      if (table[key]) {
        return table[key];
      }
      else if (self.schema.virtuals[key]) {
        // could be virtual key, shortcut to it
        return this[key];
      }

      return undefined;
    }
  });

  utils.define(this, 'refresh', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: refresh
  });

  var idKey = this.getDocumentKeyKey();

  // call a refresh to init schema
  this.refresh();

  // set  data
  if (data) {
    build(data);
  }

  // handle incoming arrays
  if ('object' == typeof data) {
    var prop;
    for (prop in data) {
      if (data.hasOwnProperty(prop) && utils.isArray(data[prop]) && utils.isArray(this[prop])) {
        data[prop].forEach(function (v) {
          this.push(v);
        }, this[prop]);
      }
    }
  }

  // auto generate document key if needed
  if (this.schema.key.generate === true && !self.$_table[idKey]) {
    self.set([idKey], uuid.v4());
  }

  // if they supplied init() method
  if (this.init && typeof this.init === 'function') {
    this.init();
  }

  return this;
}

/**
 * Document exposes the NodeJS EventEmitter API, so you can use `on`, `once`, `emit`, etc.
 */
['on', 'once', 'emit', 'listeners', 'removeListener', 'setMaxListeners',
  'removeAllListeners', 'addListener'].forEach(
  function (emitterFn) {
    Document.prototype[emitterFn] = function () {
      return this.$_emitter[emitterFn].apply(this.$_emitter, arguments);
    };
  });

/**
 * A reference to the schema instance for the model.
 *
 * @api public
 * @property {Schema} schema
 */
Document.prototype.schema;

/**
 * Refreshes the state of the model based on its schema.
 *
 * @api public
 */
Document.prototype.refresh = function () {
};


/**
 * Sets data on the model based on the schema.
 * Accepts a key of property and value for the property, or object representing the data for document.
 *
 * @api public
 */
Document.prototype.set = function () {
};

/*!
 * Actual internal implementation of toObject
 * @param options
 * @param json
 * @returns {Object|{}}
 */
Document.prototype.$_toObject = function (options, json) {
  var defaultOptions = {transform: true, json: json, minimize: true};

  // When internally saving this document we always pass options,
  // bypassing the custom schema options.
  if (!(options && 'Object' === utils.getFunctionName(options.constructor)) ||
    (options && options.$_useSchemaOptions)) {
    if (json) {
      options = this.schema.options.toJSON ?
        docUtil.clone(this.schema.options.toJSON) : {};
      options.json = true;
      options.$_useSchemaOptions = true;
    } else {
      options = this.schema.options.toObject ?
        docUtil.clone(this.schema.options.toObject) : {};
      options.json = false;
      options.$_useSchemaOptions = true;
    }
  }

  for (var key in defaultOptions) {
    if (defaultOptions.hasOwnProperty(key) && options[key] === undefined) {
      options[key] = defaultOptions[key];
    }
  }

  // remember the root transform function
  // to save it from being overwritten by sub-transform functions
  var originalTransform = options.transform;

  var ret = docUtil.clone(this.$_table, options) || {};

  if (options.virtuals) {
    applyGetters(this, ret, 'virtuals', options);
  }

  applyDocumentKey(this, ret, options);

  var transform = options.transform;

  // In the case where a subdocument has its own transform function, we need to
  // check and see if the parent has a transform (options.transform) and if the
  // child schema has a transform (this.schema.options.toObject) In this case,
  // we need to adjust options.transform to be the child schema's transform and
  // not the parent schema's
  if (true === transform || (this.schema.options.toObject && transform)) {

    var opts = options.json ? this.schema.options.toJSON : this.schema.options.toObject;

    if (opts) {
      transform = (typeof options.transform === 'function' ? options.transform : opts.transform);
    }
  } else {
    options.transform = originalTransform;
  }

  if (typeof transform === 'function') {
    var xformed = transform(this, ret, options);
    if (typeof xformed !== 'undefined') {
      ret = xformed;
    }
  }

  return ret;
};

/*!
 * Applies virtuals properties to `json`.
 *
 * @api internal
 * @param {Document} self
 * @param {Object} json
 * @param {String} type either `virtuals` or `paths`
 * @param {Object} options
 * @return {Object} `json`
 */
function applyGetters(self, json, type, options) {
  var schema = self.schema,
    paths = Object.keys(schema[type]),
    i = paths.length,
    path;

  while (i--) {
    path = paths[i];

    var parts = path.split('.'),
      plen = parts.length,
      last = plen - 1,
      branch = json,
      part;

    for (var ii = 0; ii < plen; ++ii) {
      part = parts[ii];
      if (ii === last) {
        branch[part] = docUtil.clone(self.get(path), options);
      } else {
        branch = branch[part] || (branch[part] = {});
      }
    }
  }

  return json;
}

/*!
 * Applies document key
 * @param self
 * @param ret
 * @param options
 */
function applyDocumentKey(self, ret, options) {
  var schemaOption = options.json ? 'toJSON' : 'toObject';

  var expandDocumentKey;
  if (utils.isBoolean(options.expandDocumentKey)) {
    expandDocumentKey = options.expandDocumentKey;
  }
  if (!utils.isBoolean(expandDocumentKey)) {
    expandDocumentKey = utils.isPlainObject(self.schema.options[schemaOption]) &&
    utils.isBoolean(self.schema.options[schemaOption].expandDocumentKey) ?
      self.schema.options[schemaOption].expandDocumentKey : false;
  }

  if (expandDocumentKey) {
    var k = self.getDocumentKeyKey();
    ret[k] = self.getDocumentKeyValue(true);
  }
}

/**
 * Converts this document into a plain javascript object.
 *
 * @api public
 * @param {Object} options
 * - `transform` - a transform function to apply to the resulting document before returning
 * - `virtuals` - apply virtual getters (defaults to false)
 * - `minimize` - remove empty objects (defaults to true)
 *
 * @return {Object} Plain javascript object representation of document.
 */
Document.prototype.toObject = function (options) {
  return this.$_toObject(options);
};

/**
 * Similar as toObject but applied when JSON.stringify is called
 *
 * @api public
 * @param {Object} options
 * - `transform` - a transform function to apply to the resulting document before returning
 * - `virtuals` - apply virtual getters (defaults to false)
 * - `minimize` - remove empty objects (defaults to true)
 */
Document.prototype.toJSON = function (options) {
  return this.$_toObject(options, true);
};

/**
 * Helper for console.log. Just invokes default `toObject`.
 * @api public
 */
Document.prototype.inspect = function () {
  return inspect(this.toObject({}));
};

/**
 * Helper for console.log. Alias for inspect.
 * @api public
 */
Document.prototype.toString = Document.prototype.inspect;

/**
 * Helper function to get the document key.
 * @api public
 * @param {Boolean} full If `true` the full expanded value of the key will be returned.
 *                  If there were any suffix and / or prefix defined in schema they are applied.
 * @returns {string} document key
 */
Document.prototype.getDocumentKeyValue = function (full) {
  var idKey = this.getDocumentKeyKey();

  return this.schema.getDocumentKeyValue(this.$_table[idKey], full);
};

/**
 * Static version of getDocumentKeyValue.
 * @api public
 * @param {String} id id of the document
 * @param {Boolean} full If `true` the full expanded value of the key will be returned.
 *                  If there were any suffix and / or prefix defined in schema they are applied.
 * @returns {string} Document key / id
 */
Document.getDocumentKeyValue = function (id, full) {
  return this.schema.getDocumentKeyValue(id, full);
};

/**
 * Gets the Document key property name.
 * @api public
 * @returns {String} Document key property name
 */
Document.prototype.getDocumentKeyKey = function () {
  return this.schema.key.docKeyKey;
};

/**
 * The name of the model.
 *
 * @api public
 * @property modelName
 */
Document.prototype.modelName;

/**
 * Returns a value representation of a Model instance
 *
 * @api public
 * @return {Object} Plain javascript object
 */
Document.prototype.valueOf = function () {
  return this.toObject();
};