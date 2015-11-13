var ps = require('prop-search');
var _ = require('lodash');
var utils = require('./utils');
var Tree = require('./tree');

/**
 * Creats an object schema
 *
 * @constructor Schema
 * @api public
 * @param {Object} descriptor
 * @param {Object} options
 */

function Schema(descriptor, options) {

  this.callQueue = [];
  this.virtuals = {};
  this.refs = {};

  // defaults
  this.options = {
    strict: true
  };

  // attach options
  this.options = utils.merge(this.options, utils.isPlainObject(options) ? options : {});

  // document key settings
  this.key = {
    docKeyKey: '',
    prefix: false,
    suffix: false,
    generate: true
  };

  // we must use plain objects
  if (typeof descriptor !== 'undefined' && !utils.isPlainObject(descriptor))
    throw new TypeError("Schema only expects an object as a descriptor. Got '" + typeof descriptor + "'");

  this._getRefs(descriptor);

  // create tree instance with an empty object
  this.tree = new Tree({});
  // add descriptor to tree
  this.add(descriptor);
}

Schema.prototype._applyDocumentKey = function (descriptor) {
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

    throw new TypeError("Schema exepects key to be a String or a Number");
  }
};

Schema.prototype._getRefs = function (descriptor) {
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

/**
 * Adds an object to the schema tree
 *
 * @api public
 * @function Schema#add
 * @see Tree#add
 */
Schema.prototype.add = function () {
  this.tree.add.apply(this.tree, arguments);
  this._applyDocumentKey.apply(this, arguments);
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
    if (!utils.isString(name)) throw new TypeError("Schema#static exepects a string identifier as a function name");
    else if (!utils.isFunction(func)) throw new TypeError("Schema#static exepects a function as a handle");
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
    if (!utils.isString(name)) throw new TypeError("Schema#method exepects a string identifier as a function name");
    else if (!utils.isFunction(func)) throw new TypeError("Schema#method exepects a function as a handle");
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
  if (!utils.isString(name)) throw new TypeError("Schema#virtual exepects a string identifier as a property name");
  else if (!utils.isPlainObject(options)) throw new TypeError("Schema#virtual exepects an object as a handle");
  else if (!utils.isFunction(options.get)) throw new TypeError("Schema#virtual exepects an object with a get function");

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
  this.callQueue.push([name, args]);
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

module.exports = Schema;