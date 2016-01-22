var _ = require('lodash');

var Tree = require('./tree');
var Type = require('./type');
var utils = require('./utils');

var Document;

/**
 * Returns if `v` is a lounge object that has a `toObject()` method we can use.
 *
 * This is for compatibility with libs like Date.js which do foolish things to Natives.
 *
 * @param {any} v
 * @api private
 */

function isLoungeObject(v) {
  if (!Document) {
    Document = require('./document');
  }

  return v instanceof Document;
}

/**
 * Object clone with Lounge natives support.
 *
 * If options.minimize is true, creates a minimal data object. Empty objects and undefined values will not be cloned.
 * This makes the data payload sent to Couchbase as small as possible.
 *
 * Functions are never cloned.
 *
 * @param {Object} obj the object to clone
 * @param {Object} options
 * @return {Object} the cloned object
 * @api private
 */

exports.clone = function clone(obj, options) {
  if (obj === undefined || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return cloneArray(obj, options);
  }

  if (isLoungeObject(obj)) {
    if (options && options.json && 'function' === typeof obj.toJSON) {
      return obj.toJSON(options);
    } else {
      return obj.toObject(options);
    }
  }

  if (obj.constructor) {
    switch (utils.getFunctionName(obj.constructor)) {
      case 'Object':
        return cloneObject(obj, options);
      case 'Date':
      {
        if (options.dateToISO === true) {
          var d = new obj.constructor(+obj);
          return d.toISOString();
        }
        return new obj.constructor(+obj);
      }
      default:
        // ignore
        break;
    }
  }

  if (!obj.constructor && _.isObject(obj)) {
    return cloneObject(obj, options);
  }

  if (obj.valueOf) {
    return obj.valueOf();
  }
};

var clone = exports.clone;

function cloneObject(obj, options) {
  var minimize = options && options.minimize;
  var ret = {};
  var hasKeys, keys, val, k, i;

  keys = Object.keys(obj);
  i = keys.length;

  while (i--) {
    k = keys[i];
    val = clone(obj[k], options);

    if (!minimize || ('undefined' !== typeof val)) {
      if (!hasKeys) hasKeys = true;
      ret[k] = val;
    }
  }

  return minimize ? hasKeys && ret : ret;
}

function cloneArray(arr, options) {
  var ret = [];
  for (var i = 0, l = arr.length; i < l; i++)
    ret.push(clone(arr[i], options));
  return ret;
}

var build = exports.build = function (data, tree, object) {
  tree = (tree instanceof Tree) ? tree : this.schema.tree;
  object = (typeof object === 'object') ? object : this;

  for (var prop in data) {
    if (data.hasOwnProperty(prop)) {
      // encapsulate each iteration in a scope
      !defn.call(this, tree, object, prop, data);
    }
  }
};

function defn(tree, object, prop, data) {
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
        return object[prop];
      }
    });

    build(data[prop], tree[prop], object[prop]);
  }
  // we've reached some kind of scalar value
  // that exists in the schema tree and the object
  else {
    object[prop] = data[prop];
  }
}

var defineFromTree = exports.defineFromTree = function (tree, scope, table) {
  var self = this;
  var item;
  for (item in tree) {
    if (tree.hasOwnProperty(item)) {
      !defineItemFromTree.call(self, item, tree, scope, table);
    }
  }
};

var defineItemFromTree = function (item, tree, scope, table) {
  var self = this;
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
          } else if (utils.isArray(value) && utils.isArray(tree[item]) && tree[item].type &&
            tree[item].type instanceof Type && utils.isFunction(tree[item].type.validate)) {
            var c = _.every(value, _.bind(tree[item].type.validate, tree[item].type));
            if (c) {
              table[item] = value;
              return table[item];
            }
            else {
              return false;
            }
          } else if (Array.isArray(value) && _.isEmpty(tree[item])) {
            // just an array of object
            table[item] = value;
          } else {
            return false;
          }
        }
      });

      // custom set for the array so we can do obj.arrayProp.set([...]);
      utils.define(scope[item], 'set', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (value) {
          // use scope[item] so that the above set is invoked
          scope[item] = value;
          return scope[item];
        }
      });
    }
    else {
      // this doesn't allow sub objects to be set using assignment operator
      // user.metadata = { foo: 'bar' };
      // we have to do user.metadata.foo = 'bar';
      // we can also use user.metadata.set({...});

      utils.define(scope, item, {
        configurable: false,
        enumerable: true,
        writable: false,
        value: {}
      });

      // at least over ride inspect so we can properly get property
      utils.define(scope[item], 'inspect', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function () {
          if (!Array.isArray(tree[item]) && !tree[item].Constructor) {
            var keys = Object.keys(tree[item]);
            var ret = {};
            keys.forEach(function (k) {
              ret[k] = table[item][k];
            });
            return ret;
          }
          else {
            return table[item];
          }
        }
      });

      // special set for nested objects
      utils.define(scope[item], 'set', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (value) {
          if (!tree[item].Constructor) {
            // it's just a plain object
            var allowedKeys = Object.keys(tree[item]);
            var dataToSet = _.pick(value, allowedKeys);
            allowedKeys.forEach(function (k) {
              if (tree[item][k].validate && utils.isFunction(tree[item][k].validate)) {
                if (tree[item][k].validate(dataToSet[k])) {
                  table[item][k] = dataToSet[k];
                }
              }
            });

            return table[item];
          }
          else {
            table[item] = value;
            return table[item];
          }
        }
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
                      return [][method].apply(table[item], arguments);
                    }
                    else {
                      return false;
                    }
                  }
                  else {
                    return [][method].apply(table[item], arguments);
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
};