var _ = require('lodash');
var async = require('async');
var mpath = require('mpath');

var Document = require('./document');
var utils = require('./utils');

/**
 * CouchbaseDocument inherits Document and handles most of the database related stuff.
 *
 * @constructor
 */
function CouchbaseDocument(data, cas) {

  var self = this;

  utils.define(this, 'cas', {
    get: function () {
      return self.getCAS();
    }
  });

  this.$_casv = cas;

  Document.apply(this, arguments);
}

/**
 * Inherits from Document.
 */

CouchbaseDocument.prototype.__proto__ = Document.prototype;

/**
 * Connection the model uses.
 *
 * @api public
 * @property db
 */

CouchbaseDocument.prototype.db;

/**
 * Bucket the model uses.
 *
 * @api public
 * @property bucket
 */

CouchbaseDocument.prototype.bucket;

/**
 * Returns the CAS value
 *
 * @api public
 * @function Model#getCAS()
 * @interface
 * @param full to return full CAS object, otherwise we return string representation of it
 */

CouchbaseDocument.prototype.getCAS = function (full) {
  if (full) {
    return this.$_casv;
  }

  var v = this.$_casv;

  if (typeof this.$_casv === 'object') {
    var p;
    v = '';
    for (p in this.$_casv) {
      if (this.$_casv.hasOwnProperty(p)) {
        v = v.concat(this.$_casv[p].toString());
      }
    }
  }

  return v;
};

/**
 * Save the current model instance. Calls db set function for the model id and saves the properties.
 * @param data optional sets the objects params to data
 * @param options database options. expiry persist_to, replicate_to
 * @param fn
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
    fn = utils.noop;
  }

  if (!options) {
    options = {};
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
      var thing = mpath.get(path, self, 'table');

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
            mpath.set(path, idArray, self, 'table');
          }
          return eachCB(err);
        });
      }
    }, function finalCB(err) {
      if (err) {
        return fn(err);
      }
      else {
        self.$_save(changedRefs, options, fn);
      }
    });
  }
  else {
    this.$_save(changedRefs, options, fn);
  }
};

CouchbaseDocument.prototype.$_save = function (changedRefs, options, fn) {
  var self = this;

  var toObjectOpts = {
    expandDocumentKey: true,
    virtuals: false,
    transform: false,
    dateToISO: true
  };

  var doc = this.toObject(toObjectOpts);
  var idKey = this.getDocumentKeyKey();
  var id = doc[idKey];

  self.db.upsert(id, doc, options, function (err, res) {
    if (changedRefs && changedRefs.length > 0) {
      changedRefs.forEach(function (cr) {
        mpath.set(cr.path, cr.value, self, 'table');
      });
    }

    return fn(err, self);
  });
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

CouchbaseDocument.prototype.$_hasRefPath = function (path) {
  var ret = false;
  if (this.schema.refs && path) {
    path = path.toLowerCase();
    for (var key in this.schema.refs) {
      if (this.schema.refs.hasOwnProperty(key) && this.schema.refs[key].path.toLowerCase() === path) {
        ret = true;
        break;
      }
    }
  }

  return ret;
};

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
          mpath.set(path, value, doc, 'table');
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
 * Calls the db remove function. Options can be passed to the driver.
 * @param options options to be passed to the couchbase remove function.
 * @param fn
 */
CouchbaseDocument.prototype.remove = function (options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  if (!fn) {
    fn = utils.noop;
  }

  if (!options) {
    options = {};
  }

  var self = this;

  if (options.removeRefs) {
    var refs = this.$_getSoretedRefPaths(true);
    if (refs && refs.length > 0) {
      async.eachLimit(refs, 10, function (path, eachCB) {
        var thing = mpath.get(path, self, 'table');

        if (_.isUndefined(thing) || _.isNull(thing)) {
          eachCB();
        }

        if (!utils.isArray(thing)) {
          self.$_removeRefField(self, path, thing, options, eachCB);
        }
        else if (utils.isArray(thing)) {
          var idArray = [];
          async.forEachOfLimit(thing, 10, function (thingDoc, key, arrayCB) {
            self.$_removeRefField(idArray, path, thingDoc, options, arrayCB);
          }, eachCB);
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
  }
  else {
    self.$_remove(options, fn);
  }
};

CouchbaseDocument.prototype.$_removeRefField = function (doc, path, thing, options, fn) {
  if (thing instanceof CouchbaseDocument) {
    return thing.remove(options, fn);
  }

  var model = this.$_getRefModel(path);

  if (model) {
    if (utils.isString(thing)) {
      model.findById(thing, function (err, doc) {
        if (err) {
          return fn(err);
        }

        return doc.remove(options, fn);
      });
    }
    else if (utils.isPlainObject(thing)) {
      var instance = new model(thing);
      return instance.remove(options, fn);
    }
    else {
      console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path);
    }
  }
  else {
    console.error('ref at path \'%s\' is not a couchbase document and cannot fetch a ref model for it', path);
  }
};

CouchbaseDocument.prototype.$_remove = function (options, fn) {
  var self = this;
  this.db.remove(this.getDocumentKeyValue(true), options, function (err, removeRes) {
    // TODO set cas, et al.
    return fn(err, self);
  });
};


CouchbaseDocument.$_createModelObject = function (getRes) {
  if (getRes && getRes.value) {
    var objData = getRes.value;
    var cas = getRes.cas;
    return new this.prototype.constructor(objData, cas);
  }
};

CouchbaseDocument.prototype.$_hasPopulate = function (options) {
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
};

CouchbaseDocument.prototype.$_populate = function (options, fn) {
  var self = this;

  if (!this.$_hasPopulate(options)) {
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
      var id = mpath.get(path, self, 'table');
      var Model = self.$_getRefModel(path);
      if (!Model || !id) {
        return eachCB();
      }

      if (id instanceof Model) {
        return eachCB();
      }

      Model.findById(id, options, function (err, results, missed) {
        if (err) {
          return eachCB(err);
        }

        if (results) {
          mpath.set(path, results, self, 'table');
        }

        missing = missing.concat(missed);
        return eachCB()
      });
    }, function eaFn(err) {
      return fn(err, self, missing);
    });
  }
  else if (typeof options.populate === 'string') {
    var parts = options.populate.split('.');
    var part = parts[0];

    if (/^\d+$/.test(part) || !self.$_hasRefPath(part)) {
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    var path = part;
    var nextPart = parts[1];
    var restIndex = 1;
    if (nextPart && /^\d+$/.test(nextPart)) {
      path = part.concat('.', nextPart);
      restIndex = 2;
    }
    var rest;
    if (parts.length > restIndex) {
      rest = parts.slice(restIndex).join('.');
    }

    var Model = self.$_getRefModel(part);
    if (!Model) {
      console.warn('No model for path: %s', part);
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    var id = mpath.get(path, self, 'table');

    if (!id || id instanceof Model) {
      return process.nextTick(function () {
        return fn(null, self, []);
      });
    }

    var opts = _.cloneDeep(options);
    opts.populate = rest;

    Model.findById(id, opts, function (err, results, missed) {
      if (err) {
        return fn(err);
      }
      if (results) {
        mpath.set(path, results, self, 'table');
      }

      missing = missing.concat(missed);

      return fn(err, self, missing);
    });
  }
  else if (Array.isArray(options.populate)) {
    async.eachLimit(options.populate, 10, function (part, eaCb) {
      var opts = _.cloneDeep(options);
      opts.populate = part;
      return self.$_populate(opts, eaCb);
    }, function (err) {
      return fn(err, self, missing);
    });
  }
};

/**
 *
 * @param id
 * @param options
 * @param fn
 */
CouchbaseDocument.findById = function (id, options, fn) {
  var self = this;

  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  if (!options) {
    options = {};
  }

  if (!fn) {
    fn = utils.noop;
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
    })
  }

  if (Array.isArray(id)) {
    var fullIds = _.map(id, function (curId) {
      return self.schema.getDocumentKeyValue(curId, true);
    });

    self.db.get(fullIds, function (err, results, misses) {
      if (err) {
        return fn(err, results, misses);
      }

      if (!results || results.length === 0) {
        return fn(err, [], misses);
      }

      var modelObjs = _.map(results, self.$_createModelObject, self);
      async.eachLimit(modelObjs, 10, function (modelObj, eachCB) {
        modelObj.$_populate(options, function (err, popObj, missed) {
          misses = misses.concat(missed);
          return eachCB(err);
        });
      }, function (err) {
        return fn(err, modelObjs, misses);
      });
    });
  }
  else {
    id = this.schema.getDocumentKeyValue(id, true);
    self.db.get(id, function (err, getRes) {
      if (err) {
        return fn(err);
      }

      var modelObj = self.$_createModelObject(getRes);
      if (!modelObj) {
        return fn(new Error('no document for id: ' + id));
      }

      modelObj.$_populate(options, fn);
    });
  }
};

module.exports = CouchbaseDocument;