var _ = require('lodash');

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

exports.merge = _.merge;

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