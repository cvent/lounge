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
  Document.apply(this, arguments);
}

/*!
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
 * Save the current model instance. Calls db set function for the model id and saves the properties.
 * @param data optional sets the objects params to data
 * @param fn
 */
CouchbaseDocument.prototype.save = function (data, fn) {
  if (!fn) {
    fn = utils.noop;
  }

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  var self = this;

  if (data) {
    this.setData(data);
  }

  var toObjectOpts = {expandDocumentKey: true, virtuals: false, transform: false};

  var doc = this.toObject(toObjectOpts);
  var idKey = this.getDocumentKeyKey();
  var id = doc[idKey];

  // iteratively save the refs
  var refs = this._getSoretedRefPaths();
  if (refs && refs.length > 0) {
    async.each(refs, function (path, eachCB) {
      var thing = mpath.get(path, doc);
      if (utils.isPlainObject(thing) && !utils.isArray(thing)) {
        self._saveRefField(doc, path, thing, eachCB);
      }
      else if (utils.isArray(thing)) {
        var idArray = [];
        async.each(thing, function (thingDoc, arrayCB) {
          self._saveRefField(idArray, path, thingDoc, arrayCB);
        }, function finalArrayCB(err) {
          if (!err) {
            mpath.set(path, idArray, doc);
          }
          return eachCB(err);
        });
      }
    }, function finalCB(err) {
      if (err) {
        return fn(err);
      }
      else {
        self.db.set(id, doc, function (err, res) {
          return fn(err, self);
        });
      }
    });
  }
  else {
    self.db.set(id, doc, function (err, res) {
      return fn(err, self);
    });
  }
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

CouchbaseDocument.prototype._saveRefField = function (doc, path, thing, fn) {
  var self = this;
  var idKey = self.getDocumentKeyKey();

  var saveThing = function (couchDoc) {
    couchDoc.save(function (err, savedDoc) {
      if (err) {
        fn(err);
      }
      else {
        if (Array.isArray(doc)) {
          var value = {};
          value[idKey] = couchDoc.getDocumentKeyValue(true);
          doc.push(value);
        }
        else {
          var value = {};
          value[idKey] = couchDoc.getDocumentKeyValue(true);
          mpath.set(path, value, doc);
        }
        fn();
      }
    });
  };

  if (thing instanceof CouchbaseDocument) {
    saveThing(thing);
  }
  else if (utils.isPlainObject(thing)) {
    var model = this._getRefModel(path);
    if (model) {
      var instance = new model(thing);
      saveThing(instance);
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

  this.db.remove(this.getDocumentKeyValue(true), options, fn);
};

module.exports = CouchbaseDocument;