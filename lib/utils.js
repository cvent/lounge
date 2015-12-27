var _ = require('lodash');
var couchbase = require('couchbase');
var errors = couchbase.errors;

exports.cloneDeep = require('clone');

exports.define = Object.defineProperty;
exports.freeze = Object.freeze;
exports.isFrozen = Object.isFrozen;
exports.isArray = Array.isArray;

var Document;

/**
 * Checks whether the input is a plain object
 *
 * @api private
 * @param {Mixed} input
 */

exports.isPlainObject = function isPlainObject(input) {
  return input !== null && typeof input === 'object' && input.constructor === Object;
};

exports.isFunction = _.isFunction;

exports.isBoolean = _.isBoolean;

exports.isUndefined = _.isUndefined;

exports.isNull = _.isUndefined;

exports.isString = _.isString;

exports.isNaN = _.isNaN;

exports.merge = _.merge;

exports.isObject = _.isObject;

/**
 * Checks whether the input is a NaN
 *
 * @api private
 * @param {Mixed} input
 */

exports.isTrueNaN = function isTrueNaN(input) {
  return (isNaN(input) && input !== NaN && typeof input === 'number');
};

/**
 * CHecks whether a given input is in an array
 *
 * @api private
 * @param {Array} array
 * @param {Mixed} needle
 */

exports.inArray = function inArray(array, needle) {
  return !!~array.indexOf(needle);
};

exports.getFunctionName = function (fn) {
  if (fn.name) {
    return fn.name;
  }
  return (fn.toString().trim().match(/^function\s*([^\s(]+)/) || [])[1];
};

/**
 * Returns if `v` is a lounge object that has a `toObject()` method we can use.
 *
 * This is for compatibility with libs like Date.js which do foolish things to Natives.
 *
 * @param {any} v
 * @api private
 */

exports.isLoungeObject = function (v) {
  Document || (Document = require('./document'));

  return v instanceof Document;
};

var isLoungeObject = exports.isLoungeObject;

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
    switch (exports.getFunctionName(obj.constructor)) {
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
  var minimize = options && options.minimize
    , ret = {}
    , hasKeys
    , keys
    , val
    , k
    , i;

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

  return minimize
    ? hasKeys && ret
    : ret;
}

function cloneArray(arr, options) {
  var ret = [];
  for (var i = 0, l = arr.length; i < l; i++)
    ret.push(clone(arr[i], options));
  return ret;
}

exports.isKeyNotFound = function (err) {
  var keyNotFound = false;
  if (err) {
    if (err.code && err.code === errors.keyNotFound) {
      keyNotFound = true;
    }
    else if (err.message && err.message === 'key not found') {
      keyNotFound = true;
    }
    else if (err.message && err.message.indexOf('key does not exist') >= 0) {
      keyNotFound = true;
    }
    else if (err.message && err.message.indexOf('key not found') >= 0) {
      keyNotFound = true;
    }
    else if (err.code && err.code.toString() === '13') {
      keyNotFound = true;
    }
  }

  return keyNotFound;
};

exports.defaultOptions = {
  storeFullReferenceId: false,
  storeFullKey: false,
  alwaysReturnArrays: false,
  refIndexKeyPrefix: '$_ref_by_',
  delimiter: '_',
  waitForIndex: false
};