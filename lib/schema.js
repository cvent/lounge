var ps = require('prop-search');
var _ = require('lodash');

var utils = require('./utils');
var Tree = require('./tree');


/**
 * Creates an object schema
 *
 * @constructor Schema
 * @api public
 * @param {Object} descriptor
 * @param {Object} options
 * @param {Object} baseSchema
 */

function Schema(descriptor, options) {

  this.callQueue = [];
  this.virtuals = {};
  this.refs = {};
  this.indexes = {};

  // defaults
  this.options = {
    strict: true
  };

  // attach options
  this.options = utils.merge(this.options, utils.isPlainObject(options) ? options : {});

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

  this.$_getRefs(descriptor);

  // create tree instance with an empty object
  this.tree = new Tree({});

  this.descriptor = descriptor || {};

  // add descriptor to tree
  this.add(descriptor);
}

Schema.prototype.$_applyDocumentKey = function (descriptor) {
  var self = this;
  //find the document key key
  var docKeyFound = false;
  for (var prop in descriptor) {
    if (descriptor.hasOwnProperty(prop)) {
      if (prop === 'id' || (utils.isPlainObject(descriptor[prop]) && descriptor[prop].key === true)) {

        docKeyFound = true;
        self.key.generate = false;

        self.key.docKeyKey = prop;
        if (utils.isString(descriptor[prop].prefix)) {
          self.key.prefix = descriptor[prop].prefix;
        }
        if (!self.key.prefix && utils.isString(self.options.keyPrefix)) {
          self.key.prefix = self.options.keyPrefix;
        }

        if (utils.isString(descriptor[prop].suffix)) {
          self.key.suffix = descriptor[prop].suffix;
        }
        if (!self.key.suffix && utils.isString(self.options.keySuffix)) {
          self.key.suffix = self.options.keySuffix;
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

Schema.prototype.$_getRefs = function (descriptor) {
  var self = this;
  var res = ps.searchForExistence(descriptor, 'ref', {separator: '.'});

  if (res && res.length > 0) {
    var refs = _.map(res, function (elem) {
      if (Array.isArray(elem.value)) {
        var val = elem.value[0].ref;
        return {
          path: elem.path.slice(0, elem.path.lastIndexOf('.')),
          ref: val
        }
      }
      else {
        return {
          path: elem.path,
          ref: elem.value.ref
        }
      }
    });

    if (refs && refs.length > 0) {
      refs.forEach(function (elem) {
        self.refs[elem.path] = elem;
      });
    }
  }
};

Schema.prototype.$_getIndexes = function (descriptor) {
  var self = this;
  var res = ps.searchForBoolean(descriptor, 'index', {separator: '.'});

  if (res && res.length > 0) {
    var inds = _.map(res, function (elem) {
      if (Array.isArray(elem.value)) {
        return {
          path: elem.path.slice(0, elem.path.lastIndexOf('.')),
          name: elem.value[0].indexName || elem.key
        }
      }
      else {
        return {
          path: elem.path,
          name: elem.value.indexName || elem.key
        }
      }
    });

    if (inds && inds.length > 0) {
      inds.forEach(function (elem) {
        self.indexes[elem.path] = elem;
      });
    }
  }
};

/**
 * Adds an object to the schema tree
 *
 * @api public
 * @function Schema#add
 * @see Tree#add
 */
Schema.prototype.add = function (key, descriptor) {
  // adjust our descriptor
  var d;
  if (key && descriptor) {
    d = descriptor;
    this.descriptor[key] = utils.cloneDeep(descriptor);
  }
  else if (typeof key === 'object' && !descriptor) {
    d = key;
    var prop;
    for (prop in key) {
      if (key.hasOwnProperty(prop) && key[prop]) {
        this.descriptor[prop] = utils.cloneDeep(key[prop]);
      }
    }
  }

  this.tree.add.apply(this.tree, arguments);

  this.$_getRefs(d);
  this.$_getIndexes(d);
  this.$_applyDocumentKey(d);
};


/**
 * Creates a static function for the created model
 *
 * @api public
 * @function Schema#.static
 * @param {String} name
 * @param {Function} func
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
 * Creates a instance method for the created model
 *
 * @api public
 * @function Schema#.method
 * @param {String} name
 * @param {Function} func
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
 * @function Schema#.virtual
 * @param {String} name
 * @param {Object} options
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
 * @param {String} key option name
 * @api public
 */

Schema.prototype.get = function (key) {
  return this.options[key];
};

/**
 * Helper function to get the document key
 * @param id the id
 * @param full if true the full expanded value of the key will be returned if
 *             there were any suffix and / or prefix applied in schema definition
 *             We test if the passed in id already satisfies expansion.
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

Schema.prototype.getRefKey = function (name, v) {
  if (this.options.refIndexKeyPrefix) {
    return v.concat(name, '_', v);
  }
  return name.concat('_', v);
};

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
 * @param other
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