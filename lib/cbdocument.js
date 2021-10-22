const _ = require('lodash')
const async = require('async')
const mpath = require('mpath')

const MemoDriver = require('./memodriver')
const cdocUtils = require('./cbdocument.utils.js')
const popUtils = require('./populate.js')
const utils = require('./utils')
const schemaUtils = require('./schema.utils.js')
const Document = require('./document')
const _privateKey = require('./privatekey')

const debug = require('debug')('lounge')

class CouchbaseDocument extends Document {
  /**
   * @classdesc CouchbaseDocument inherits Document and handles all the database related actions.
   * Clients should never have to call this directly.
   *
   * @description Clients do not need to create Document manually.
   * @class
   * @augments Document
   * @param {Object} values - the object data
   * @param {Object} cas - the Couchbase <code>CAS</code> value for the document
   * @param {Object} options - creation options
   * @param {Boolean} options.clone - Whether to deep clone the incoming data. Default: <code>false</code>.
   *                                  Make sure you wish to do this as it has performance implications. This is
   *                                  useful if you are creating multiple instances from same base data and then
   *                                  wish to modify each instance.
   * @param {Schema} schema - schema instance
   * @param {String} name - the model name
   * @returns {CouchbaseDocument}
   */
  constructor (values, cas, options, schema, name) {
    super(values, options, schema, name)

    this[_privateKey].cas = cas

    this[_privateKey]._o = {
      refValues: {},
      key: null
    }

    if (_.isObject(values)) {
      _.merge(this[_privateKey]._o.refValues, cdocUtils.buildRefValues(this.schema.indexes, values))
    }

    this[_privateKey]._o.key = this.getDocumentKeyValue()
  }

  /**
   * Returns the string representation of <code>CAS</code> value.
   * @example
   * console.log(doc.cas) // String: 00000000a71626e4
   * @returns {String}
   */
  get cas () {
    return this.getCAS()
  }

  /**
   * Gets the database driver of the model
   * @returns {Driver|null}
   */
  get db () {
    return this[_privateKey].lounge.db
  }

  /**
   * Gets the config object
   * @returns {Object}
   */
  get config () {
    return this[_privateKey].lounge.config
  }

  /**
   * Returns the document <code>CAS</code> value.
   * @param {Boolean} raw - If <code>true</code> returns the raw CAS document. If <code>false</code> returns string
   *                        representation of CAS. Defaults to <code>false</code>.
   * @returns {String|Object} the CAS value
   * @example
   * console.log(doc.getCAS()) // String: 00000000a71626e4
   * console.log(doc.getCAS(true)) // Object: CouchbaseCas<11338961768815788032>
   */
  getCAS (raw) {
    if (raw) {
      return this[_privateKey].cas
    }

    let v = ''
    const cas = this[_privateKey].cas

    if (typeof cas === 'object') {
      let p
      for (p in cas) {
        if (cas.hasOwnProperty(p) && cas[p]) {
          if (Buffer.isBuffer(cas[p])) {
            v = v.concat(cas[p].toString('hex'))
          } else {
            v = v.concat(cas[p].toString())
          }
        }
      }
    }

    if (cas && (!v || !v.trim().length)) {
      v = cas.toString()
    }

    return v
  }

  /**
   * Save the current model instance. Calls db set function for the model id and saves the properties.
   * @param {Object} options The save options. All options not present here are first looked up from schema options,
   * and then from config options.
   * @param {Boolean} options.storeFullReferenceId - whether to save embedded document property values as full document keys or just the base value
   * @param {Boolean} options.storeFullKey - whether to save the internal document key property as fully expanded value or as the simple value
   * @param {String} options.refIndexKeyPrefix - lookup index document key prefix.
   * @param {Boolean} options.waitForIndex - whether we want to wait for indexing to finish before returning. Default: <code>false</code>.
   * @param {Boolean} options.virtuals - whether we want to save virtuals. Default: <code>false</code>.
   * @param {Boolean} options.minimize - to "minimize" the document by removing any empty properties. Default: <code>true</code>
   * @param {Number} options.expiry - couchbase upsert option
   * @param {Number} options.persist_to - couchbase persist_to option
   * @param {Number} replicate_to - couchbase option
   * @param {Function} fn callback
   * @example
   * var user = new User({ name: 'Bob Smith', email: 'bsmith@acme.com' })
   * user.save(function(err, savedDoc) {
   *   if(err) console.log(err)
   * })
   */
  save (options, fn) {
    return utils.promisifyCall(this, this._saveImpl, ...arguments)
  }

  _saveImpl (options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {}
    }

    if (!fn) {
      fn = _.noop
    }

    const saveOpts = _.defaults({},
      options || {},
      _.pick(this.schema.options, utils.saveOptionsKeys),
      _.pick(this.schema.options.saveOptions || {}, ['expiry', 'persist_to', 'replicate_to']),
      _.pick(this.config, utils.saveOptionsKeys))

    if (process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL) {
      return process.nextTick(() => {
        const err = new Error('Forced save error')
        this._broadcast('error', err, this)
        fn(err)
      })
    }

    const changedRefs = []

    // iteratively save the refs
    const refs = cdocUtils.getSortedRefPaths.call(this, true)
    if (refs && refs.length > 0) {
      async.eachLimit(refs, 20, (path, eachCB) => {
        // use the original options for refs
        this._saveRef(path, changedRefs, options, eachCB)
      }, err => {
        if (err) {
          this._broadcast('error', err, this)
          return fn(err)
        }
        this._indexAndSave(changedRefs, saveOpts, fn)
      })
    } else {
      this._indexAndSave(changedRefs, saveOpts, fn)
    }
  }

  /*!
   * Save the ref at path
   * @param path
   * @param fn
   */
  _saveRef (path, changedRefs, options, fn) {
    const thing = mpath.get(path, this)

    if (_.isUndefined(thing) || _.isNull(thing)) {
      return fn()
    }

    if (!_.isArray(thing)) {
      if (thing instanceof CouchbaseDocument) {
        changedRefs.push({
          path,
          value: thing
        })
      }

      this._saveRefField(path, thing, options, (err, savedRefDoc) => {
        if (err) {
          return fn(err)
        }

        if (savedRefDoc instanceof CouchbaseDocument) {
          const strValue = savedRefDoc.getDocumentKeyValue(this.config.storeFullReferenceId)
          mpath.set(path, strValue, this)
          if (_.isPlainObject(thing)) {
            changedRefs.push({
              path,
              value: savedRefDoc
            })
          }
        }
        return fn(err, savedRefDoc)
      })
    } else if (_.isArray(thing)) {
      const idArray = []
      async.forEachOfLimit(thing, 10, (thingDoc, key, arrayCB) => {
        if (thingDoc instanceof CouchbaseDocument) {
          changedRefs.push({
            path: path.concat('.', key),
            value: thingDoc
          })
        }

        this._saveRefField(path, thingDoc, options, (err, savedRefDoc) => {
          if (err) {
            return arrayCB(err)
          }
          if (savedRefDoc instanceof CouchbaseDocument) {
            const strValue = savedRefDoc.getDocumentKeyValue(this.config.storeFullReferenceId)
            idArray.push(strValue)
            if (_.isPlainObject(thingDoc)) {
              changedRefs.push({
                path: path.concat('.', key),
                value: savedRefDoc
              })
            }
          }
          return arrayCB(err)
        })
      }, err => {
        if (!err) {
          mpath.set(path, idArray, this)
        }
        return fn(err)
      })
    }
  }

  /*!
   * Indexes this instance and saves it afterwards
   * @param changedRefs
   * @param options
   * @param fn callback
   */
  _indexAndSave (changedRefs, options, fn) {
    if (options.waitForIndex === true ||
      (_.isUndefined(options.waitForIndex) && this.config.waitForIndex === true)) {
      this.index(options, err => {
        if (err) {
          this._broadcast('error', err, this)
          return fn(err)
        }

        return this._save(changedRefs, options, fn)
      })
    } else {
      this.index(options)
      return this._save(changedRefs, options, fn)
    }
  }

  /*!
   * Saves this instance
   * @param changedRefs
   * @param options
   * @param fn
   */
  _save (changedRefs, options, fn) {
    const toObjectOpts = {
      expandDocumentKey: options.storeFullKey || this.config.storeFullKey,
      virtuals: false,
      transform: false,
      minimize: options.minimize,
      dateToISO: true,
      serializable: false
    }

    const doc = this.toObject(toObjectOpts)
    const id = this.getDocumentKeyValue(true)

    const opts = _.pick(options || {}, ['cas', 'expiry', 'persist_to', 'replicate_to'])

    debug(`save. type: ${this.modelName}  key: ${id}`)

    this.db.upsert(id, doc, opts, (err, res) => {
      if (err || !res) {
        let error = err || new Error('No upsert response from driver')
        this._broadcast('error', error, this)
        return fn(err)
      }

      if (changedRefs && changedRefs.length > 0) {
        changedRefs.forEach(cr => {
          mpath.set(cr.path, cr.value, this)
        })
      }

      delete this[_privateKey].cas
      this[_privateKey].cas = res.cas

      delete this[_privateKey]._o.refValues
      this[_privateKey]._o.refValues = {}
      _.merge(this[_privateKey]._o.refValues, cdocUtils.buildRefValues(this.schema.indexes, this))

      if (!err) {
        this._broadcast('save', this, options)
      }

      return fn(err, this)
    })
  }

  /**
   * Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
   * and deletes the old ones not needed any more.
   * @param {Object} options
   * @param {Boolean} options.storeFullReferenceId - whether we store full document id in reference documents
   * @param {Boolean} options.atomicLock - whether to use atomicLock
   * @param {Function} fn callback
   */
  index (options, fn) {
    return utils.promisifyCall(this, this._index, ...arguments)
  }

  _index (options, fn) {
    const defaults = {
      storeFullReferenceId: _.isUndefined(this.schema.options.storeFullReferenceId)
        ? this.config.storeFullReferenceId : this.schema.options.storeFullReferenceId,
      atomicLock: this.config.atomicLock
    }

    if (typeof options === 'function') {
      fn = options
      options = defaults
    }

    if (!fn || typeof fn !== 'function') {
      fn = _.noop
    }

    options = _.defaults(options || {}, defaults)

    const currentRefValues = cdocUtils.buildRefValues(this.schema.indexes, this)

    const fieldsToRef = cdocUtils.buildIndexObjects(this[_privateKey]._o.refValues, currentRefValues)
    async.eachLimit(fieldsToRef, 20, (refObj, eaCb) => {
      this._indexField(refObj, options, eaCb)
    }, err => {
      if (!err) {
        this._broadcast('index', this, options)
      }
      return fn(err)
    })
  }

  _indexArrayUsingMutate (obj, docKey, refKeyValue, options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {}
    }
    const saveOptions = _.pick(options, ['expiry', 'persist_to', 'replicate_to'])
    const opts = {}
    _.assign(opts, saveOptions)
    debug(`array index: mutateIn ${docKey}`)
    this.db.bucket.mutateIn(docKey, opts)
      .arrayAddUnique('keys', refKeyValue, { createParents: true })
      .execute((err, r) => {
        if (err && !_.isObject(err)) {
          err = null
        }
        if (err && utils.isSubdocPathExists(err)) {
          err = null
        }
        if (err) {
          if (!utils.isKeyNotFound(err)) {
            this._broadcast('error', err, this)
            return fn(err)
          }
          debug(`array index: ${docKey} not found for mutateIn trying to do atomic transform`)
          this._indexArrayAtomic(obj, docKey, refKeyValue, options, fn)
        } else {
          return fn(err, r)
        }
      })
  }

  _indexArrayAtomic (obj, docKey, refKeyValue, options, fn) {
    const indexTranform = cdocUtils.generateIndexTransform(obj, refKeyValue)
    const saveOptions = _.pick(options, ['expiry', 'persist_to', 'replicate_to'])
    this.db.atomic(docKey, indexTranform, { atomicLock: options.atomicLock, saveOptions }, (err, indexDoc) => {
      if (err) {
        this._broadcast('error', err, this)
        return fn(err)
      }

      return fn(err, indexDoc)
    })
  }

  /*!
   * Index document field
   */
  _indexField (obj, options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {}
    }

    if (!fn) {
      fn = _.noop
    }

    if (!obj.value) {
      return process.nextTick(fn)
    }

    const docKey = this.schema.getRefKey(obj.name, obj.value)
    const refKeyValue = this.getDocumentKeyValue(_.isUndefined(options.storeFullReferenceId)
      ? this.config.storeFullReferenceId : options.storeFullReferenceId)

    if (obj.indexType === 'array') {
      debug(`array index. operation: ${obj.action} key: ${docKey} refKeyValue: ${refKeyValue}`)
      // if (obj.action === cdocUtils.INDEX_ACTIONS.UPSERT && _.isFunction(this.db.bucket.mutateIn)) {
      //   this._indexArrayUsingMutate(obj, docKey, refKeyValue, options, fn)
      // } else {
        this._indexArrayAtomic(obj, docKey, refKeyValue, options, fn)
      // }
    } else {
      const opts = _.pick(options, ['expiry', 'persist_to', 'replicate_to'])
      const args = obj.action === cdocUtils.INDEX_ACTIONS.REMOVE ? [docKey, opts, fn] : [docKey, {
        key: refKeyValue
      }, opts, fn]

      debug(`single index. operation: ${obj.action} key: ${docKey} refKeyValue: ${refKeyValue}`)
      return this.db[obj.action](...args)
    }
  }

  /*!
   * Save embedded document field at a path
   * @param doc
   * @param path
   * @param thing
   * @param options
   * @param fn
   * @returns {*}
   */
  _saveRefField (path, thing, options, fn) {
    function saveRefDoc (couchDoc) {
      couchDoc.save(options, (err, savedDoc) => {
        if (err) {
          this._broadcast('error', err, couchDoc)
          fn(err)
        } else {
          fn(null, couchDoc)
        }
      })
    }

    if (thing instanceof CouchbaseDocument) {
      saveRefDoc(thing)
    } else if (_.isString(thing)) {
      return process.nextTick(fn)
    } else if (utils.isPlainObject(thing)) {
      const RefModel = cdocUtils.getRefModel.call(this, path)
      if (RefModel) {
        const instance = new RefModel(thing)
        saveRefDoc(instance)
      } else {
        console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path)
      }
    }
  }

  /**
   * Removes the instance from the database.
   * Calls the bucket <code>remove()</code> function. Options can be passed to the driver.
   * @param {Object} options Options to be passed to the Couchbase `Bucket.remove()` function.
   * @param {Function} fn callback
   * @example
   * user.remove(function(err, doc) {
   *   if(err) console.log(err)
   * })
   */
  remove (options, fn) {
    return utils.promisifyCall(this, this._removeImpl, ...arguments)
  }

  _removeImpl (options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {}
    }

    if (!fn) {
      fn = _.noop
    }

    if (!options) {
      options = {}
    }

    if (process.env.LOUNGE_DEBUG_FORCE_REMOVE_FAIL) {
      return process.nextTick(() => {
        return fn(new Error('Forced remove error'))
      })
    }

    if (options.removeRefs === true) {
      const refs = cdocUtils.getSortedRefPaths.call(this, true)
      if (refs && refs.length > 0) {
        async.eachLimit(refs, 20, (path, eachCB) => {
          const thing = mpath.get(path, this)

          if (_.isUndefined(thing) || _.isNull(thing)) {
            return eachCB()
          }

          if (!_.isArray(thing)) {
            return this._removeRefField(this, path, thing, options, eachCB)
          } else if (_.isArray(thing)) {
            const idArray = []
            async.forEachOfLimit(thing, 20, (thingDoc, key, arrayCB) => {
              this._removeRefField(idArray, path, thingDoc, options, arrayCB)
            }, eachCB)
          } else {
            eachCB()
          }
        }, err => {
          if (err) {
            this._broadcast('error', err, this)
            return fn(err)
          }

          this._remove(options, fn)
        })
      } else {
        this._remove(options, fn)
      }
    } else {
      this._remove(options, fn)
    }
  }

  /*!
   * Remove embedded document at a path
   * @param doc
   * @param path
   * @param thing
   * @param options
   * @param fn
   * @returns {*}
   */
  _removeRefField (doc, path, thing, options, fn) {
    if (thing instanceof CouchbaseDocument) {
      return thing.remove(options, fn)
    }

    const RefModel = cdocUtils.getRefModel.call(this, path)

    if (RefModel && thing) {
      if (_.isString(thing)) {
        RefModel._findById(thing, {}, null, (err, doc) => {
          if (err) {
            this._broadcast('error', err, this)
            return fn(err)
          } else if (doc) {
            return doc.remove(options, fn)
          }

          return fn()
        })
      } else if (utils.isPlainObject(thing)) {
        const instance = new RefModel(thing)
        return instance.remove(options, fn)
      } else {
        console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path)
        return fn()
      }
    } else {
      console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path)
      return fn()
    }
  }

  /*!
   * Remove this document from database. Removes all index documents.
   * @param options
   * @param fn
   */
  _remove (options, fn) {
    const opts = _.pick(options || {}, ['cas', 'persist_to', 'replicate_to'])
    const key = this.getDocumentKeyValue(true)

    debug(`remove. key: ${key}`)

    this.db.remove(key, opts, err => {
      if (err) {
        this._broadcast('error', err, this)
        console.error('%s.$remove err: %j', this.modelName, err)
      } else {
        this._broadcast('remove', this, options)
        this.removeIndexes(options)
      }

      return fn(err, this)
    })
  }

  /**
   * Removes all lookup / index documents for this document.
   * @param {Object} options
   * @param {Boolean} options.storeFullReferenceId - whether we store full document id in reference documents
   * @param {Function} fn callback
   */
  removeIndexes (options, fn) {
    return utils.promisifyCall(this, this._removeIndexes, ...arguments)
  }

  _removeIndexes (options, fn) {
    const defaults = {
      storeFullReferenceId: _.isUndefined(this.schema.options.storeFullReferenceId)
        ? this.config.storeFullReferenceId : this.schema.options.storeFullReferenceId
    }

    if (typeof options === 'function') {
      fn = options
      options = defaults
    }

    if (!fn || typeof fn !== 'function') {
      fn = _.noop
    }

    options = _.defaults(options || {}, defaults)

    const currentRefValues = cdocUtils.buildRefValues(this.schema.indexes, this)

    const toRemove = _.union(_.values(currentRefValues), _.values(this[_privateKey]._o.refValues))

    // flatten arrays
    const toRemove2 = []
    toRemove.forEach(e => {
      if (typeof e.value === 'string' || typeof e.value === 'number') {
        toRemove2.push(e)
      } else if (Array.isArray(e.value)) {
        e.value.forEach(ve => {
          toRemove2.push({
            path: e.path,
            name: e.name,
            indexType: e.indexType,
            value: ve
          })
        })
      }
    })

    // uniq
    const uniq = _.uniqWith(toRemove2, (arrVal, otherVal) => {
      const v1 = ''.concat(arrVal.path || '', arrVal.value || '', arrVal.name || '', arrVal.indexType || '')
      const v2 = ''.concat(otherVal.path || '', otherVal.value || '', otherVal.name || '', otherVal.indexType || '')
      return v1 === v2
    })

    async.eachLimit(uniq, 100, (u, eaCb) => {
      u.action = cdocUtils.INDEX_ACTIONS.REMOVE
      this._indexField(u, options, eaCb)
    }, fn)
  }

  /*!
   * Creates an instance of this model from raw couchbase document
   * @param getRes
   * @returns {Function}
   */
  static _createModelObject (getRes) {
    if (getRes && getRes.value) {
      const objData = getRes.value
      const cas = getRes.cas
      return new this.prototype.constructor(objData, {}, cas)
    }
  }

  /**
   * Populates this instance given the options
   * @param {Boolean|String|Array} options - populate options, can be a <code>Boolean</code>;
   *                               <code>String</code> representing a path;
   *                               <code>Object</code> with form <code>{ path: String, target: String}</code> where
   *                               <code>path</code> is the path to be populated and <code>target</code> is the target
   *                               field into which to populate. If this format is used, <code>target</code> should be
   *                               part of schema;
   *                               or an <code>Array</code> of
   *                               <code>Strings</code> or <code>Object</code>.
   * @param {Function} fn Callback
   * @example <caption>Populate an instance</caption>
   * User.findBy(userId, (err, user) {
   *   console.log(user.company) // ID
   *   user.populate((err, populatedUser) => {
   *     console.log(user.company) // full populated sub documnet
   *   })
   * })
   * @example <caption>Populate a specific path within an instance</caption>
   * User.findBy(userId, (err, user) {
   *   console.log(user.company) // ID
   *   user.populate('company', (err, populatedUser) => {
   *     console.log(user.company) // full populated sub documnet
   *   })
   * })
   */
  populate (options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {
        populate: true
      }
    } else if (options) {
      options = {
        populate: options
      }
    } else {
      options = {
        populate: true
      }
    }
    return utils.promisifyCall(this, this._populate, options, null, fn)
  }

  /*!
   * Populates embedded documents into this instance based on populate options
   * @param options
   * @param fn
   * @returns {*}
   */
  _populate (options, memo, fn) {
    if (typeof options === 'function') {
      fn = options
      memo = null
      options = {}
    }

    if (typeof memo === 'function' && !fn) {
      fn = memo
      memo = null
    }

    if (!fn) {
      fn = _.noop
    }

    if (!options) {
      options = {}
    }

    return popUtils.populate.call(this, options, memo, fn)
  }

  /*!
   * emits the event using all of our emitters
   */
  _broadcast () {
    if (arguments[0] === 'error') {
      const err = arguments[1]
      if (err instanceof Error) {
        debug(err.message)
      }

      if (!this.config.emitErrors) {
        return
      }
    }

    this.emit(...arguments)
    this.constructor.emit(...arguments)
    this[_privateKey].lounge.emit(...arguments)
  }

  /*!
   * calls the callback fn with results based on missing opetions
   */
  static _callback (fn, options, err, result, missing) {
    if (this.config.missing === false) {
      if (options.missing === true) {
        return fn(err, result, missing)
      }

      return fn(err, result)
    }

    if (options.missing === false) {
      return fn(err, result)
    }

    return fn(err, result, missing)
  }

  /*!
   * utility to wrap the callback fn and use our _callback
   */
  static _wrapCallback (fn, options) {
    return (err, result, missing) => {
      return this._callback(fn, options, err, result, missing)
    }
  }

  /**
   * All models created come with a static function <code>findById</code> that can be used to look up a single
   * or multiple keys and retrieve documents from the database. If key does not exist and document is not found we
   * **do not** return an error but also no model is generated. This is different than present couchbase module behaviour.
   * @param {String|Array} id the document id / key or an array of keys
   * @param {Object} options
   * @param {Boolean|String|Array} options.populate - populate options, can be a <code>Boolean</code>;
   *                               <code>String</code> representing a path;
   *                               <code>Object</code> with form <code>{ path: String, target: String }</code> where
   *                               <code>path</code> is the path to be populated and <code>target</code> is the target
   *                               field into which to populate. If this format is used, <code>target</code> should be
   *                               part of schema;
   *                               or an <code>Array</code> of
   *                               <code>Strings</code> or <code>Object</code>.
   * @param {Boolean} options.keepSortOrder If getting an array of objects, whether we should keep same sort order of
   *                                        returned objects as the <code>id</code>'s passed in.
   *                                        Default: <code>false</code>
   * @param {Boolean} options.missing If set to <code>false</code> we won't return missing keys as the final param in
   *                                  the callback. This option overwrites the Lounge config <code>missing</code> option.
   *                                  Default: <code>true</code>.
   * @param {Function} fn callback
   * @example User.findById('user123', function(err, doc, missing) {
   *   if(err) console.log(err) // there was an error looking up the key
   *   else if(!doc) console.log('no document found')
   *   else console.log(doc) // doc is instance of User and will print it out
   * })
   */
  static findById (id, options, fn) {
    return utils.promisifyCall(this, this._findByIdImpl, ...arguments)
  }

  static _findByIdImpl (id, options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {}
    }

    if (!options) {
      options = {}
    }

    if (!fn) {
      fn = _.noop
    }

    if (this.config.alwaysReturnArrays && !Array.isArray(id)) {
      id = [id]
    }

    if (Array.isArray(id)) {
      id = _.compact(id)
    }

    if (!id || _.isEmpty(id)) {
      return process.nextTick(() => {
        return fn(null, null, [])
      })
    }

    const memo = new MemoDriver(this.lounge.db)
    const modelName = this.modelName
    debug(`${modelName}.findById. id: ${id}`)

    this._findById(id, options, memo, this._wrapCallback(fn, options))
    memo.clear()
  }

  static _findById (id, options, memo, fn) {
    if (typeof memo === 'function' && !fn) {
      fn = memo
      memo = null
    }

    const driver = memo || this.lounge.db

    // helper sort function used later
    function sortModels (models) {
      if (options.keepSortOrder) {
        models = _.sortBy(models, o => {
          return id.indexOf(o.getDocumentKeyValue())
        })
      }

      return models
    }

    if (Array.isArray(id)) {
      const fullIds = _.map(id, curId => {
        return this.getDocumentKeyValue(curId, true)
      })

      driver.get(fullIds, (err, results, misses) => {
        if (err) {
          return fn(err, results, misses)
        }

        if (!results || results.length === 0) {
          return fn(err, [], misses)
        }

        let modelObjs = _.map(results, _.bind(this._createModelObject, this))

        if (!popUtils.hasPopulate(options)) {
          modelObjs = sortModels(modelObjs)
          return fn(err, modelObjs, misses)
        }

        popUtils.populateArray.call(this, modelObjs, options, memo, (err, popObj, missed) => {
          if (missed && missed.length > 0) {
            utils.concatArrays(misses, missed)
          }
          modelObjs = sortModels(modelObjs)
          return fn(err, modelObjs, misses)
        })
      })
    } else {
      id = this.getDocumentKeyValue(id, true)
      driver.get(id, (err, getRes) => {
        if (err) {
          return fn(err)
        }

        const modelObj = this._createModelObject(getRes)
        if (!modelObj) {
          return fn()
        }

        modelObj._populate(options, memo, fn)
      })
    }
  }

  /**
   * Removes specified document(s).
   * @param {String|Array} id - id(s) to remove
   * @param {Object} options - options
   * @param {Boolean} options.lean - if <code>true</code> we will directly do document removal. We do not create an instance of model.
   *                                 No middleware is invoked. No indexes updated. Embedded documents are not deleted. Default: <code>false</code>.
   * @param {Boolean} options.removeRefs - If set to <code>true</code> will remove embedded reference documents. Default: <code>false</code>.
   * @param {Function} fn - callback
   * @example
   * User.remove('user123', function(err, doc) {
   *   if(err) console.log(err)
   * })
   */
  static remove (id, options, fn) {
    return utils.promisifyCall(this, this._remove, ...arguments)
  }

  static _remove (id, options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {}
    }

    if (!options) {
      options = {}
    }

    if (!fn) {
      fn = _.noop
    }

    if (!Array.isArray(id)) {
      id = [id]
    }

    id = _.compact(id)

    if (!id || _.isEmpty(id)) {
      return process.nextTick(() => {
        return fn(null)
      })
    }

    if (options.lean) {
      return async.eachLimit(id, 100, (did, eaCb) => {
        const fullid = this.getDocumentKeyValue(did, true)
        this.lounge.db.remove(fullid, eaCb)
      }, err => {
        return fn(err)
      })
    }

    this.findById(id, (err, docs) => {
      if (err) {
        return fn(err)
      }

      if (docs && docs.length === 1) {
        return docs[0].remove(options, fn)
      }

      async.eachLimit(docs, 100, (doc, eaCb) => {
        doc.remove(options, eaCb)
      }, fn)
    })
  }

  /*!
   * Find by index document value. generic implementation that we hook up into Models.
   * @param param
   * @param indexPath
   * @param options
   * @param fn
   */
  static _findByIndexValue (param, indexPath, options, fn) {
    if (typeof options === 'function') {
      fn = options
      options = {}
    }

    if (!options) {
      options = {}
    }

    if (!fn) {
      fn = _.noop
    }

    const modelName = this.modelName
    debug(`${modelName}.findByIndexValue. value: ${param} path: ${indexPath}`)

    this.lounge.db.get(param, (err, res) => {
      if (err || !res || !res.value || (!res.value.key && !res.value.keys)) {
        const indexDef = _.get(this.schema.indexes, schemaUtils.getIndexName(indexPath))
        if (this.config.alwaysReturnArrays || (indexDef && indexDef.indexType === 'array')) {
          return fn(err, [])
        }
        return fn(err)
      }

      let idToGet = res.value.key || res.value.keys

      if (options.lean) {
        if (this.config.alwaysReturnArrays && !Array.isArray(idToGet)) {
          idToGet = [idToGet]
        }
        return fn(err, idToGet)
      }

      const wfn = this._wrapCallback(fn, options)
      return this.findById(idToGet, options, (err, docs, missing) => {
        if (!docs || (missing && missing.length)) {
          // special case if no missing, means none were retrieved
          if (!missing || !missing.length) {
            missing = idToGet
          }

          debug(`WARNING: missing target reference documents. Model: ${modelName} reference ids: %j. missing: %j`, idToGet, missing)

          if (this.config.errorOnMissingIndex || options.errorOnMissingIndex) {
            const missingStr = missing ? missing.toString() : ''
            const idStr = idToGet ? idToGet.toString() : ''
            const error = new Error(`Missing target reference documents. reference ids: ${idStr} missing: ${missingStr}`)
            error.reference = idToGet
            error.missing = missing
            return wfn(error, docs, missing)
          }
        }

        return wfn(err, docs, missing)
      })
    })
  }
}

module.exports = CouchbaseDocument
