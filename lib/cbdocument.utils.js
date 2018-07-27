const _ = require('lodash')
const mpath = require('mpath')
const { expandValues, processValue, REF_KEY_CASE } = require('./utils')
const _privateKey = require('./privatekey')

const Driver = require('couchbase-driver')

const INDEX_ACTIONS = {
  REMOVE: 'remove',
  UPSERT: 'upsert'
}

/*!
 * Builds index objects based on initial and current ref doc values
 * @param initialRefs
 * @param currentRefs
 * @returns {Array}
 */
function buildIndexObjects (initialRefs, currentRefs) {
  const ret = []
  const refValueNames = Object.keys(initialRefs)

  refValueNames.forEach(refValueName => {
    const initialRefValue = initialRefs[refValueName]
    const currentRefValue = currentRefs[refValueName]

    if (!initialRefValue || !currentRefValue) {
      return
    }

    const name = initialRefValue.name
    const initialValue = initialRefValue.value
    const indexType = initialRefValue.indexType || currentRefs.indexType
    let currentValue = currentRefs[refValueName].value

    if (_.isNull(currentValue) || _.isUndefined(currentValue)) {
      currentValue = null
    }

    if (Array.isArray(currentValue)) {
      currentValue = currentValue.sort()
    }

    if (Array.isArray(initialValue) || Array.isArray(currentValue)) {
      const toRemove = _.difference(initialValue || [], currentValue || []) || []
      const union = _.union(initialValue || [], currentValue || []) || []
      const toAdd = _.difference(union, toRemove) || []

      toRemove.forEach(v => {
        ret.push({
          name,
          indexType,
          value: v,
          action: INDEX_ACTIONS.REMOVE
        })
      })

      toAdd.forEach(v => {
        ret.push({
          name,
          indexType,
          value: v,
          action: INDEX_ACTIONS.UPSERT
        })
      })
    } else if (_.isEqual(initialValue, currentValue)) {
      ret.push({
        name,
        value: currentValue,
        indexType,
        action: INDEX_ACTIONS.UPSERT
      })
    } else {
      if (initialValue !== null) {
        ret.push({
          name,
          value: initialValue,
          indexType,
          action: INDEX_ACTIONS.REMOVE
        })
      }

      if (currentValue !== null) {
        ret.push({
          name,
          value: currentValue,
          indexType,
          action: INDEX_ACTIONS.UPSERT
        })
      }
    }
  })

  return ret
}

/*!
 * Builds ref document values
 * @param indexes
 * @param data
 * @returns {{}}
 */
function buildRefValues (indexes, data) {
  let v
  const ret = {}
  for (v in indexes) {
    if (indexes.hasOwnProperty(v)) {
      const path = indexes[v].path
      const name = indexes[v].name
      const indexType = indexes[v].indexType

      let value = null
      if (indexes[v].compound) {
        value = _.map(path, p => processValue(mpath.get(p, data)))
        value = expandValues(value)
        value = _.compact(value)

        const containsNested = _.some(value, _.isArray)
        if (containsNested) {
          value = _.map(value, v => v.join('_'))
        } else {
          value = value.join('_')
        }
      } else {
        value = processValue(mpath.get(path, data))
      }

      if (indexes[v].refKeyCase === REF_KEY_CASE.UPPER) {
        value = value.toUpperCase()
      } else if (indexes[v].refKeyCase === REF_KEY_CASE.LOWER) {
        value = value.toLowerCase()
      }

      ret[name] = {
        path,
        value,
        name,
        indexType
      }
    }
  }

  return ret
}

const DBOPS = Driver.OPERATIONS

function generateIndexTransform (obj, refKeyValue) {
  return function indexTranform (indexDoc) {
    if (!indexDoc && obj.action === INDEX_ACTIONS.REMOVE) {
      return { action: DBOPS.NOOP }
    }

    if (!indexDoc) {
      indexDoc = {
        keys: []
      }
    }

    if (!indexDoc.keys || !Array.isArray(indexDoc.keys)) {
      indexDoc.keys = []
    }

    const r = { action: DBOPS.NOOP }
    if (indexDoc && indexDoc.keys && Array.isArray(indexDoc.keys)) {
      const valueIndex = indexDoc.keys.indexOf(refKeyValue)
      if (obj.action === INDEX_ACTIONS.REMOVE && valueIndex >= 0) {
        indexDoc.keys.splice(valueIndex, 1)
      } else if (valueIndex === -1) {
        indexDoc.keys.push(refKeyValue)
      }

      if (indexDoc.keys.length) {
        r.action = DBOPS.UPSERT
        r.value = indexDoc
      } else {
        // no indexes. remove the document
        r.action = DBOPS.REMOVE
      }
    }
    return r
  }
}

/*!
 * Has to be called with a context
 * Can work against an instance or a Model class as static function
 */
function getSortedRefPaths (reverse) {
  let refs = []

  if (this.schema.refs) {
    for (const key in this.schema.refs) {
      if (this.schema.refs.hasOwnProperty(key)) {
        refs.push(this.schema.refs[key].path)
      }
    }

    if (refs.length > 0) {
      refs = _.sortBy(refs, 'length')
      if (reverse) {
        refs.reverse()
      }
    }
  }

  return refs
}

/*!
 * Gets the model at a reference path
 * Has to be called with the context
 * Can work against an instance or a Model class as static function
 * @param {String} path
 * @returns {*}
 */
function getRefModel (path) {
  let model
  if (this.schema.refs) {
    const modelName = this.schema.refs[path].ref
    if (modelName) {
      const l = this[_privateKey] && this[_privateKey].lounge
        ? this[_privateKey].lounge
        : this.lounge
      model = l.models[modelName]
    }
  }

  return model
}

exports.buildIndexObjects = buildIndexObjects
exports.buildRefValues = buildRefValues
exports.getRefModel = getRefModel
exports.generateIndexTransform = generateIndexTransform
exports.getSortedRefPaths = getSortedRefPaths
exports.INDEX_ACTIONS = INDEX_ACTIONS
