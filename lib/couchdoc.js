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
function CouchbaseDocument() {

  utils.define(this, 'cas', {
    get: function () {
      return this.getCAS();
    }
  });

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
 * Returns the CAS value
 *
 * @api public
 * @function Model#getCAS()
 * @interface
 * @param full to return full CAS object, otherwise we return string representation of it
 */

Document.prototype.getCAS = function (full) {
  if (full) {
    return this.casValue;
  }

  var v = this.casValue;

  if (typeof this.casValue === 'object') {
    var p;
    v = '';
    for (p in this.casValue) {
      v = v.concat(this.casValue[p].toString());
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
  var refs = this._getSoretedRefPaths();
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

        self._saveRefField(self, path, thing, options, eachCB);
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

          self._saveRefField(idArray, path, thingDoc, options, arrayCB);
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
        self._save(changedRefs, options, fn);
      }
    });
  }
  else {
    this._save(changedRefs, options, fn);
  }
};

CouchbaseDocument.prototype._save = function (changedRefs, options, fn) {
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

CouchbaseDocument.prototype._getSoretedRefPaths = function () {
  var refs = [];

  if (this.schema.refs) {
    for (var key in this.schema.refs) {
      if (this.schema.refs.hasOwnProperty(key)) {
        refs.push(this.schema.refs[key].path);
      }
    }

    if (refs.length > 0) {
      refs = _.sortBy(refs, 'length');
      refs.reverse();
    }
  }

  return refs;
};

CouchbaseDocument.prototype._getRefModel = function (path) {
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

CouchbaseDocument.prototype._saveRefField = function (doc, path, thing, options, fn) {
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
    var model = this._getRefModel(path);
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

  this.db.remove(this.getDocumentKeyValue(true), options, function (err, removeRes) {
    // TODO set cas, et al.
    return fn(err, self);
  });
};

module.exports = CouchbaseDocument;