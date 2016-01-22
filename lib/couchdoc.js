var _ = require('lodash');
var async = require('async');
var mpath = require('mpath');
var debug = require('debug')('lounge');

var MemoDriver = require('./memodriver');
var Document = require('./document');
var utils = require('./utils');

/**
 * CouchbaseDocument inherits Document and handles all the database related actions.
 * Clients should never have to call this directly.
 *
 * @constructor
 * @param {Object} data the document data
 * @param {Object} cas the document CAS value from Couchbase
 */
function CouchbaseDocument(data, cas) {
  var self = this;

  this.$_casv = cas;
  this.$_o = {
    refValues: {},
    key: null
  };

  utils.define(this, 'cas', {
    get: function () {
      return self.getCAS();
    }
  });

  Document.apply(this, arguments);

  _.merge(this.$_o.refValues, this.$_buildRefValues(data));
  this.$_o.key = this.getDocumentKeyValue();
}

/**
 * Inherits from Document.
 */
CouchbaseDocument.prototype.__proto__ = Document.prototype;

var k;
for (k in Document) {
  CouchbaseDocument[k] = Document[k];
}

/**
 * Connection the model uses. `Driver` instance.
 *
 * @api public
 * @property db
 */
CouchbaseDocument.prototype.db;

/**
 * Couchbase Bucket the model uses.
 *
 * @api public
 * @property bucket
 */
CouchbaseDocument.prototype.bucket;

/*!
 * Builds ref document values
 * @param data
 * @returns {{}}
 */
CouchbaseDocument.prototype.$_buildRefValues = function (data) {
  var indexes = this.schema.indexes;
  var v;
  var ret = {};
  for (v in indexes) {
    if (indexes.hasOwnProperty(v)) {
      var path = indexes[v].path;
      var name = indexes[v].name;
      var value = mpath.get(path, data);
      var valToStore = null;
      if (typeof value === 'string') {
        valToStore = value;
      }
      if (typeof value === 'number') {
        valToStore = value.toString();
      }
      else if (Array.isArray(value)) {
        valToStore = _.map(value, function (v) {
          if (v) {
            if (typeof v === 'string') {
              return v;
            }
            if (typeof v === 'number') {
              return v.toString();
            }
          }
        });

        valToStore = _.compact(valToStore);
        valToStore = valToStore.sort();
      }
      else if (utils.isUndefined(value) || utils.isNull(value)) {
        valToStore = null;
      }

      ret[name] = {
        path: path,
        value: valToStore,
        name: name
      };
    }
  }

  return ret;
};

/**
 * Returns the document CAS value.
 * @param {Boolean} raw If `true` returns the raw CAS document. If `false` returns string representation of CAS.
 *                  Defaults to `false`.
 * @returns {*} the CAS value
 */
CouchbaseDocument.prototype.getCAS = function (raw) {
  if (raw) {
    return this.$_casv;
  }

  var v = '';
  var cas = this.$_casv;

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
 * @param {Object} data Optional. Sets the objects data.
 * @param {Object} options The save options. All options not present here are first looked up from schema options,
 * and then from config options.
 * - `storeFullReferenceId` - whether to save embedded document property values as full document keys or just the base value
 * - `storeFullKey` - whether to save the internal document key property as fully expanded value or as the simple value
 * - `refIndexKeyPrefix` - lookup index document key prefix.
 * - `waitForIndex` - whether we want to wait for indexing to finish before returning. default is false.
 * - `virtuals` - whether we want to save virtuals. default is false.
 * - `minimize` - to "minimize" the document by removing any empty properties. Default: true
 * - `expiry` - couchbase upsert option
 * - `persist_to` - couchbase persist_to option
 * - `replicate_to` - couchbase option
 * @param {Function} fn callback
 */
CouchbaseDocument.prototype.save = function (data, options, fn) {
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

  if (!options) {
    options = {};
  }

  options = _.defaults(options,
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
  var refs = this.$_getSoretedRefPaths(true);
  if (refs && refs.length > 0) {
    async.eachLimit(refs, 10, function (path, eachCB) {
      var thing = mpath.get(path, self, '$_table');

      if (_.isUndefined(thing) || _.isNull(thing)) {
        eachCB();
      }

      if (!utils.isArray(thing)) {
        if (thing instanceof CouchbaseDocument) {
          changedRefs.push({
            path: path,
            value: thing
          });
        }

        self.$_saveRefField(self, path, thing, options, eachCB);
      }
      else if (utils.isArray(thing)) {
        var idArray = [];
        async.forEachOfLimit(thing, 10, function (thingDoc, key, arrayCB) {
          if (thingDoc instanceof CouchbaseDocument) {
            changedRefs.push({
              path: path.concat('.', key),
              value: thingDoc
            });
          }

          self.$_saveRefField(idArray, path, thingDoc, options, arrayCB);
        }, function finalArrayCB(err) {
          if (!err) {
            mpath.set(path, idArray, self, '$_table');
          }
          return eachCB(err);
        });
      }
    }, function finalCB(err) {
      if (err) {
        return fn(err);
      }
      else {
        self.$_indexAndSave(changedRefs, options, fn);
      }
    });
  }
  else {
    this.$_indexAndSave(changedRefs, options, fn);
  }
};

/*!
 * Indexes this instance and saves it afterwards
 * @param changedRefs
 * @param options
 * @param fn callback
 */
CouchbaseDocument.prototype.$_indexAndSave = function (changedRefs, options, fn) {
  var self = this;
  if (options.waitForIndex === true ||
    (_.isUndefined(options.waitForIndex) && this.config.waitForIndex === true)) {
    this.index(options, function (err) {
      if (err) {
        return fn(err);
      }

      return self.$_save(changedRefs, options, fn);
    });
  }
  else {
    this.index(options);
    return self.$_save(changedRefs, options, fn);
  }
};

/*!
 * Saves this instance
 * @param changedRefs
 * @param options
 * @param fn
 */
CouchbaseDocument.prototype.$_save = function (changedRefs, options, fn) {
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
        mpath.set(cr.path, cr.value, self, '$_table');
      });
    }

    delete self.$_o.refValues;
    self.$_o.refValues = {};
    _.merge(self.$_o.refValues, self.$_buildRefValues(self.$_table));

    self.emit('save', self);

    return fn(err, self);
  });
};

/*!
 * Builds index objects based on initial and current ref doc values
 * @param initialRefs
 * @param currentRefs
 * @returns {Array}
 */
function buildIndexObjects(initialRefs, currentRefs) {
  var ret = [];

  var refValueNames = Object.keys(initialRefs);

  refValueNames.forEach(function (refValueName) {
    var initialRefValue = initialRefs[refValueName];
    var currentlRefValue = currentRefs[refValueName];

    if (!initialRefValue || !currentlRefValue) {
      return;
    }

    var name = initialRefValue.name;
    var initialValue = initialRefValue.value;
    var currentValue = currentRefs[refValueName].value;

    if (utils.isNull(currentValue) || utils.isUndefined(currentValue)) {
      currentValue = null;
    }

    if (Array.isArray(currentValue)) {
      currentValue = currentValue.sort();
    }

    if (Array.isArray(initialValue) || Array.isArray(currentValue)) {
      var toRemove = _.difference(initialValue || [], currentValue || []) || [];
      var union = _.union(initialValue || [], currentValue || []) || [];
      var toAdd = _.difference(union, toRemove) || [];

      toRemove.forEach(function (v) {
        ret.push({
          name: name,
          value: v,
          action: 'remove'
        });
      });

      toAdd.forEach(function (v) {
        ret.push({
          name: name,
          value: v,
          action: 'upsert'
        });
      });
    }
    else {
      if (_.isEqual(initialValue, currentValue)) {
        ret.push({
          name: name,
          value: currentValue,
          action: 'upsert'
        });
      }
      else {
        ret.push({
          name: name,
          value: initialValue,
          action: 'remove'
        });

        ret.push({
          name: name,
          value: currentValue,
          action: 'upsert'
        });
      }
    }
  });

  return ret;
}

/**
 * Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
 * and deletes the old ones not needed any more.
 * @param {Object} options
 * - `storeFullReferenceId` - whether we store full document id in reference documents
 * @param {Function} fn callback
 */
CouchbaseDocument.prototype.index = function (options, fn) {
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

  var currentRefValues = this.$_buildRefValues(this.$_table);

  var fieldsToRef = buildIndexObjects(this.$_o.refValues, currentRefValues);

  async.eachLimit(fieldsToRef, 10, function (refObj, eaCb) {
    self.$_indexField(refObj, options, eaCb);
  }, function (err) {
    self.emit('index', err);
    return fn(err);
  });
};

/*!
 * Index document field
 */
CouchbaseDocument.prototype.$_indexField = function (obj, options, fn) {
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
};

CouchbaseDocument.prototype.$_getSoretedRefPaths = function (reverse) {
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
};

/*!
 * Gers the model at a reference path
 * @param path
 * @returns {*}
 */
CouchbaseDocument.prototype.$_getRefModel = function (path) {
  var modelName;
  var model;
  if (this.schema.refs) {
    modelName = this.schema.refs[path].ref;
    if (modelName) {
      model = this.db.models[modelName];
    }
  }

  return model;
};

/*!
 * Save embedded document field at a path
 * @param doc
 * @param path
 * @param thing
 * @param options
 * @param fn
 * @returns {*}
 */
CouchbaseDocument.prototype.$_saveRefField = function (doc, path, thing, options, fn) {
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
        else if (doc instanceof CouchbaseDocument) {
          mpath.set(path, value, doc, '$_table');
        }
        else if (utils.isPlainObject(doc)) {
          mpath.set(path, value, doc);
        }
        fn();
      }
    });
  };

  if (thing instanceof CouchbaseDocument) {
    saveRefDoc(thing);
  }
  else if (utils.isString(thing)) {
    return fn();
  }
  else if (utils.isPlainObject(thing)) {
    var model = this.$_getRefModel(path);
    if (model) {
      var instance = new model(thing);
      saveRefDoc(instance);
    }
    else {
      console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path);
    }
  }
};

/**
 * Removes the instance from the database.
 * Calls the bucket `remove()` function. Options can be passed to the driver.
 * @param {Object} options Options to be passed to the Couchbase `Bucket.remove()` function.
 * @param {Function} fn callback
 */
CouchbaseDocument.prototype.remove = function (options, fn) {
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
    })
  }

  var self = this;

  if (options.removeRefs === true) {
    var refs = this.$_getSoretedRefPaths(true);
    if (refs && refs.length > 0) {
      async.eachLimit(refs, 10, function (path, eachCB) {
        var thing = mpath.get(path, self, '$_table');

        if (_.isUndefined(thing) || _.isNull(thing)) {
          return eachCB();
        }

        if (!utils.isArray(thing)) {
          return self.$_removeRefField(self, path, thing, options, eachCB);
        }
        else if (utils.isArray(thing)) {
          var idArray = [];
          async.forEachOfLimit(thing, 10, function (thingDoc, key, arrayCB) {
            self.$_removeRefField(idArray, path, thingDoc, options, arrayCB);
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
          self.$_remove(options, fn);
        }
      });
    }
    else {
      self.$_remove(options, fn);
    }
  }
  else {
    self.$_remove(options, fn);
  }
};

/*!
 * Remove embedded document at a path
 * @param doc
 * @param path
 * @param thing
 * @param options
 * @param fn
 * @returns {*}
 */
CouchbaseDocument.prototype.$_removeRefField = function (doc, path, thing, options, fn) {
  if (thing instanceof CouchbaseDocument) {
    return thing.remove(options, fn);
  }

  var model = this.$_getRefModel(path);

  if (model && thing) {
    if (utils.isString(thing)) {
      model.$_findById(thing, {}, null, function (err, doc) {
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
};

/*!
 * Remove this document from database. Removes all index documents.
 * @param options
 * @param fn
 */
CouchbaseDocument.prototype.$_remove = function (options, fn) {
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

    // TODO set cas, et al.
    return fn(err, self);
  });
};

/**
 * Removes all lookup / index documents for this document.
 * @param {Object} options
 * - `storeFullReferenceId` - whether we store full document id in reference documents
 * @param {Function} fn callback
 */
CouchbaseDocument.prototype.removeIndexes = function (options, fn) {
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

  var currentRefValues = this.$_buildRefValues(this.$_table);

  var toRemove = _.union(_.values(currentRefValues), _.values(this.$_o.refValues));

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
    self.$_indexField(u, options, eaCb);
  }, fn);
};

/*!
 * Creates an instance of this model from raw couchbase document
 * @param getRes
 * @returns {Function}
 */
CouchbaseDocument.$_createModelObject = function (getRes) {
  if (getRes && getRes.value) {
    var objData = getRes.value;
    var cas = getRes.cas;
    return new this.prototype.constructor(objData, cas);
  }
};

/*!
 * Checks whether an options parameter has valid populate options
 * @param options
 * @returns {*}
 */
function hasPopulate(options) {
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
    var t = _.compact(options.populate);
    return !_.isEmpty(t);
  }

  if (_.isBoolean(options.populate)) {
    return options.populate;
  }

  return false;
}

/*!
 * Populates embedded documents into this instance based on populate options
 * @param options
 * @param fn
 * @returns {*}
 */
CouchbaseDocument.prototype.$_populate = function (options, memo, fn) {
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

  if (!hasPopulate(options)) {
    return process.nextTick(function () {
      return fn(null, self, []);
    });
  }

  var refs = this.$_getSoretedRefPaths(true);
  if (!refs || refs.length === 0) {
    return process.nextTick(function () {
      return fn(null, self, []);
    });
  }

  var missing = [];

  if (options.populate === true) {
    // recursively populate everything
    async.eachLimit(refs, 10, function (path, eachCB) {
      var id = mpath.get(path, self, '$_table');
      var Model = self.$_getRefModel(path);
      if (!Model || !id) {
        return eachCB();
      }

      if (id instanceof Model) {
        return eachCB();
      }

      Model.$_findById(id, options, memo, function (err, results, missed) {
        if (err) {
          return eachCB(err);
        }

        if (results) {
          mpath.set(path, results, self, '$_table');
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
  else if (typeof options.populate === 'string') {
    var parts = options.populate.split('.');
    var part = parts[0];

    // first part must be a ref path and canont be a digit
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
    var Model = self.$_getRefModel(part);
    if (!Model) {
      console.warn('No model for path: %s', part);
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    // get the ref key
    var id = mpath.get(path, self, '$_table');
    if (!id || id instanceof Model) {
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    // adjust the populate option for the rest
    var opts = utils.cloneDeep(options);
    opts.populate = rest;

    // get the ref doc and populate the rest recursively
    Model.$_findById(id, opts, memo, function (err, results, missed) {
      if (err) {
        return fn(err);
      }
      if (results) {
        mpath.set(path, results, self, '$_table');
      }

      if (missed && missed.length > 0) {
        utils.concatArrays(missing, missed);
      }

      return fn(err, self, missing);
    });
  }
  else if (Array.isArray(options.populate)) {
    async.eachLimit(options.populate, 10, function (part, eaCb) {
      var opts = utils.cloneDeep(options);
      opts.populate = part;
      return self.$_populate(opts, memo, eaCb);
    }, function (err) {
      return fn(err, self, missing);
    });
  }
};

/**
 * Find a document by key value.
 * @param {String} id the document id / key
 * @param {Object} options
 * - `populate` - populate options, can be a `Boolean`, `String` representing a path, or an `Array` of `String` paths
 * @param {Function} fn callback
 */
CouchbaseDocument.findById = function (id, options, fn) {

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

  var modelName = this.prototype.modelName;
  debug(modelName + '.findById. id: ' + id);

  this.$_findById(id, options, memo, fn);
  memo.clear();
};

CouchbaseDocument.$_findById = function (id, options, memo, fn) {
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

      var modelObjs = _.map(results, self.$_createModelObject, self);
      async.eachLimit(modelObjs, 10, function (modelObj, eachCB) {
        modelObj.$_populate(options, memo, function (err, popObj, missed) {
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

      var modelObj = self.$_createModelObject(getRes);
      if (!modelObj) {
        return fn(new Error('no document for id: ' + id));
      }

      modelObj.$_populate(options, memo, fn);
    });
  }
};

/*!
 * Find by index document value. generic implementation that we hook up into Models.
 * @param param
 * @param indexPath
 * @param options
 * @param fn
 */
CouchbaseDocument.$_findByIndexValue = function (param, indexPath, options, fn) {
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

  var modelName = this.prototype.modelName;
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
      if (!getRes || !getRes.value) {
        return fn();
      }

      var mo = self.$_createModelObject(getRes);

      if (!mo) {
        return fn(new Error('no document for id: ' + id));
      }

      mo.$_populate(options, memodriver, fn);
      memodriver.clear();
    });
  });
};

module.exports = CouchbaseDocument;