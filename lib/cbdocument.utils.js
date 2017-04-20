const async = require('async')
const _ = require('lodash')
const clone = require('clone')
const mpath = require('mpath')
const { expandValues, processValue, concatArrays } = require('./utils')
const _privateKey = require('./privatekey')

const Driver = require('couchbase-driver')

const DIGIT_REGEX = /^\d+$/

/*!
 * Builds index objects based on initial and current ref doc values
 * @param initialRefs
 * @param currentRefs
 * @returns {Array}
 */
exports.buildIndexObjects = function (initialRefs, currentRefs) {
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
          action: 'remove'
        })
      })

      toAdd.forEach(v => {
        ret.push({
          name,
          indexType,
          value: v,
          action: 'upsert'
        })
      })
    } else if (_.isEqual(initialValue, currentValue)) {
      ret.push({
        name,
        value: currentValue,
        indexType,
        action: 'upsert'
      })
    } else {
      if (initialValue !== null) {
        ret.push({
          name,
          value: initialValue,
          indexType,
          action: 'remove'
        })
      }

      if (currentValue !== null) {
        ret.push({
          name,
          value: currentValue,
          indexType,
          action: 'upsert'
        })
      }
    }
  })

  return ret
}

/*!
 * Checks whether an options parameter has valid populate options
 * @param options
 * @returns {*}
 */
exports.hasPopulate = function (options) {
  if (!options) {
    return false
  }

  if (typeof options.populate === 'undefined' || options.populate === null) {
    return false
  }

  if (_.isString(options.populate)) {
    return !_.isEmpty(options.populate)
  }

  if (_.isPlainObject(options.populate) && _.isString(options.populate.path)) {
    return !_.isEmpty(options.populate.path)
  }

  if (_.isArray(options.populate)) {
    const t = _.compact(options.populate)
    return !_.isEmpty(t)
  }

  if (_.isBoolean(options.populate)) {
    return options.populate
  }

  return false
}

/*!
 * Builds ref document values
 * @param indexes
 * @param data
 * @returns {{}}
 */
exports.buildRefValues = function (indexes, data) {
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

exports.generateIndexTransform = function (obj, refKeyValue) {
  return function indexTranform (indexDoc) {
    if (!indexDoc && obj.action === 'remove') {
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
      if (obj.action === 'remove' && valueIndex >= 0) {
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
exports.getSortedRefPaths = function (reverse) {
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
exports.getRefModel = function (path) {
  let model
  if (this.schema.refs) {
    const modelName = this.schema.refs[path].ref
    if (modelName) {
      model = this[_privateKey].lounge.models[modelName]
    }
  }

  return model
}

function getArrayMap (path, ids, models, RefModel) {
  let idArrayMap = {}
  _.each(models, m => {
    const p = m.get(path, true)
    if (_.isString(p)) {
      idArrayMap[m.getDocumentKeyValue(true)] = RefModel.getDocumentKeyValue(p)
    }
  })
  return idArrayMap
}

/*!
 * Populate everything
 * @param refs
 * @param options
 * @param memo
 * @param missing
 * @param fn
 */
exports.populateAll = function (refs, options, memo, missing, fn) {
  exports.populateAllArray.call(this, [this], refs, options, memo, missing, (err, docs, missing) => {
    return fn(err, docs ? docs[0] : undefined, missing)
  })
}

function getIdsAndArrayMap (path, models, RefModel) {
  let ids = _.map(models, path)
  ids = _.compact(ids)

  if (!ids || !ids.length) {
    return { ids: null, idArrayMap: null }
  }

  let isArray = Array.isArray(ids[0])
  let idArrayMap = null
  if (isArray) {
    idArrayMap = getArrayMap(path, ids, models, RefModel)
    ids = _.flatten(ids)
  }

  ids = _.filter(ids, e => _.isString(e))

  if (!ids || !ids.length) {
    return { ids: null, idArrayMap: null }
  }

  return {
    ids,
    idArrayMap,
    isArray
  }
}

exports.populateAllArray = function (models, refs, options, memo, missing, fn) {
  async.eachLimit(refs, 20, (path, eachCB) => {
    const RefModel = exports.getRefModel.call(this, path)
    if (!RefModel) {
      return process.nextTick(eachCB)
    }

    let { ids, idArrayMap, isArray } = getIdsAndArrayMap(path, models, RefModel)

    if (!ids) {
      return process.nextTick(eachCB)
    }

    RefModel._findById(ids, options, memo, (err, results, missed) => {
      if (err) {
        this._broadcast('error', err, this)
        return eachCB(err)
      }

      if (results) {
        const rMap = _.keyBy(results, r => {
          const keyValue = r.get([RefModel.getDocumentKeyKey()])
          return RefModel.getDocumentKeyValue(keyValue, true)
        })

        _.each(models, mi => {
          const mid = RefModel.getDocumentKeyValue(mpath.get(path, mi), true)
          let populatedModel = null
          if (isArray) {
            let vals = _.pick(rMap, idArrayMap[mid])
            populatedModel = _.values(vals)
          } else {
            populatedModel = rMap[mid]
          }
          mpath.set(path, populatedModel, mi)
        })
      }

      if (missed && missed.length > 0) {
        concatArrays(missing, missed)
      }

      return eachCB()
    })
  }, err => {
    return fn(err, models, missing)
  })
}

/*!
 * Populate path
 * @param refs
 * @param options
 * @param memo
 * @param missing
 * @param fn
 */
exports.populatePath = function (options, memo, missing, fn) {
  exports.populatePathArray.call(this, [this], options, memo, missing, (err, docs, missing) => {
    return fn(err, docs ? docs[0] : undefined, missing)
  })
}

/*!
 *
 * @param options
 * @param memo
 * @param missing
 * @param fn
 * @returns {*}
 */
exports.populatePathArray = function (models, options, memo, missing, fn) {
  const parts = options.populate.path.split('.')
  const part = parts[0]

  // Flag for non-model nested property. We need to use the full path for population.
  let fullPath = false
  let path
  if (parts.length > 1 && this.schema.hasRefPath(part)) {
    path = part
  } else if (this.schema.hasRefPath(options.populate.path)) {
    path = options.populate.path
    fullPath = true
  }

  // first part must be a ref path and cannot be a digit
  if (!path || DIGIT_REGEX.test(path)) {
    return process.nextTick(() => {
      return fn(null, models, [])
    })
  }

  const opts = clone(options)
  let Model
  if (!fullPath) {
    const nextPart = parts[1]
    let restIndex = 1
    // if next part is an array index append it to path and adjust
    if (nextPart && DIGIT_REGEX.test(nextPart)) {
      path = part.concat('.', nextPart)
      restIndex = 2
    }

    // create the rest of path
    let rest
    if (parts.length > restIndex) {
      rest = parts.slice(restIndex).join('.')
    }

    // get model
    Model = exports.getRefModel.call(this, part)
    if (!Model) {
      console.warn('No model for path: %s', part)
      return process.nextTick(() => {
        return fn(null, models, [])
      })
    }

    // adjust the populate option for the rest
    opts.populate.path = rest

    let targetParts
    if (_.isString(options.populate.target) && options.populate.target) {
      targetParts = options.populate.target.split('.')
      opts.populate.target = targetParts.slice(restIndex).join('.')
    }
  } else {
    Model = exports.getRefModel.call(this, path)
  }

  let { ids, idArrayMap, isArray } = getIdsAndArrayMap(path, models, Model)

  if (!ids) {
    return process.nextTick(() => {
      return fn(null, models, [])
    })
  }

  // get the ref doc and populate the rest recursively
  Model._findById(ids, opts, memo, (err, results, missed) => {
    if (err) {
      this._broadcast('error', err, this)
      return fn(err)
    }
    if (results) {
      const rMap = _.keyBy(results, r => {
        const keyValue = r.get([Model.getDocumentKeyKey()])
        return Model.getDocumentKeyValue(keyValue, true)
      })

      _.each(models, mi => {
        const mid = Model.getDocumentKeyValue(mpath.get(path, mi), true)
        let populatedModel = null
        if (isArray) {
          let vals = _.pick(rMap, idArrayMap[mid])
          populatedModel = _.values(vals)
        } else {
          populatedModel = rMap[mid]
        }

        let dest = path
        if (_.isString(options.populate.target) && options.populate.target) {
          if (fullPath) {
            dest = options.populate.target
          } else {
            // set up dest based on target similarly to how we did path
            const targetParts = options.populate.target.split('.')
            let targetPath = targetParts[0]
            const nextTargetPart = targetParts[1]
            // if next part is an array index append it to path and adjust
            if (nextTargetPart && DIGIT_REGEX.test(nextTargetPart)) {
              targetPath = targetPath.concat('.', nextTargetPart)
            }

            dest = targetPath

            // if populating array element, or within array, lets fill in stuff that's not there first
            const basePath = parts[0]

            let targetProp = mpath.get(targetParts[0], mi)
            const temp = clone(mpath.get(basePath, mi))
            if (targetProp) {
              targetProp = _.defaultsDeep(targetProp, temp)
            } else {
              targetProp = temp
            }
          }
        }

        mpath.set(dest, populatedModel, mi)
      })
    }

    if (missed && missed.length > 0) {
      concatArrays(missing, missed)
    }

    return fn(err, models, missing)
  })
}
