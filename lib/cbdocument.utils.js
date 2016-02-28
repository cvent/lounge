var _ = require('lodash');
var mpath = require('mpath');
var utils = require('./utils');

/*!
 * Builds index objects based on initial and current ref doc values
 * @param initialRefs
 * @param currentRefs
 * @returns {Array}
 */
exports.buildIndexObjects = function (initialRefs, currentRefs) {
  var ret = [];

  var refValueNames = Object.keys(initialRefs);

  refValueNames.forEach(function (refValueName) {
    var initialRefValue = initialRefs[refValueName];
    var currentlRefValue = currentRefs[refValueName];

    if (!initialRefValue || !currentlRefValue) {
      return;
    }

    var name = initialRefValue.name;
    var initialValue = initialRefValue.value;
    var currentValue = currentRefs[refValueName].value;

    if (_.isNull(currentValue) || _.isUndefined(currentValue)) {
      currentValue = null;
    }

    if (Array.isArray(currentValue)) {
      currentValue = currentValue.sort();
    }

    if (Array.isArray(initialValue) || Array.isArray(currentValue)) {
      var toRemove = _.difference(initialValue || [], currentValue || []) || [];
      var union = _.union(initialValue || [], currentValue || []) || [];
      var toAdd = _.difference(union, toRemove) || [];

      toRemove.forEach(function (v) {
        ret.push({
          name: name,
          value: v,
          action: 'remove'
        });
      });

      toAdd.forEach(function (v) {
        ret.push({
          name: name,
          value: v,
          action: 'upsert'
        });
      });
    }
    else {
      if (_.isEqual(initialValue, currentValue)) {
        ret.push({
          name: name,
          value: currentValue,
          action: 'upsert'
        });
      }
      else {
        ret.push({
          name: name,
          value: initialValue,
          action: 'remove'
        });

        ret.push({
          name: name,
          value: currentValue,
          action: 'upsert'
        });
      }
    }
  });

  return ret;
};

/*!
 * Checks whether an options parameter has valid populate options
 * @param options
 * @returns {*}
 */
exports.hasPopulate = function (options) {
  if (!options) {
    return false;
  }

  if (typeof options.populate === 'undefined' || options.populate === null) {
    return false;
  }

  if (_.isString(options.populate)) {
    return !_.isEmpty(options.populate);
  }

  if (_.isArray(options.populate)) {
    var t = _.compact(options.populate);
    return !_.isEmpty(t);
  }

  if (_.isBoolean(options.populate)) {
    return options.populate;
  }

  return false;
};

/*!
 * Builds ref document values
 * @param indexes
 * @param data
 * @returns {{}}
 */
exports.buildRefValues = function (indexes, data) {
  var v;
  var ret = {};
  for (v in indexes) {
    if (indexes.hasOwnProperty(v)) {
      var path = indexes[v].path;
      var name = indexes[v].name;
      var value = mpath.get(path, data);
      var valToStore = null;
      if (typeof value === 'string') {
        valToStore = value;
      }
      if (typeof value === 'number') {
        valToStore = value.toString();
      }
      else if (Array.isArray(value)) {
        valToStore = _.map(value, function (v) {
          if (v) {
            if (typeof v === 'string') {
              return v;
            }
            if (typeof v === 'number') {
              return v.toString();
            }
          }
        });

        valToStore = _.compact(valToStore);
        valToStore = valToStore.sort();
      }
      else if (_.isUndefined(value) || _.isNull(value)) {
        valToStore = null;
      }

      ret[name] = {
        path: path,
        value: valToStore,
        name: name
      };
    }
  }

  return ret;
};