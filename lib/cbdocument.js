var _ = require('lodash');
var async = require('async');
var mpath = require('mpath');
var debug = require('debug')('lounge');
const clone = require('clone');

import { Document } from './document';
import _privateKey from './privatekey'

var MemoDriver = require('./memodriver');
var cdocUtils = require('./cbdocument.utils.js');
var utils = require('./utils');

export class CouchbaseDocument extends Document {
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

    var v = '';
    var cas = this[_privateKey].cas;

    if (typeof cas === 'object') {
      var p;
      for (p in cas) {
        if (cas.hasOwnProperty(p) && cas[p]) {
          if (Buffer.isBuffer(cas[p])) {
            v = v.concat(cas[p].toString('hex'));
          }
          else {
            v = v.concat(cas[p].toString());
          }
        }
      }
    }

    if (cas && (!v || !v.trim().length)) {
      v = cas.toString();
    }

    return v;
  };

  /**
   * Save the current model instance. Calls db set function for the model id and saves the properties.
   * @param {Object} data - Optional. Sets the objects data.
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
  save(data, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (typeof data === 'function') {
      fn = data;
      data = null;
      options = {};
    }

    if (!fn) {
      fn = _.noop;
    }

    options = _.defaults(options || {},
      _.pick(this.schema.options, utils.saveOptionsKeys),
      _.pick(this.config, utils.saveOptionsKeys));

    if (process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL) {
      return process.nextTick(function () {
        return fn(new Error('Forced save error'));
      });
    }

    var self = this;

    if (data) {
      var dataProp;
      for (dataProp in data) {
        if (data.hasOwnProperty(dataProp)) {
          self.set(dataProp, data[dataProp]);
        }
      }
    }

    var changedRefs = [];

    // iteratively save the refs
    var refs = this._getSortedRefPaths(true);
    if (refs && refs.length > 0) {
      async.eachLimit(refs, 10, function (path, eachCB) {
        self._saveRef(path, changedRefs, options, eachCB);
      }, function finalCB(err) {
        if (err) {
          return fn(err);
        }
        else {
          self._indexAndSave(changedRefs, options, fn);
        }
      });
    }
    else {
      this._indexAndSave(changedRefs, options, fn);
    }
  };

  /*!
   * Save the ref at path
   * @param path
   * @param fn
   */
  _saveRef(path, changedRefs, options, fn) {
    var self = this;
    var thing = mpath.get(path, self);

    if (_.isUndefined(thing) || _.isNull(thing)) {
      return fn();
    }

    if (!_.isArray(thing)) {
      if (thing instanceof CouchbaseDocument) {
        changedRefs.push({
          path: path,
          value: thing
        });
      }

      self._saveRefField(self, path, thing, options, fn);
    }
    else if (_.isArray(thing)) {
      var idArray = [];
      async.forEachOfLimit(thing, 10, function (thingDoc, key, arrayCB) {
        if (thingDoc instanceof CouchbaseDocument) {
          changedRefs.push({
            path: path.concat('.', key),
            value: thingDoc
          });
        }

        self._saveRefField(idArray, path, thingDoc, options, arrayCB);
      }, function finalArrayCB(err) {
        if (!err) {
          mpath.set(path, idArray, self);
        }
        return fn(err);
      });
    }
  };

  /*!
   * Indexes this instance and saves it afterwards
   * @param changedRefs
   * @param options
   * @param fn callback
   */
  _indexAndSave(changedRefs, options, fn) {
    var self = this;
    if (options.waitForIndex === true ||
      (_.isUndefined(options.waitForIndex) && this.config.waitForIndex === true)) {
      this.index(options, function (err) {
        if (err) {
          return fn(err);
        }

        return self._save(changedRefs, options, fn);
      });
    }
    else {
      this.index(options);
      return self._save(changedRefs, options, fn);
    }
  }

  /*!
   * Saves this instance
   * @param changedRefs
   * @param options
   * @param fn
   */
  _save(changedRefs, options, fn) {
    var self = this;

    var toObjectOpts = {
      expandDocumentKey: options.storeFullKey || this.config.storeFullKey,
      virtuals: options.virtuals || false,
      transform: false,
      minimize: options.minimize || false,
      dateToISO: true
    };

    var doc = this.toObject(toObjectOpts);
    var id = self.getDocumentKeyValue(true);

    var opts = _.pick(options || {}, ['cas', 'expiry', 'persist_to', 'replicate_to']);

    debug('save. type: ' + this.modelName + ' key: ' + id);

    self.db.upsert(id, doc, opts, function (err, res) {
      if (changedRefs && changedRefs.length > 0) {
        changedRefs.forEach(function (cr) {
          mpath.set(cr.path, cr.value, self);
        });
      }

      delete self[_privateKey].cas;
      self[_privateKey].cas = res.cas;

      delete self[_privateKey]._o.refValues;
      self[_privateKey]._o.refValues = {};
      _.merge(self[_privateKey]._o.refValues, cdocUtils.buildRefValues(self.schema.indexes, self));

      self.emit('save', self);

      return fn(err, self);
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
    var defaults = {
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

    var self = this;

    var currentRefValues = cdocUtils.buildRefValues(this.schema.indexes, this);

    var fieldsToRef = cdocUtils.buildIndexObjects(this[_privateKey]._o.refValues, currentRefValues);

    async.eachLimit(fieldsToRef, 10, function (refObj, eaCb) {
      self._indexField(refObj, options, eaCb);
    }, function (err) {
      self.emit('index', err);
      return fn(err);
    });
  }

  /*!
   * Index document field
   */
  _indexField(obj, options, fn) {
    var self = this;

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

    var docKey = self.schema.getRefKey(obj.name, obj.value);
    var refKeyValue = this.getDocumentKeyValue(_.isUndefined(options.storeFullReferenceId) ?
      self.config.storeFullReferenceId : options.storeFullReferenceId);

    var args = obj.action === 'remove' ?
      [docKey, fn] :
      [docKey, {key: refKeyValue}, fn];

    debug('index. operation: ' + obj.action + ' key: ' + docKey + ' refKeyValue: ' + refKeyValue);

    return this.db[obj.action].apply(this.db, args);
  }

  _getSortedRefPaths(reverse) {
    var refs = [];

    if (this.schema.refs) {
      for (var key in this.schema.refs) {
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
    var modelName;
    var model;
    if (this.schema.refs) {
      modelName = this.schema.refs[path].ref;
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
    var self = this;

    var saveRefDoc = function (couchDoc) {
      couchDoc.save(options, function (err, savedDoc) {
        if (err) {
          fn(err);
        }
        else {
          var value = couchDoc.getDocumentKeyValue(self.config.storeFullReferenceId);

          if (Array.isArray(doc)) {
            doc.push(value);
          }
          else if (doc instanceof CouchbaseDocument || utils.isPlainObject(doc)) {
            mpath.set(path, value, doc);
          }

          fn();
        }
      });
    };

    if (thing instanceof CouchbaseDocument) {
      saveRefDoc(thing);
    }
    else if (_.isString(thing)) {
      return fn();
    }
    else if (utils.isPlainObject(thing)) {
      var model = this._getRefModel(path);
      if (model) {
        var instance = new model(thing);
        saveRefDoc(instance);
      }
      else {
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
      return process.nextTick(function () {
        return fn(new Error('Forced remove error'));
      });
    }

    var self = this;

    if (options.removeRefs === true) {
      var refs = this._getSortedRefPaths(true);
      if (refs && refs.length > 0) {
        async.eachLimit(refs, 10, function (path, eachCB) {
          var thing = mpath.get(path, self);

          if (_.isUndefined(thing) || _.isNull(thing)) {
            return eachCB();
          }

          if (!_.isArray(thing)) {
            return self._removeRefField(self, path, thing, options, eachCB);
          }
          else if (_.isArray(thing)) {
            var idArray = [];
            async.forEachOfLimit(thing, 10, function (thingDoc, key, arrayCB) {
              self._removeRefField(idArray, path, thingDoc, options, arrayCB);
            }, eachCB);
          }
          else {
            eachCB();
          }
        }, function finalCB(err) {
          if (err) {
            return fn(err);
          }
          else {
            self._remove(options, fn);
          }
        });
      }
      else {
        self._remove(options, fn);
      }
    }
    else {
      self._remove(options, fn);
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

    var model = this._getRefModel(path);

    if (model && thing) {
      if (_.isString(thing)) {
        model._findById(thing, {}, null, function (err, doc) {
          if (err) {
            return fn(err);
          }
          else if (doc) {
            return doc.remove(options, fn);
          }
          else {
            return fn();
          }
        });
      }
      else if (utils.isPlainObject(thing)) {
        var instance = new model(thing);
        return instance.remove(options, fn);
      }
      else {
        console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path);
        return fn();
      }
    }
    else {
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
    var self = this;
    var opts = _.pick(options || {}, ['cas', 'persist_to', 'replicate_to']);
    var key = this.getDocumentKeyValue(true);

    debug('remove. key: ' + key);

    this.db.remove(key, opts, function (err, removeRes) {
      if (err) {
        console.error('%s.$remove err: %j', self.modelName, err);
      }
      else {
        self.emit('remove', self);
        self.removeIndexes(options);
      }

      return fn(err, self);
    });
  }

  /**
   * Removes all lookup / index documents for this document.
   * @param {Object} options
   * @param {Boolean} options.storeFullReferenceId - whether we store full document id in reference documents
   * @param {Function} fn callback
   */
  removeIndexes(options, fn) {
    var defaults = {
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

    var self = this;

    var currentRefValues = cdocUtils.buildRefValues(this.schema.indexes, this);

    var toRemove = _.union(_.values(currentRefValues), _.values(this[_privateKey]._o.refValues));

    // flatten arrays
    var toRemove2 = [];
    toRemove.forEach(function (e) {
      if (typeof e.value === 'string' || typeof e.value === 'string') {
        toRemove2.push(e);
      }
      else if (Array.isArray(e.value)) {
        e.value.forEach(function (ve) {
          toRemove2.push({
            path: e.path,
            value: ve,
            name: e.name
          });
        });
      }
    });

    // uniq
    var uniq = _.uniq(toRemove2, function (e) {
      var p = e.path || '';
      var v = e.value || '';
      var n = e.name || '';
      return ''.concat(p, v, n);
    });

    async.eachLimit(uniq, 10, function (u, eaCb) {
      u.action = 'remove';
      self._indexField(u, options, eaCb);
    }, fn);
  }

  /*!
   * Creates an instance of this model from raw couchbase document
   * @param getRes
   * @returns {Function}
   */
  static _createModelObject(getRes) {
    if (getRes && getRes.value) {
      var objData = getRes.value;
      var cas = getRes.cas;
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
    var self = this;
    async.eachLimit(refs, 10, function (path, eachCB) {
      var id = mpath.get(path, self);
      var Model = self._getRefModel(path);
      if (!Model || !id) {
        return eachCB();
      }

      if (id instanceof Model) {
        return eachCB();
      }

      Model._findById(id, options, memo, function (err, results, missed) {
        if (err) {
          return eachCB(err);
        }

        if (results) {
          mpath.set(path, results, self);
        }

        if (missed && missed.length > 0) {
          utils.concatArrays(missing, missed);
        }
        return eachCB();
      });
    }, function eaFn(err) {
      return fn(err, self, missing);
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
    var self = this;
    var parts = options.populate.split('.');
    var part = parts[0];

    // first part must be a ref path and cannot be a digit
    if (!self.schema.hasRefPath(part) || /^\d+$/.test(part)) {
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    var path = part;
    var nextPart = parts[1];
    var restIndex = 1;

    // if next part is an array index append it to path and adjust
    if (nextPart && /^\d+$/.test(nextPart)) {
      path = part.concat('.', nextPart);
      restIndex = 2;
    }

    // create the rest of path
    var rest;
    if (parts.length > restIndex) {
      rest = parts.slice(restIndex).join('.');
    }

    // get model
    var Model = self._getRefModel(part);
    if (!Model) {
      console.warn('No model for path: %s', part);
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    // get the ref key
    var id = mpath.get(path, self);
    if (!id || id instanceof Model) {
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    // adjust the populate option for the rest
    var opts = clone(options);
    opts.populate = rest;

    // get the ref doc and populate the rest recursively
    Model._findById(id, opts, memo, function (err, results, missed) {
      if (err) {
        return fn(err);
      }
      if (results) {
        mpath.set(path, results, self);
      }

      if (missed && missed.length > 0) {
        utils.concatArrays(missing, missed);
      }

      return fn(err, self, missing);
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

    var self = this;

    if (!cdocUtils.hasPopulate(options)) {
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    var refs = this._getSortedRefPaths(true);
    if (!refs || refs.length === 0) {
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    var missing = [];

    if (options.populate === true) {
      // recursively populate everything
      self._populateAll(refs, options, memo, missing, fn);
    }
    else if (typeof options.populate === 'string') {
      self._populatePath(options, memo, missing, fn);
    }
    else if (Array.isArray(options.populate)) {
      async.eachLimit(options.populate, 10, function (part, eaCb) {
        var opts = clone(options);
        opts.populate = part;
        return self._populate(opts, memo, eaCb);
      }, function (err) {
        return fn(err, self, missing);
      });
    }
  }

  /**
   * All models created come with a static function <code>findById</code> that can be used to look up a single
   * or multiple keys and retrieve documents from the database. If key does not exist and document is not found we
   * **do not** return an error but also no model is generated. This is different than present couchbase module behaviour.
   * @param {String|Array} id the document id / key or an array of keys
   * @param {Object} options
   * @param {Boolean|String|Array} options.populate - populate options, can be a <code>Boolean</code>,
   *                               <code>String</code> representing a path, or an <code>Array</code> of
   *                               <code>String</code> paths
   * @param {Function} fn callback
   * @example User.findById('user123', function(err, doc) {
   *   if(err) console.log(err); // there was an error looking up the key
   *   else if(!doc) console.log('no document found');
   *   else console.log(doc); // doc is instance of User and will print it out
   * });
   */
  static findById(id, options, fn) {

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
      return process.nextTick(function () {
        return fn(null, null, []);
      });
    }

    var memo = new MemoDriver(this.db);

    var modelName = this.modelName;
    debug(modelName + '.findById. id: ' + id);

    this._findById(id, options, memo, fn);
    memo.clear();
  }

  static _findById(id, options, memo, fn) {
    var self = this;

    if (typeof memo === 'function' && !fn) {
      fn = memo;
      memo = null;
    }

    var driver = memo ? memo : this.db;

    if (Array.isArray(id)) {
      var fullIds = _.map(id, function (curId) {
        return self.getDocumentKeyValue(curId, true);
      });

      driver.get(fullIds, function (err, results, misses) {
        if (err) {
          return fn(err, results, misses);
        }

        if (!results || results.length === 0) {
          return fn(err, [], misses);
        }

        var modelObjs = _.map(results, _.bind(self._createModelObject, self));
        async.eachLimit(modelObjs, 10, function (modelObj, eachCB) {
          modelObj._populate(options, memo, function (err, popObj, missed) {
            if (missed && missed.length > 0) {
              utils.concatArrays(misses, missed);
            }
            return eachCB(err);
          });
        }, function (err) {
          return fn(err, modelObjs, misses);
        });
      });
    }
    else {
      id = this.getDocumentKeyValue(id, true);
      driver.get(id, function (err, getRes) {
        if (err) {
          return fn(err);
        }

        var modelObj = self._createModelObject(getRes);
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
      return process.nextTick(function () {
        return fn(null);
      });
    }

    var self = this;

    if (options.lean) {
      return async.eachLimit(id, 10, function (did, eaCb) {
        var fullid = self.getDocumentKeyValue(did, true);
        self.db.remove(fullid, eaCb);
      }, fn);
    }

    self.findById(id, function (err, docs) {
      async.eachLimit(docs, 10, function (doc, eaCb) {
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
    var self = this;

    var memodriver = new MemoDriver(this.db);

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

    var modelName = this.modelName;
    debug(modelName + '.findByIndexValue. value: ' + param + ' path: ' + indexPath);

    memodriver.get(param, function (err, res) {
      if (err) {
        return fn(err);
      }

      if (!res || !res.value || !res.value.key) {
        return fn();
      }

      var docKey = self.schema.getDocumentKeyValue(res.value.key, true);
      memodriver.get(docKey, function (err, getRes) {
        if (err) {
          return fn(err);
        }

        var mo = self._createModelObject(getRes);

        if (!mo) {
          return fn();
        }

        mo._populate(options, memodriver, fn);
        memodriver.clear();
      });
    });
  }
}