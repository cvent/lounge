import _ from 'lodash'
import inflection from 'inflection'
import traverse from 'traverse'

/*!
 * @param ctx
 * @returns {string}
 */
function getPathFromContext (ctx) {
  let path = ctx.path.join('.')

  // check if we specifically set type
  const lastElement = ctx.path[ctx.path.length - 1]
  if (lastElement) {
    const lev = lastElement.toLowerCase()
    if (lev === 'type') {
      path = ctx.path.slice(0, ctx.path.length - 1).join('.')
    }
  }

  // check if in array
  const reg = new RegExp('^\\d+$')
  const lastPath = path.substring(path.lastIndexOf('.') + 1)
  if (lastPath && reg.test(lastPath)) {
    path = path.substring(0, path.lastIndexOf('.'))
  }

  return path
}

let Model

/*!
 *
 * @param descriptor
 * @returns {Array}
 */
exports.getRefs = function (descriptor) {
  if (!Model) {
    Model = require('./model').Model
  }

  let refs = []
  traverse(descriptor).forEach(function (obj) {
    const ctx = this
    const t = obj.type || obj
    if (obj &&
      ((obj.modelName && Model.isPrototypeOf(t)) ||
        (obj.type === Model && obj.modelName))) {
      const path = getPathFromContext(ctx)

      refs.push({
        path,
        ref: obj.modelName
      })
    }
  })

  refs = _.compact(refs)

  return refs
}

/*!
 *
 * @param descriptor
 * @returns {Array}
 */
exports.getIndexes = function (descriptor) {
  if (!Model) {
    Model = require('./model').Model
  }

  let inds = []

  traverse(descriptor).forEach(function (obj) {
    const ctx = this
    if (obj && obj.index === true && (obj.type || obj.Type)) {
      const t = obj.type || obj.Type
      if ((t === String || t === Number) ||
        (t === 'string' || t === 'number') ||
        (Model.isPrototypeOf(t) && t.modelName) ||
        (obj.modelName && Model.isPrototypeOf(t)) ||
        (obj.modelName && t === Model)) {
        const path = getPathFromContext(ctx)

        let name = obj.indexName
        if (!name) {
          name = ctx.key
          const reg = new RegExp('^\\d+$')
          if (reg.test(name)) {
            name = ctx.path[ctx.path.length - 2]
          }
          name = inflection.singularize(name)
        }

        let indexType = obj.indexType ? obj.indexType.toLowerCase() : 'single'
        if (indexType !== 'single' && indexType !== 'array') {
          indexType = 'single'
        }

        const indexData = { path, name, indexType }
        if (obj.refKeyCase) {
          indexData.refKeyCase = obj.refKeyCase.toLowerCase()
        }

        inds.push(indexData)
      }
    }
  })

  inds = _.compact(inds)
  return inds
}

exports.getIndexName = function (indexPath) {
  if (Array.isArray(indexPath)) {
    return indexPath.join('_and_')
  }
  return indexPath
}
