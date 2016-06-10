const _ = require('lodash');
const mpath = require('mpath');
import Driver from './driver';

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
          name,
          indexType,
          value: v,
          action: 'remove'
        });
      });

      toAdd.forEach(v => {
        ret.push({
          name,
          indexType,
          value: v,
          action: 'upsert'
        });
      });
    } else if (_.isEqual(initialValue, currentValue)) {
      ret.push({
        name,
        value: currentValue,
        indexType,
        action: 'upsert'
      });
    } else {
      ret.push({
        name,
        value: initialValue,
        indexType,
        action: 'remove'
      });

      ret.push({
        name,
        value: currentValue,
        indexType,
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

  if (_.isPlainObject(options.populate) && _.isString(options.populate.path)) {
    return !_.isEmpty(options.populate.path);
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
      if (typeof value === 'object' && value._isBaseModel) {
        valToStore = value.getDocumentKeyValue(value.config.storeFullReferenceId);
      } else if (Array.isArray(value)) {
        valToStore = _.map(value, v => {
          if (v) {
            if (typeof v === 'string') {
              return v;
            }
            if (typeof v === 'number') {
              return v.toString();
            }
            if (typeof v === 'object' && v._isBaseModel) {
              return v.getDocumentKeyValue(v.config.storeFullReferenceId);
            }
          }
        });

        valToStore = _.compact(valToStore);
        valToStore = valToStore.sort();
      } else if (_.isUndefined(value) || _.isNull(value)) {
        valToStore = null;
      }

      ret[name] = {
        path,
        value: valToStore,
        name,
        indexType
      };
    }
  }

  return ret;
};

const DBOPS = Driver.OPERATIONS;

exports.generateIndexTransform = function (obj, refKeyValue) {
  return function indexTranform(indexDoc) {
    if (!indexDoc && obj.action === 'remove') {
      return { action: DBOPS.NOOP };
    }

    if (!indexDoc) {
      indexDoc = {
        keys: []
      };
    }

    if (!indexDoc.keys || !Array.isArray(indexDoc.keys)) {
      indexDoc.keys = [];
    }

    const r = { action: DBOPS.NOOP };
    if (indexDoc && indexDoc.keys && Array.isArray(indexDoc.keys)) {
      const valueIndex = indexDoc.keys.indexOf(refKeyValue);
      if (obj.action === 'remove' && valueIndex >= 0) {
        indexDoc.keys.splice(valueIndex, 1);
      } else if (valueIndex === -1) {
        indexDoc.keys.push(refKeyValue);
      }

      if (indexDoc.keys.length) {
        r.action = DBOPS.UPSERT;
        r.value = indexDoc;
      } else {
        // no indexes. remove the document
        r.action = DBOPS.REMOVE;
      }
    }
    return r;
  };
};
