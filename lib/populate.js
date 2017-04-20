const clone = require('clone')
const async = require('async')
const { concatArrays } = require('./utils')
const { getRefModel, getSortedRefPaths } = require('./cbdocument.utils')
const _ = require('lodash')
const mpath = require('mpath')

const DIGIT_REGEX = /^\d+$/

/*!
 * Checks whether an options parameter has valid populate options
 * @param options
 * @returns {*}
 */
function hasPopulate (options) {
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
exports.populateAll = function populateAll (refs, options, memo, missing, fn) {
  populateAllArray.call(this, [this], refs, options, memo, missing, (err, docs, missing) => {
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

function populateAllArray (models, refs, options, memo, missing, fn) {
  async.eachLimit(refs, 20, (path, eachCB) => {
    const RefModel = getRefModel.call(this, path)
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
function populatePath (options, memo, missing, fn) {
  populatePathArray.call(this, [this], options, memo, missing, (err, docs, missing) => {
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
function populatePathArray (models, options, memo, missing, fn) {
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
    Model = getRefModel.call(this, part)
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
    Model = getRefModel.call(this, path)
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

exports.populate = function (options, memo, fn) {
  populateArray.call(this, [this], options, memo, (err, docs, missing) => {
    return fn(err, docs ? docs[0] : undefined, missing)
  })
}

function populateArray (models, options, memo, fn) {
  if (!hasPopulate(options)) {
    return process.nextTick(() => {
      return fn(null, models, [])
    })
  }

  const refs = getSortedRefPaths.call(this, true)
  if (!refs || refs.length === 0) {
    return process.nextTick(() => {
      return fn(null, models, [])
    })
  }

  const missing = []

  if (options.populate === true) {
    // recursively populate everything
    populateAllArray.call(this, models, refs, options, memo, missing, fn)
  } else if (_.isString(options.populate)) {
    options.populate = { path: options.populate }
    populatePathArray.call(this, models, options, memo, missing, fn)
  } else if (_.isPlainObject(options.populate)) {
    populatePathArray.call(this, models, options, memo, missing, fn)
  } else if (Array.isArray(options.populate)) {
    async.eachLimit(options.populate, 20, (part, eaCb) => {
      const opts = clone(options)
      opts.populate = part
      return populateArray.call(this, models, opts, memo, eaCb)
    }, err => {
      return fn(err, models, missing)
    })
  }
}

exports.hasPopulate = hasPopulate
exports.populatePath = populatePath
exports.populateArray = populateArray
