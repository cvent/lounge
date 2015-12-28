var inspect = require('util').inspect;
var _ = require('lodash');
var uuid = require('uuid');
var EventEmitter = require('events').EventEmitter;

var utils = require('./utils');
var Schema = require('./schema');
var Tree = require('./tree');
var Type = require('./type');

/**
 * Base constructor for all created Model instances
 * Represents just the document data.
 *
 * @constructor Model
 * @api public
 * @param {Object} data
 */

function Document(data) {
  if (!(this instanceof Document))
    return new Document(data);

  var self = this;

  this.$_emitter = new EventEmitter();

  // internal memory
  var table = this.table = {};

  // ensure an object if not undefined
  if (data !== undefined && typeof data !== 'object') throw new TypeError('Model expects an object. Got \"' + typeof data + '\"');

  // ensure the schema set
  if (!this.schema || !(this.schema instanceof Schema)) throw new TypeError('.schema hasn\'t been set');

  var build = function (data, tree, object) {
    tree = (tree instanceof Tree) ? tree : self.schema.tree;
    object = (typeof object === 'object') ? object : this;
    for (var prop in data) {
      if (data.hasOwnProperty(prop)) {
        // encapsulate each iteration in a scope
        !function (prop) {
          // if not in tree, return and continue on
          if (!tree[prop]) return;
          // if the property is an object, check if the tree property
          // is a Tree instance object too
          if (typeof data[prop] === 'object' && tree[prop] instanceof Tree) {
            // define setter for object
            utils.define(data[prop], 'set', {
              writable: false,
              enumerable: false,
              configurable: false,
              value: function (value) {
                object[prop] = value;
              }
            });
            // define getter for object
            utils.define(data[prop], 'get', {
              writable: false,
              enumerable: false,
              configurable: false,
              value: function () {
                return object[prop]
              }
            });

            build(data[prop], tree[prop], object[prop]);
          }
          // we've reached some kind of scalar value
          // that exists in the schema tree and the object
          else {
            object[prop] = data[prop];
          }
        }.call(this, prop);
      }
    }
  }.bind(this);

  // overload refresh method on prototype
  var refresh = function () {
    if (utils.isFrozen(this)) return false;
    var defineFromTree = function (tree, scope, table) {
      var item;
      for (item in tree) {
        if (tree.hasOwnProperty(item)) {
          !function (item) {
            if (tree[item] === null || typeof tree[item] !== 'object') return;
            // we don't want this as a possible field
            if (tree[item].static) return;
            if (tree[item].method) return;

            if (tree[item].virtual === true) {
              var getter = utils.isFunction(tree[item].value.get) ? tree[item].value.get : undefined;
              var setter = utils.isFunction(tree[item].value.set) ? tree[item].value.set : undefined;

              utils.define(scope, item, {
                configurable: false,
                enumerable: false,
                get: getter,
                set: setter
              });

              return;
            }

            // it must be an instance of Type
            if (tree[item] instanceof Type) {
              // only set on plain objects
              if (!utils.isArray(scope)) {
                // if it doesn't exist in the internal table
                // then set it to undefined
                table[item] = table[item] || undefined;
                // create descriptor for property item on scope
                // from tree descriptor
                utils.define(scope, item, {
                  configurable: false,
                  enumerable: true,
                  get: function () {
                    return table[item] ? tree[item].get(table[item]) : undefined;
                  },
                  set: function (value) {
                    if (utils.isFunction(tree[item].validate) && tree[item].validate(value)) {
                      table[item] = tree[item].set(value);
                      return table[item];
                    } else {
                      return false;
                    }
                  }
                });
              }

              if (!utils.isUndefined(tree[item].default)) {
                scope[item] = tree[item].default;
              }
            }

            // if it is a tree instance then we need
            // to do a recursive call to define the
            // descriptors needed for the object
            else if (tree[item] instanceof Tree || utils.isArray(tree[item])) {
              table[item] = utils.isArray(tree[item]) ? [] : {};

              if (utils.isArray(tree[item])) {
                utils.define(scope, item, {
                  configurable: false,
                  enumerable: true,
                  get: function () {
                    return table[item];
                  },
                  set: function (value) {
                    if (utils.isFunction(tree[item].validate) && tree[item].validate(value)) {
                      table[item] = tree[item].set(value);
                      return table[item];
                    } else if (utils.isArray(value) && utils.isArray(tree[item]) && tree[item].type
                      && tree[item].type instanceof Type && utils.isFunction(tree[item].type.validate)) {
                      var c = _.every(value, tree[item].type.validate, tree[item].type);
                      if (c) {
                        table[item] = value;
                        return table[item];
                      }
                      else {
                        return false;
                      }
                    } else {
                      return false;
                    }
                  }
                });
              }
              else {
                utils.define(scope, item, {
                  configurable: false,
                  enumerable: true,
                  writable: false,
                  value: {}
                });
              }

              utils.define(scope[item], 'get', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: function (key) {
                  return table[item][key];
                }
              });

              utils.define(scope[item], 'set', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: function (value) {
                  table[item][key] = value;
                  return table[item];
                }
              });

              // overload array methods
              if (utils.isArray(tree[item])) {
                [
                  'concat', 'every', 'filter', 'forEach', 'indexOf', 'join', 'lastIndexOf', 'map', 'pop',
                  'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort', 'splice',
                  'toString', 'unshift', 'valueOf'
                ].map(function (method) {
                    if (utils.isFunction([][method])) {
                      utils.define(scope[item], method, {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: function (value) {
                          if (value !== undefined) {
                            if (tree[item].type instanceof Type && utils.isFunction(tree[item].type.validate)) {
                              if (tree[item].type.validate(value)) {
                                return [][method].apply(table[item], arguments)
                              }
                              else {
                                return false;
                              }
                            }
                            else {
                              return [][method].apply(table[item], arguments)
                            }
                          }
                          else {
                            return [][method].apply(table[item], arguments);
                          }
                        }.bind(null)
                      });
                    }
                  });
              }

              // recursive call to define descriptors
              defineFromTree.call(self, tree[item], scope[item], table[item]);
            }
          }.call(self, item);
        }
      }

      // if (this.schema.options.strict && scope !== this)
      //   freeze(scope)
    }.bind(this);
    // define
    defineFromTree(self.schema.tree, this, table);
    // free if in strict mode
    if (this.schema.options.strict) utils.freeze(this);
  };

  // overload set method on prototype
  utils.define(this, 'set', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: function (key, value) {
      return this[key] = value;
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
  data && build(data);

  // handle incoming arrays
  if ('object' == typeof data) {
    var prop;
    for (prop in data) {
      if (utils.isArray(data[prop]) && utils.isArray(this[prop])) {
        data[prop].forEach(function (v) {
          this.push(v);
        }, this[prop]);
      }
    }
  }

  // auto generate document key if needed
  if (this.schema.key.generate === true && !self.table[idKey]) {
    self.set([idKey], uuid.v4());
  }

  return this;
}

/**
 * Document exposes the NodeJS event emitter API, so you can use
 * `on`, `once`, etc.
 */
['on', 'once', 'emit', 'listeners', 'removeListener', 'setMaxListeners',
  'removeAllListeners', 'addListener'].forEach(
  function (emitterFn) {
    Document.prototype[emitterFn] = function () {
      return this.$_emitter[emitterFn].apply(this.$_emitter, arguments);
    };
  });

/**
 * A reference to the schema instance for the model
 *
 * @api public
 * @property {Schema} schema
 */

Document.prototype.schema;

/**
 * Refreshes the state of the model based on its schema
 *
 * @api public
 * @function Model#refresh
 * @interface
 */

Document.prototype.refresh = function () {
};


/**
 * Sets data on the model based on the schema
 *
 * @api public
 * @function Model#set
 * @interface
 */

Document.prototype.set = function () {
};

/**
 * Returns a plain object representation of the model
 *
 * @api public
 * @function Document#toObject
 * @interface
 */
Document.prototype.$_toObject = function (options, json) {
  var defaultOptions = {transform: true, json: json, minimize: true};

  // When internally saving this document we always pass options,
  // bypassing the custom schema options.
  if (!(options && 'Object' == utils.getFunctionName(options.constructor)) ||
    (options && options.$_useSchemaOptions)) {
    if (json) {
      options = this.schema.options.toJSON ?
        utils.clone(this.schema.options.toJSON) :
      {};
      options.json = true;
      options.$_useSchemaOptions = true;
    } else {
      options = this.schema.options.toObject ?
        utils.clone(this.schema.options.toObject) :
      {};
      options.json = false;
      options.$_useSchemaOptions = true;
    }
  }

  for (var key in defaultOptions) {
    if (options[key] === undefined) {
      options[key] = defaultOptions[key];
    }
  }

  // remember the root transform function
  // to save it from being overwritten by sub-transform functions
  var originalTransform = options.transform;

  var ret = utils.clone(this.table, options) || {};

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

/**
 * Applies virtuals properties to `json`.
 *
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
        branch[part] = utils.clone(self.get(path), options);
      } else {
        branch = branch[part] || (branch[part] = {});
      }
    }
  }

  return json;
}

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

Document.prototype.toObject = function (options) {
  return this.$_toObject(options);
};

/**
 * Called with JSON.stringify
 *
 * @api public
 * @function Document#toJSON
 * @interface
 */
Document.prototype.toJSON = function (options) {
  return this.$_toObject(options, true);
};

/**
 * Helper for console.log
 */
Document.prototype.inspect = function () {
  return inspect(this.toObject({}));
};

/**
 * Helper for console.log
 */
Document.prototype.toString = Document.prototype.inspect;

/**
 * Helper function to get the document key
 * @param full if true the full expanded value of the key will be returned if
 *             there were any suffix and / or prefix applied in schema definition
 * @returns {string}
 */
Document.prototype.getDocumentKeyValue = function (full) {
  var idKey = this.getDocumentKeyKey();

  return this.schema.getDocumentKeyValue(this.table[idKey], full)
};

Document.getDocumentKeyValue = function (id, full) {
  return this.schema.getDocumentKeyValue(id, full);
};

/**
 * Gets the Document key key
 * @returns {docKeyKey|*}
 */
Document.prototype.getDocumentKeyKey = function () {
  return this.schema.key.docKeyKey;
};

/**
 * The name of the model
 *
 * @api public
 * @property modelName
 */

Document.prototype.modelName;

/**
 * Returns a value representation of a Model instance
 *
 * @api public
 * @function Model#valueOf
 * @interface
 */

Document.prototype.valueOf = function () {
  return this.toObject();
};

module.exports = Document;