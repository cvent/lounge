import _ from 'lodash';
import async from 'async';
import mpath from 'mpath';
import clone from 'clone';

import MemoDriver from './memodriver';
import * as cdocUtils from './cbdocument.utils.js';
import * as utils from './utils';
import Document from './document';
import _privateKey from './privatekey';

const debug = require('debug')('lounge');

export default class CouchbaseDocument extends Document {
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
  constructor(values, cas, options, schema, name) {
    super(values, options, schema, name);

    this[_privateKey].cas = cas;

    this[_privateKey]._o = {
      refValues: {},
      key: null
    };

    _.merge(this[_privateKey]._o.refValues, cdocUtils.buildRefValues(this.schema.indexes, values));
    this[_privateKey]._o.key = this.getDocumentKeyValue();
  }

  /**
   * Returns the string representation of <code>CAS</code> value.
   * @example
   * console.log(doc.cas); // String: 00000000a71626e4
   * @returns {String}
   */
  get cas() {
    return this.getCAS();
  }

  /**
   * Gets the database driver of the model
   * @returns {Driver|null}
   */
  get db() {
    return this[_privateKey].db;
  }

  /**
   * Gets the config object
   * @returns {Object}
   */
  get config() {
    return this[_privateKey].config;
  }

  /**
   * Returns the document <code>CAS</code> value.
   * @param {Boolean} raw - If <code>true</code> returns the raw CAS document. If <code>false</code> returns string
   *                        representation of CAS. Defaults to <code>false</code>.
   * @returns {String|Object} the CAS value
   * @example
   * console.log(doc.getCAS()); // String: 00000000a71626e4
   * console.log(doc.getCAS(true)); // Object: CouchbaseCas<11338961768815788032>
   */
  getCAS(raw) {
    if (raw) {
      return this[_privateKey].cas;
    }

    let v = '';
    const cas = this[_privateKey].cas;

    if (typeof cas === 'object') {
      let p;
      for (p in cas) {
        if (cas.hasOwnProperty(p) && cas[p]) {
          if (Buffer.isBuffer(cas[p])) {
            v = v.concat(cas[p].toString('hex'));
          } else {
            v = v.concat(cas[p].toString());
          }
        }
      }
    }

    if (cas && (!v || !v.trim().length)) {
      v = cas.toString();
    }

    return v;
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
   * var user = new User({ name: 'Bob Smith', email: 'bsmith@acme.com' });
   * user.save(function(err, savedDoc) {
   *   if(err) console.log(err);
   * });
   */
  save(options, fn) {
    return utils.promisifyCall(this, this._saveImpl, ...arguments);
  }

  _saveImpl(options, fn) {
    console.log('_saveImpl')
    console.dir(arguments[0])
    console.dir(typeof arguments[0])
    console.log('----')
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    options = _.defaults(options || {},
      _.pick(this.schema.options, utils.saveOptionsKeys),
      _.pick(this.config, utils.saveOptionsKeys));

    if (process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL) {
      return process.nextTick(() => {
        return fn(new Error('Forced save error'));
      });
    }

    const changedRefs = [];

    // iteratively save the refs
    const refs = this._getSortedRefPaths(true);
    if (refs && refs.length > 0) {
      async.eachLimit(refs, 20, (path, eachCB) => {
        this._saveRef(path, changedRefs, options, eachCB);
      }, err => {
        if (err) {
          this._broadcast('error', err, this);
          return fn(err);
        }
        this._indexAndSave(changedRefs, options, fn);
      });
    } else {
      this._indexAndSave(changedRefs, options, fn);
    }
  }

  /*!
   * Save the ref at path
   * @param path
   * @param fn
   */
  _saveRef(path, changedRefs, options, fn) {
    const thing = mpath.get(path, this);

    if (_.isUndefined(thing) || _.isNull(thing)) {
      return fn();
    }

    if (!_.isArray(thing)) {
      if (thing instanceof CouchbaseDocument) {
        changedRefs.push({
          path,
          value: thing
        });
      }

      this._saveRefField(this, path, thing, options, fn);
    } else if (_.isArray(thing)) {
      const idArray = [];
      async.forEachOfLimit(thing, 10, (thingDoc, key, arrayCB) => {
        if (thingDoc instanceof CouchbaseDocument) {
          changedRefs.push({
            path: path.concat('.', key),
            value: thingDoc
          });
        }

        this._saveRefField(idArray, path, thingDoc, options, arrayCB);
      }, err => {
        if (!err) {
          mpath.set(path, idArray, this);
        }
        return fn(err);
      });
    }
  }

  /*!
   * Indexes this instance and saves it afterwards
   * @param changedRefs
   * @param options
   * @param fn callback
   */
  _indexAndSave(changedRefs, options, fn) {
    if (options.waitForIndex === true ||
      (_.isUndefined(options.waitForIndex) && this.config.waitForIndex === true)) {
      this.index(options, err => {
        if (err) {
          this._broadcast('error', err, this);
          return fn(err);
        }

        return this._save(changedRefs, options, fn);
      });
    } else {
      this.index(options);
      return this._save(changedRefs, options, fn);
    }
  }

  /*!
   * Saves this instance
   * @param changedRefs
   * @param options
   * @param fn
   */
  _save(changedRefs, options, fn) {
    const toObjectOpts = {
      expandDocumentKey: options.storeFullKey || this.config.storeFullKey,
      virtuals: options.virtuals || false,
      transform: false,
      minimize: options.minimize || false,
      dateToISO: true,
      serializable: false
    };

    const doc = this.toObject(toObjectOpts);
    const id = this.getDocumentKeyValue(true);

    const opts = _.pick(options || {}, ['cas', 'expiry', 'persist_to', 'replicate_to']);

    debug(`save. type: ${this.modelName}  key: ${id}`);

    this.db.upsert(id, doc, opts, (err, res) => {
      if (changedRefs && changedRefs.length > 0) {
        changedRefs.forEach(cr => {
          mpath.set(cr.path, cr.value, this);
        });
      }

      delete this[_privateKey].cas;
      this[_privateKey].cas = res.cas;

      delete this[_privateKey]._o.refValues;
      this[_privateKey]._o.refValues = {};
      _.merge(this[_privateKey]._o.refValues, cdocUtils.buildRefValues(this.schema.indexes, this));

      if (!err) {
        this._broadcast('save', this, options);
      }

      return fn(err, this);
    });
  }

  /**
   * Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
   * and deletes the old ones not needed any more.
   * @param {Object} options
   * @param {Boolean} options.storeFullReferenceId - whether we store full document id in reference documents
   * @param {Function} fn callback
   */
  index(options, fn) {
    return utils.promisifyCall(this, this._index, ...arguments);
  }

  _index(options, fn) {
    const defaults = {
      storeFullReferenceId: _.isUndefined(this.schema.options.storeFullReferenceId) ?
        this.config.storeFullReferenceId : this.schema.options.storeFullReferenceId
    };

    if (typeof options === 'function') {
      fn = options;
      options = defaults;
    }

    if (!fn || typeof fn !== 'function') {
      fn = _.noop;
    }

    options = _.defaults(options || {}, defaults);

    const currentRefValues = cdocUtils.buildRefValues(this.schema.indexes, this);

    const fieldsToRef = cdocUtils.buildIndexObjects(this[_privateKey]._o.refValues, currentRefValues);

    async.eachLimit(fieldsToRef, 20, (refObj, eaCb) => {
      this._indexField(refObj, options, eaCb);
    }, err => {
      if (!err) {
        this._broadcast('index', this, options);
      }
      return fn(err);
    });
  }

  /*!
   * Index document field
   */
  _indexField(obj, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    if (!obj.value) {
      return process.nextTick(fn);
    }

    const docKey = this.schema.getRefKey(obj.name, obj.value);
    const refKeyValue = this.getDocumentKeyValue(_.isUndefined(options.storeFullReferenceId) ?
      this.config.storeFullReferenceId : options.storeFullReferenceId);

    if (obj.indexType === 'array') {
      debug(`array index. operation: ${obj.action} key: ${docKey} refKeyValue: ${refKeyValue}`);
      const indexTranform = cdocUtils.generateIndexTransform(obj, refKeyValue);
      this.db.atomic(docKey, indexTranform, (err, indexDoc) => {
        if (err) {
          this._broadcast('error', err, this);
          return fn(err);
        }

        return fn(err, indexDoc);
      });
    } else {
      const args = obj.action === 'remove' ? [docKey, fn] : [docKey, {
        key: refKeyValue
      }, fn];

      debug(`single index. operation: ${obj.action} key: ${docKey} refKeyValue: ${refKeyValue}`);

      return this.db[obj.action](...args);
    }
  }

  _getSortedRefPaths(reverse) {
    let refs = [];

    if (this.schema.refs) {
      for (const key in this.schema.refs) {
        if (this.schema.refs.hasOwnProperty(key)) {
          refs.push(this.schema.refs[key].path);
        }
      }

      if (refs.length > 0) {
        refs = _.sortBy(refs, 'length');
        if (reverse) {
          refs.reverse();
        }
      }
    }

    return refs;
  }

  /*!
   * Gers the model at a reference path
   * @param {String} path
   * @returns {*}
   */
  _getRefModel(path) {
    let model;
    if (this.schema.refs) {
      const modelName = this.schema.refs[path].ref;
      if (modelName) {
        model = this.db.models[modelName];
      }
    }

    return model;
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
  _saveRefField(doc, path, thing, options, fn) {
    const self = this;

    function saveRefDoc(couchDoc) {
      couchDoc.save(options, err => {
        if (err) {
          this._broadcast('error', err, couchDoc);
          fn(err);
        } else {
          const value = couchDoc.getDocumentKeyValue(self.config.storeFullReferenceId);

          if (Array.isArray(doc)) {
            doc.push(value);
          } else if (doc instanceof CouchbaseDocument || utils.isPlainObject(doc)) {
            mpath.set(path, value, doc);
          }

          fn();
        }
      });
    }

    if (thing instanceof CouchbaseDocument) {
      saveRefDoc(thing);
    } else if (_.isString(thing)) {
      return fn();
    } else if (utils.isPlainObject(thing)) {
      const RefModel = this._getRefModel(path);
      if (RefModel) {
        const instance = new RefModel(thing);
        saveRefDoc(instance);
      } else {
        console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path);
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
   *   if(err) console.log(err);
   * });
   */
  remove(options, fn) {
    return utils.promisifyCall(this, this._removeImpl, ...arguments);
  }

  _removeImpl(options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    if (!options) {
      options = {};
    }

    if (process.env.LOUNGE_DEBUG_FORCE_REMOVE_FAIL) {
      return process.nextTick(() => {
        return fn(new Error('Forced remove error'));
      });
    }

    if (options.removeRefs === true) {
      const refs = this._getSortedRefPaths(true);
      if (refs && refs.length > 0) {
        async.eachLimit(refs, 20, (path, eachCB) => {
          const thing = mpath.get(path, this);

          if (_.isUndefined(thing) || _.isNull(thing)) {
            return eachCB();
          }

          if (!_.isArray(thing)) {
            return this._removeRefField(this, path, thing, options, eachCB);
          } else if (_.isArray(thing)) {
            const idArray = [];
            async.forEachOfLimit(thing, 20, (thingDoc, key, arrayCB) => {
              this._removeRefField(idArray, path, thingDoc, options, arrayCB);
            }, eachCB);
          } else {
            eachCB();
          }
        }, err => {
          if (err) {
            this._broadcast('error', err, this);
            return fn(err);
          }

          this._remove(options, fn);
        });
      } else {
        this._remove(options, fn);
      }
    } else {
      this._remove(options, fn);
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
  _removeRefField(doc, path, thing, options, fn) {
    if (thing instanceof CouchbaseDocument) {
      return thing.remove(options, fn);
    }

    const RefModel = this._getRefModel(path);

    if (RefModel && thing) {
      if (_.isString(thing)) {
        RefModel._findById(thing, {}, null, (err, doc) => {
          if (err) {
            this._broadcast('error', err, this);
            return fn(err);
          } else if (doc) {
            return doc.remove(options, fn);
          }

          return fn();
        });
      } else if (utils.isPlainObject(thing)) {
        const instance = new RefModel(thing);
        return instance.remove(options, fn);
      } else {
        console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path);
        return fn();
      }
    } else {
      console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path);
      return fn();
    }
  }

  /*!
   * Remove this document from database. Removes all index documents.
   * @param options
   * @param fn
   */
  _remove(options, fn) {
    const opts = _.pick(options || {}, ['cas', 'persist_to', 'replicate_to']);
    const key = this.getDocumentKeyValue(true);

    debug(`remove. key: ${key}`);

    this.db.remove(key, opts, err => {
      if (err) {
        this._broadcast('error', err, this);
        console.error('%s.$remove err: %j', this.modelName, err);
      } else {
        this._broadcast('remove', this, options);
        this.removeIndexes(options);
      }

      return fn(err, this);
    });
  }

  /**
   * Removes all lookup / index documents for this document.
   * @param {Object} options
   * @param {Boolean} options.storeFullReferenceId - whether we store full document id in reference documents
   * @param {Function} fn callback
   */
  removeIndexes(options, fn) {
    return utils.promisifyCall(this, this._removeIndexes, ...arguments);
  }

  _removeIndexes(options, fn) {
    const defaults = {
      storeFullReferenceId: _.isUndefined(this.schema.options.storeFullReferenceId) ?
        this.config.storeFullReferenceId : this.schema.options.storeFullReferenceId
    };

    if (typeof options === 'function') {
      fn = options;
      options = defaults;
    }

    if (!fn || typeof fn !== 'function') {
      fn = _.noop;
    }

    options = _.defaults(options || {}, defaults);

    const currentRefValues = cdocUtils.buildRefValues(this.schema.indexes, this);

    const toRemove = _.union(_.values(currentRefValues), _.values(this[_privateKey]._o.refValues));

    // flatten arrays
    const toRemove2 = [];
    toRemove.forEach(e => {
      if (typeof e.value === 'string' || typeof e.value === 'number') {
        toRemove2.push(e);
      } else if (Array.isArray(e.value)) {
        e.value.forEach(ve => {
          toRemove2.push({
            path: e.path,
            name: e.name,
            indexType: e.indexType,
            value: ve
          });
        });
      }
    });

    // uniq
    const uniq = _.uniqWith(toRemove2, (arrVal, otherVal) => {
      const v1 = ''.concat(arrVal.path || '', arrVal.value || '', arrVal.name || '', arrVal.indexType || '');
      const v2 = ''.concat(otherVal.path || '', otherVal.value || '', otherVal.name || '', otherVal.indexType || '');
      return v1 === v2;
    });

    async.eachLimit(uniq, 100, (u, eaCb) => {
      u.action = 'remove';
      this._indexField(u, options, eaCb);
    }, fn);
  }

  /*!
   * Creates an instance of this model from raw couchbase document
   * @param getRes
   * @returns {Function}
   */
  static _createModelObject(getRes) {
    if (getRes && getRes.value) {
      const objData = getRes.value;
      const cas = getRes.cas;
      return new this.prototype.constructor(objData, {}, cas);
    }
  }

  /*!
   * Populate everything
   * @param refs
   * @param options
   * @param memo
   * @param missing
   * @param fn
   */
  _populateAll(refs, options, memo, missing, fn) {
    async.eachLimit(refs, 20, (path, eachCB) => {
      const id = mpath.get(path, this);
      const RefModel = this._getRefModel(path);
      if (!RefModel || !id) {
        return eachCB();
      }

      if (id instanceof RefModel) {
        return eachCB();
      }

      RefModel._findById(id, options, memo, (err, results, missed) => {
        if (err) {
          this._broadcast('error', err, this);
          return eachCB(err);
        }

        if (results) {
          mpath.set(path, results, this);
        }

        if (missed && missed.length > 0) {
          utils.concatArrays(missing, missed);
        }
        return eachCB();
      });
    }, err => {
      return fn(err, this, missing);
    });
  }

  /*!
   *
   * @param options
   * @param memo
   * @param missing
   * @param fn
   * @returns {*}
   */
  _populatePath(options, memo, missing, fn) {
    const parts = options.populate.path.split('.');
    const part = parts[0];

    // first part must be a ref path and cannot be a digit
    if (!this.schema.hasRefPath(part) || /^\d+$/.test(part)) {
      return process.nextTick(() => {
        return fn(null, this, []);
      });
    }

    let path = part;
    const nextPart = parts[1];
    let restIndex = 1;
    // if next part is an array index append it to path and adjust
    if (nextPart && /^\d+$/.test(nextPart)) {
      path = part.concat('.', nextPart);
      restIndex = 2;
    }

    // create the rest of path
    let rest;
    if (parts.length > restIndex) {
      rest = parts.slice(restIndex).join('.');
    }

    // get model
    const Model = this._getRefModel(part);
    if (!Model) {
      console.warn('No model for path: %s', part);
      return process.nextTick(() => {
        return fn(null, this, []);
      });
    }

    // get the ref key
    const id = mpath.get(path, this);
    if (!id || id instanceof Model) {
      return process.nextTick(() => {
        return fn(null, this, []);
      });
    }

    // adjust the populate option for the rest
    const opts = clone(options);
    opts.populate.path = rest;

    let targetParts;
    if (_.isString(options.populate.target) && options.populate.target) {
      targetParts = options.populate.target.split('.');
      opts.populate.target = targetParts.slice(restIndex).join('.');
    }

    // get the ref doc and populate the rest recursively
    Model._findById(id, opts, memo, (err, results, missed) => {
      if (err) {
        this._broadcast('error', err, this);
        return fn(err);
      }
      if (results) {
        let dest = path;
        if (_.isString(options.populate.target) && options.populate.target) {
          // set up dest based on target similarly to how we did path
          const targetParts = options.populate.target.split('.');
          let targetPath = targetParts[0];
          const nextTargetPart = targetParts[1];
          // if next part is an array index append it to path and adjust
          if (nextTargetPart && /^\d+$/.test(nextTargetPart)) {
            targetPath = targetPath.concat('.', nextTargetPart);
          }

          dest = targetPath;

          // if populating array element, or within array, lets fill in stuff that's not there first
          const basePath = parts[0];

          let targetProp = mpath.get(targetParts[0], this);
          const temp = clone(mpath.get(basePath, this));
          if (targetProp) {
            targetProp = _.defaultsDeep(targetProp, temp);
          } else {
            targetProp = temp;
          }
        }

        mpath.set(dest, results, this);
      }

      if (missed && missed.length > 0) {
        utils.concatArrays(missing, missed);
      }

      return fn(err, this, missing);
    });
  }

  /*!
   * Populates embedded documents into this instance based on populate options
   * @param options
   * @param fn
   * @returns {*}
   */
  _populate(options, memo, fn) {
    if (typeof options === 'function') {
      fn = options;
      memo = null;
      options = {};
    }

    if (typeof memo === 'function' && !fn) {
      fn = memo;
      memo = null;
    }

    if (!fn) {
      fn = _.noop;
    }

    if (!options) {
      options = {};
    }

    if (!cdocUtils.hasPopulate(options)) {
      return process.nextTick(() => {
        return fn(null, this, []);
      });
    }

    const refs = this._getSortedRefPaths(true);
    if (!refs || refs.length === 0) {
      return process.nextTick(() => {
        return fn(null, this, []);
      });
    }

    const missing = [];

    if (options.populate === true) {
      // recursively populate everything
      this._populateAll(refs, options, memo, missing, fn);
    } else if (_.isString(options.populate)) {
      options.populate = { path: options.populate };
      this._populatePath(options, memo, missing, fn);
    } else if (_.isPlainObject(options.populate)) {
      this._populatePath(options, memo, missing, fn);
    } else if (Array.isArray(options.populate)) {
      const opts = clone(options);
      async.eachLimit(options.populate, 20, (part, eaCb) => {
        opts.populate = part;
        return this._populate(opts, memo, eaCb);
      }, err => {
        return fn(err, this, missing);
      });
    }
  }

  /*!
   * emits the event using all of our emitters
   */
  _broadcast() {
    if (arguments[0] === 'error') {
      let err = arguments[1];
      if (err instanceof Error) {
        debug(err.message);
      }
    }
    this.emit(...arguments);
    this.constructor.emit(...arguments);
    this[_privateKey].lounge.emit(...arguments);
  }

  /*!
   * calls the callback fn with results based on missing opetions
   */
  static _callback(fn, options, err, result, missing) {
    if (this.config.missing === false) {
      if (options.missing === true) {
        return fn(err, result, missing);
      }

      return fn(err, result);
    }

    if (options.missing === false) {
      return fn(err, result);
    }

    return fn(err, result, missing);
  }

  /*!
   * utility to wrap the callback fn and use our _callback
   */
  static _wrapCallback(fn, options) {
    return (err, result, missing) => {
      return this._callback(fn, options, err, result, missing);
    };
  }

  /**
   * All models created come with a static function <code>findById</code> that can be used to look up a single
   * or multiple keys and retrieve documents from the database. If key does not exist and document is not found we
   * **do not** return an error but also no model is generated. This is different than present couchbase module behaviour.
   * @param {String|Array} id the document id / key or an array of keys
   * @param {Object} options
   * @param {Boolean|String|Array} options.populate - populate options, can be a <code>Boolean</code>;
   *                               <code>String</code> representing a path;
   *                               <code>Object</code> with form <code>{ path: String, target: String}</code> where
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
   *   if(err) console.log(err); // there was an error looking up the key
   *   else if(!doc) console.log('no document found');
   *   else console.log(doc); // doc is instance of User and will print it out
   * });
   */
  static findById(id, options, fn) {
    return utils.promisifyCall(this, this._findByIdImpl, ...arguments);
  }

  static _findByIdImpl(id, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (!options) {
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    if (this.config.alwaysReturnArrays && !Array.isArray(id)) {
      id = [id];
    }

    if (Array.isArray(id)) {
      id = _.compact(id);
    }

    if (!id || _.isEmpty(id)) {
      return process.nextTick(() => {
        return fn(null, null, []);
      });
    }

    const memo = new MemoDriver(this.db);
    const modelName = this.modelName;
    debug(`${modelName}.findById. id: ${id}`);

    this._findById(id, options, memo, this._wrapCallback(fn, options));
    memo.clear();
  }

  static _findById(id, options, memo, fn) {
    if (typeof memo === 'function' && !fn) {
      fn = memo;
      memo = null;
    }

    const driver = memo ? memo : this.db;

    // helper sort function used later
    function sortModels(models) {
      if (options.keepSortOrder) {
        models = _.sortBy(models, o => {
          return id.indexOf(o.getDocumentKeyValue());
        });
      }

      return models;
    }

    if (Array.isArray(id)) {
      const fullIds = _.map(id, curId => {
        return this.getDocumentKeyValue(curId, true);
      });

      driver.get(fullIds, (err, results, misses) => {
        if (err) {
          return fn(err, results, misses);
        }

        if (!results || results.length === 0) {
          return fn(err, [], misses);
        }

        let modelObjs = _.map(results, _.bind(this._createModelObject, this));

        if (!cdocUtils.hasPopulate(options)) {
          modelObjs = sortModels(modelObjs);
          return fn(err, modelObjs, misses);
        }

        async.eachLimit(modelObjs, 100, (modelObj, eachCB) => {
          modelObj._populate(options, memo, (err, popObj, missed) => {
            if (missed && missed.length > 0) {
              utils.concatArrays(misses, missed);
            }
            return eachCB(err);
          });
        }, err => {
          modelObjs = sortModels(modelObjs);
          return fn(err, modelObjs, misses);
        });
      });
    } else {
      id = this.getDocumentKeyValue(id, true);
      driver.get(id, (err, getRes) => {
        if (err) {
          return fn(err);
        }

        const modelObj = this._createModelObject(getRes);
        if (!modelObj) {
          return fn();
        }

        modelObj._populate(options, memo, fn);
      });
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
   *   if(err) console.log(err);
   * });
   */
  static remove(id, options, fn) {
    return utils.promisifyCall(this, this._remove, ...arguments);
  }

  static _remove(id, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (!options) {
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    if (!Array.isArray(id)) {
      id = [id];
    }

    id = _.compact(id);

    if (!id || _.isEmpty(id)) {
      return process.nextTick(() => {
        return fn(null);
      });
    }

    if (options.lean) {
      return async.eachLimit(id, 100, (did, eaCb) => {
        const fullid = this.getDocumentKeyValue(did, true);
        this.db.remove(fullid, eaCb);
      }, fn);
    }

    this.findById(id, (err, docs) => {
      if (err) {
        return fn(err);
      }

      async.eachLimit(docs, 100, (doc, eaCb) => {
        doc.remove(options, eaCb);
      }, fn);
    });
  }

  /*!
   * Find by index document value. generic implementation that we hook up into Models.
   * @param param
   * @param indexPath
   * @param options
   * @param fn
   */
  static _findByIndexValue(param, indexPath, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (!options) {
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    const modelName = this.modelName;
    debug(`${modelName}.findByIndexValue. value: ${param} path: ${indexPath}`);

    this.db.get(param, (err, res) => {
      if (err || !res || !res.value || (!res.value.key && !res.value.keys)) {
        return fn(err);
      }

      let idToGet = res.value.key || res.value.keys;

      if (options.lean) {
        if (this.config.alwaysReturnArrays && !Array.isArray(idToGet)) {
          idToGet = [idToGet];
        }
        return fn(err, idToGet);
      }

      return this.findById(idToGet, options, this._wrapCallback(fn, options));
    });
  }
}
