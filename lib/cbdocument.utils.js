import _ from 'lodash';
import mpath from 'mpath';
import { expandValues, processValue } from './utils';

import Driver from 'couchbase-driver';

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
    const currentRefValue = currentRefs[refValueName];

    if (!initialRefValue || !currentRefValue) {
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

      let value = null;
      if (indexes[v].compound) {
        value = _.map(path, p => processValue(mpath.get(p, data)));
        value = expandValues(value);
        value = _.compact(value);

        const containsNested = _.some(value, _.isArray);
        if (containsNested) {
          value = _.map(value, v => v.join('_'));
        } else {
          value = value.join('_');
        }

      } else {
        value = processValue(mpath.get(path, data));
      }

      ret[name] = {
        path,
        value,
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
