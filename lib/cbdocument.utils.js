const _ = require('lodash');
const mpath = require('mpath');

/*!
 * Builds index objects based on initial and current ref doc values
 * @param initialRefs
 * @param currentRefs
 * @returns {Array}
 */
exports.buildIndexObjects = function (initialRefs, currentRefs) {
  const ret = [];
  const refValueNames = Object.keys(initialRefs);

  refValueNames.forEach(refValueName => {
    const initialRefValue = initialRefs[refValueName];
    const currentlRefValue = currentRefs[refValueName];

    if (!initialRefValue || !currentlRefValue) {
      return;
    }

    const name = initialRefValue.name;
    const initialValue = initialRefValue.value;
    const indexType = initialRefValue.indexType || currentRefs.indexType;
    let currentValue = currentRefs[refValueName].value;

    if (_.isNull(currentValue) || _.isUndefined(currentValue)) {
      currentValue = null;
    }

    if (Array.isArray(currentValue)) {
      currentValue = currentValue.sort();
    }

    if (Array.isArray(initialValue) || Array.isArray(currentValue)) {
      const toRemove = _.difference(initialValue || [], currentValue || []) || [];
      const union = _.union(initialValue || [], currentValue || []) || [];
      const toAdd = _.difference(union, toRemove) || [];

      toRemove.forEach(v => {
        ret.push({
          name: name,
          indexType: indexType,
          value: v,
          action: 'remove'
        });
      });

      toAdd.forEach(v => {
        ret.push({
          name: name,
          indexType: indexType,
          value: v,
          action: 'upsert'
        });
      });
    }
    else if (_.isEqual(initialValue, currentValue)) {
      ret.push({
        name: name,
        value: currentValue,
        indexType: indexType,
        action: 'upsert'
      });
    }
    else {
      ret.push({
        name: name,
        value: initialValue,
        indexType: indexType,
        action: 'remove'
      });

      ret.push({
        name: name,
        value: currentValue,
        indexType: indexType,
        action: 'upsert'
      });
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
    const t = _.compact(options.populate);
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
  let v;
  const ret = {};
  for (v in indexes) {
    if (indexes.hasOwnProperty(v)) {
      const path = indexes[v].path;
      const name = indexes[v].name;
      const indexType = indexes[v].indexType;
      const value = mpath.get(path, data);
      let valToStore = null;
      if (typeof value === 'string') {
        valToStore = value;
      }
      if (typeof value === 'number') {
        valToStore = value.toString();
      }
      if (typeof value === 'object' && value._isBaseObject) {
        valToStore = value.getDocumentKeyValue(value.config.storeFullReferenceId);
      }
      else if (Array.isArray(value)) {
        valToStore = _.map(value, v => {
          if (v) {
            if (typeof v === 'string') {
              return v;
            }
            if (typeof v === 'number') {
              return v.toString();
            }
            if (typeof v === 'object' && v._isBaseObject) {
              return v.getDocumentKeyValue(v.config.storeFullReferenceId);
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
        name: name,
        indexType: indexType
      };
    }
  }

  return ret;
};
