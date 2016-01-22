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