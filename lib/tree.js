var utils = require('./utils');
var Type = require('./type');

/**
 * Creates an object tree for a schema.
 * This is used for aggregating types
 *
 * @constructor Tree
 * @api public
 * @param {Object} descriptor
 * @param {Object} options
 */

function Tree(descriptor, options) {
  var self = this;
  // ensure we have an object
  if (!utils.isArray(descriptor) && descriptor !== undefined && descriptor !== null && !utils.isPlainObject(descriptor))
    throw new TypeError('Tree only expects a descriptor');
  else this.add(descriptor);

  if (utils.isPlainObject(options) && options.array === true) {
    var array = [];
    array.__proto__ = this;
    array.type = new Type(options.type, options.ref ? {ref: options.ref} : undefined);
    return array;
  }
}


/**
 * Adds a key to the tree on a given parent tree.
 * Defaults to 'this' as the parent if one is not provided.
 *
 * @api public
 * @function Tree#add
 * @param {Tree} parent
 * @param {String} key
 * @param {Object} descriptor
 */

utils.define(Tree.prototype, 'add', {
  enumerable: false,
  value: function (parent, key, descriptor) {
    // are they just passing in an object as one big descriptor?
    if (typeof parent === 'object' && arguments.length === 1) {
      for (var prop in parent) {
        this.add(this, prop, parent[prop]);
      }
    }
    else {
      parent = (parent instanceof Tree || utils.isString(parent)) ? parent : this;
      // is this a reference to a child tree?
      if (parent instanceof Tree) {
        if (utils.isPlainObject(descriptor)) {
          if (utils.isFunction(descriptor.type)) {
            parent[key] = new Type(descriptor.type, descriptor);
          }
          else {
            parent[key] = new Tree(descriptor);
          }
        }
        else if (utils.isFunction(descriptor)) {
          parent[key] = new Type(descriptor);
        }
        else if (utils.isArray(descriptor)) {
          if (descriptor.length && utils.isFunction(descriptor[0])) {
            parent[key] = new Tree(null, {array: true, type: descriptor[0]});
          }
          else if (descriptor.length && utils.isPlainObject(descriptor[0]) && utils.isFunction(descriptor[0].type)) {
            // case of array refs
            parent[key] = new Tree(null, {array: true, type: descriptor[0].type, ref: descriptor[0].ref});
          }
          else {
            parent[key] = [];
          }
        }
      }
      else if (utils.isString(parent) && key) {
        descriptor = key;
        key = parent;
        this.add(this, key, descriptor);
      }
    }
  }
});

module.exports = exports = Tree;