var _ = require('lodash');
var couchbase = require('couchbase');
var errors = couchbase.errors;

exports.cloneDeep = require('clone');

exports.define = Object.defineProperty;
exports.freeze = Object.freeze;
exports.isFrozen = Object.isFrozen;
exports.isArray = Array.isArray;

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
  waitForIndex: false,
  minimize: true
};

exports.schemaConfigOptionKeys = ['keyPrefix', 'keySuffix', 'refIndexKeyPrefix', 'delimiter', 'minimize'];
exports.saveOptionsKeys = ['storeFullReferenceId', 'storeFullKey', 'refIndexKeyPrefix', 'waitForIndex', 'minimize'];

exports.endsWith = function (subjectString, searchString, position) {
  if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
    position = subjectString.length;
  }
  position -= searchString.length;
  var lastIndex = subjectString.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};

exports.concatArrays = function (a1, a2) {
  Array.prototype.push.apply(a1, a2);
};