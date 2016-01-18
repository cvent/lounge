var _ = require('lodash');
var inflection = require('inflection');
var traverse = require('traverse');

var utils = require('./utils');
var Tree = require('./tree');
var Model;

/**
 * Creates an object schema
 *
 * @constructor Schema
 * @api public
 * @param {Object} descriptor
 * @param {Object} options
 * - keyPrefix - key prefix for all keys. No default. Generally useful if you wish to namespace documents. Example: `app::env::`.
 * - keySuffix - Similar as prefix but used as a suffix
 * - refIndexKeyPrefix - reference lookup index document key prefix. The name of the index is appended. Default: '$_ref_by_'
 * - delimiter - delimiter string used for concatenation in reference document key expansion / generation.
 * default: '_'. This is prepended to the reference document key.
 * - minimize - "minimize" schemas by removing empty objects. Default: true
 * - toObject - toObject method options, transform, virtuals and minimize
 * - toJSON - toJSON method options, similar to above
 * - strict - ensures that value passed in ot assigned that were not specified in our schema do not get saved
 */
function Schema(descriptor, options) {
  if (!(this instanceof Schema))
    return new Schema(obj, options);

  this.callQueue = [];
  this.virtuals = {};
  this.refs = {};
  this.indexes = {};

  var schemaDefaults = {
    strict: true
  };

  // attach options
  this.options = _.defaults(utils.isPlainObject(options) ? options : {},
    schemaDefaults,
    _.pick(utils.defaultOptions, utils.schemaConfigOptionKeys));

  // document key settings
  this.key = {
    docKeyKey: '',
    prefix: null,
    suffix: null,
    generate: true
  };

  // we must use plain objects
  if (typeof descriptor !== 'undefined' && !utils.isPlainObject(descriptor))
    throw new TypeError('Schema only expects an object as a descriptor. Got \'' + typeof descriptor + '\'');

  // create tree instance with an empty object
  this.tree = new Tree({});

  // add descriptor to tree
  this.add(descriptor);

  // apply these if needed
  if (!this.key.prefix && utils.isString(this.options.keyPrefix)) {
    this.key.prefix = this.options.keyPrefix;
  }

  if (!this.key.suffix && utils.isString(this.options.keySuffix)) {
    this.key.suffix = this.options.keySuffix;
  }
}

/*!
 * Apply document key from descriptor
 * @param descriptor
 */
Schema.prototype.$_applyDocumentKey = function (descriptor) {
  var self = this;
  //find the document key key
  var docKeyFound = false;
  for (var prop in descriptor) {
    if (descriptor.hasOwnProperty(prop)) {
      if (utils.isPlainObject(descriptor[prop]) && descriptor[prop].key === true) {
        if (descriptor[prop].index === true) {
          throw new TypeError('Schema key cannot be index field');
        }

        if (descriptor[prop].ref) {
          throw new TypeError('Schema key cannot be reference property');
        }

        docKeyFound = true;
        self.key.generate = false;

        self.key.docKeyKey = prop;
        if (utils.isString(descriptor[prop].prefix)) {
          self.key.prefix = descriptor[prop].prefix;
        }

        if (utils.isString(descriptor[prop].suffix)) {
          self.key.suffix = descriptor[prop].suffix;
        }

        if (utils.isBoolean(descriptor[prop].generate)) {
          self.key.generate = descriptor[prop].generate;
        }
      }
    }
  }

  if (!docKeyFound && !this.key.docKeyKey) {
    // manually add one, should be one-op
    this.key.docKeyKey = 'id';
    this.tree.add.call(this.tree, this.key.docKeyKey, String);
  }

  if (this.tree[this.key.docKeyKey] &&
    this.tree[this.key.docKeyKey].Constructor !== String &&
    this.tree[this.key.docKeyKey].Constructor !== Number) {

    throw new TypeError('Schema expects key to be a String or a Number');
  }
};

/*!
 * Find all embedded documents
 * @param descriptor
 */
Schema.prototype.$_getRefs = function (descriptor) {
  if (!Model) {
    Model = require('./model');
  }

  var self = this;

  var refs = [];
  traverse(descriptor).forEach(function (obj) {
    var ctx = this;
    if (obj && ((obj.__proto__ === Model && obj.modelName) || (obj.type === Model && obj.modelName))) {
      var path = ctx.path.join('.');

      // check if we specifically set type
      var lastElement = ctx.path[ctx.path.length - 1];
      if (lastElement) {
        var lev = lastElement.toLowerCase();
        if (lev === 'type') {
          path = ctx.path.slice(0, ctx.path.length - 1).join('.')
        }
      }

      // check if in array
      var reg = new RegExp('^\\d+$');
      var lastPath = path.substring(path.lastIndexOf('.') + 1);
      if (lastPath && reg.test(lastPath)) {
        path = path.substring(0, path.lastIndexOf('.'));
      }

      refs.push({
        path: path,
        ref: obj.modelName
      });
    }
  });

  refs = _.compact(refs);

  if (refs && refs.length > 0) {
    refs.forEach(function (elem) {
      self.refs[elem.path] = elem;
    });
  }

};

/*!
 * Find all indexes
 * @param descriptor
 */
Schema.prototype.$_getIndexes = function (descriptor) {
  var self = this;
  var inds = [];

  traverse(descriptor).forEach(function (obj) {
    var ctx = this;
    if (obj && obj.index === true && (obj.type || obj.Type)) {
      var t = obj.type || obj.Type;
      if (t === String || t === Number) {
        var path = ctx.path.join('.');

        // check if we specifically set type
        var lastElement = ctx.path[ctx.path.length - 1];
        if (lastElement) {
          var lev = lastElement.toLowerCase();
          if (lev === 'type') {
            path = ctx.path.slice(0, ctx.path.length - 1).join('.')
          }
        }

        // check if in array
        var reg = new RegExp('^\\d+$');
        var lastPath = path.substring(path.lastIndexOf('.') + 1);
        if (lastPath && reg.test(lastPath)) {
          path = path.substring(0, path.lastIndexOf('.'));
        }

        var name = obj.indexName;
        if (!name) {
          name = ctx.key;
          if (reg.test(name)) {
            name = ctx.path[ctx.path.length - 2];
          }
          name = inflection.singularize(name);
        }

        inds.push({
          path: path,
          name: name
        });
      }
    }
  });

  inds = _.compact(inds);

  if (inds && inds.length > 0) {
    inds.forEach(function (elem) {
      self.indexes[elem.path] = elem;
    });
  }
};

/**
 * Adds an object to the schema definition
 *
 * @api public
 * @param {String} key the key for new property
 * @param {Object} descriptor the property / type descriptor
 */
Schema.prototype.add = function (key, descriptor) {
  // ORDER MATTERS

  // adjust our descriptor
  var d;
  if (key && descriptor) {
    if (!this.descriptor) {
      this.descriptor = {};
    }
    d = utils.cloneDeep(descriptor);
    this.descriptor[key] = d;
  }
  else if (typeof key === 'object' && !descriptor) {
    if (!this.descriptor) {
      this.descriptor = utils.cloneDeep(key);
      d = this.descriptor;
    }
    else {
      d = utils.cloneDeep(key);
      var prop;
      for (prop in d) {
        if (d.hasOwnProperty(prop) && d[prop]) {
          this.descriptor[prop] = d[prop];
        }
      }
    }
  }

  // before add
  this.$_getRefs(d);
  this.$_getIndexes(d);

  this.tree.add.apply(this.tree, arguments);

  // after add
  this.$_applyDocumentKey(d);
};


/**
 * Creates a static function for the created model.
 * An object of function names and functions can also be passed in.
 *
 * @api public
 * @param {String} name name of the statuc function
 * @param {Function} func the actual function
 */

Schema.prototype.static = function (name, func) {
  if (utils.isPlainObject(name)) {
    for (func in name) {
      this.static(func, name[func]);
    }
  }
  else {
    if (!utils.isString(name)) throw new TypeError('Schema#static expects a string identifier as a function name');
    else if (!utils.isFunction(func)) throw new TypeError('Schema#static expects a function as a handle');
    this.add(name, {type: Function, static: true, value: func});
  }
};

/**
 * Creates a instance method for the created model.
 * An object of function names and functions can also be passed in.
 *
 * @api public
 * @param {String} name the name of the method
 * @param {Function} func the actual function implementation
 */

Schema.prototype.method = function (name, func) {
  if (utils.isPlainObject(name)) {
    for (func in name) {
      this.method(func, name[func]);
    }
  }
  else {
    if (!utils.isString(name)) throw new TypeError('Schema#method expects a string identifier as a function name');
    else if (!utils.isFunction(func)) throw new TypeError('Schema#method expects a function as a handle');
    this.add(name, {type: Function, method: true, value: func});
  }
};

/**
 * Creates a virtual property for the created model with the given object
 * specifying the get and optionally set function
 *
 * @api public
 * @param {String} name name of the virtual property
 * @param {Object} options virtual options
 * - get - the virtual getter function
 * - set - the virtual setter function
 */

Schema.prototype.virtual = function (name, options) {
  if (!utils.isString(name)) throw new TypeError('Schema#virtual expects a string identifier as a property name');
  else if (!utils.isPlainObject(options)) throw new TypeError('Schema#virtual expects an object as a handle');
  else if (!utils.isFunction(options.get)) throw new TypeError('Schema#virtual expects an object with a get function');

  var virtualTypeObj = {type: Object, virtual: true, value: options};
  this.virtuals[name] = virtualTypeObj;
  this.add(name, virtualTypeObj);
};

/**
 * Defines a pre hook for the schema.
 */
Schema.prototype.pre = function () {
  return this.queue('pre', arguments);
};

/**
 * Defines a post hook for the schema.
 */
Schema.prototype.post = function (method, fn) {
  return this.queue('post', arguments);
};

/**
 * Adds a method call to the queue.
 *
 * @param {String} name name of the document method to call later
 * @param {Array} args arguments to pass to the method
 * @api private
 */

Schema.prototype.queue = function (name, args) {
  var q = {hook: name, args: args};
  if (args[0] && typeof args[0] === 'string') {
    q.hooked = args[0];
  }

  this.callQueue.push(q);
};

/**
 * Sets/gets a schema option.
 *
 * @param {String} key option name
 * @param {Object} [value] if not passed, the current option value is returned
 * @api public
 */

Schema.prototype.set = function (key, value) {
  if (1 === arguments.length) {
    return this.options[key];
  }

  this.options[key] = value;

  return this;
};

/**
 * Gets a schema option.
 *
 * @api public
 * @param {String} key option name
 * @return {*} the option value
 */

Schema.prototype.get = function (key) {
  return this.options[key];
};

/**
 * Helper function to get the document key
 * @param id the id
 * @param full If `true` the full expanded value of the key will be returned if there were any suffix and / or prefix
 * defined in schema they are also applied. We test if the passed in id already satisfies expansion.
 * @returns {string}
 */
Schema.prototype.getDocumentKeyValue = function (id, full) {
  var prefix = utils.isString(this.key.prefix) ? this.key.prefix : '';
  var suffix = utils.isString(this.key.suffix) ? this.key.suffix : '';

  var re = new RegExp('^' + prefix + '.*' + suffix + '$');
  var test = re.test(id);

  if (full) {
    if (test) {
      return id;
    }

    return prefix.concat(id, suffix);
  }

  if (test) {
    id = id.replace(new RegExp('^' + prefix), '');
    id = id.replace(new RegExp(suffix + '$'), '');
  }

  return id;
};

/**
 * Gets the reference document key value
 * @param name - index name
 * @param v - index value
 * @returns {string}
 */
Schema.prototype.getRefKey = function (name, v) {
  var d = this.options.delimiter;
  var kp = this.options.keyPrefix || '';
  return kp.concat(this.options.refIndexKeyPrefix || '', name, d, v);
};

/**
 * Returns whether this schema has the specified reference path
 * @param {String} path path to check
 * @returns {boolean}
 */
Schema.prototype.hasRefPath = function (path) {
  var ret = false;
  if (this.refs && path) {
    path = path.toLowerCase();
    for (var key in this.refs) {
      if (this.refs.hasOwnProperty(key) && this.refs[key].path.toLowerCase() === path) {
        ret = true;
        break;
      }
    }
  }

  return ret;
};

/**
 * Extends other schema. Copies properties, virtuals and middelware
 * @param {Schema} other
 */
Schema.prototype.extend = function (other) {
  if (other) {
    if (other instanceof Schema && other.descriptor) {
      var p;
      for (p in other.descriptor) {
        if (other.descriptor.hasOwnProperty(p) && !this.descriptor[p]) {
          this.add(p, utils.cloneDeep(other.descriptor[p]));
        }
      }
    }

    var self = this;
    other.callQueue.forEach(function (e) {
      self.callQueue.unshift(e);
    });
  }

  return this;
};

module.exports = Schema;