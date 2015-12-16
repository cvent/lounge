var hooks = require('hooks-fixed');

var CouchbaseDocument = require('./couchdoc');
var utils = require('./utils');

function Model() {
  CouchbaseDocument.apply(this, arguments);
}

/**
 * Set up middleware support
 */
var k;
for (k in hooks) {
  Model.prototype[k] = Model[k] = hooks[k];
}

/**
 * Inherits from CouchbaseDocument.
 */

Model.prototype.__proto__ = CouchbaseDocument.prototype;

// inherited statics
for (k in CouchbaseDocument) {
  Model[k] = CouchbaseDocument[k];
}
/*['findById', '$_createModelObject'].forEach(function (f) {
  if (CouchbaseDocument[f]) {
    Model[f] = CouchbaseDocument[f];
  }
});*/

/**
 *
 * @param schema
 * @param options
 * @returns {Function}
 */
Model.compile = function (name, schema, db, config, options) {

  function InstanceModel(data) {
    if (!(this instanceof InstanceModel))
      return new InstanceModel(data);
    return Model.apply(this, arguments);
  }

  // inherit
  InstanceModel.prototype = Object.create(Model.prototype);
  // reset constructor
  InstanceModel.prototype.constructor = InstanceModel;

  InstanceModel.__proto__ = Model;
  InstanceModel.prototype.__proto__ = Model.prototype;

  // attach schema instance
  InstanceModel.schema = InstanceModel.prototype.schema = schema;

  // model name
  InstanceModel.modelName = InstanceModel.prototype.modelName = name;

  // connection
  InstanceModel.db = InstanceModel.prototype.db = db;

  // config
  InstanceModel.config = InstanceModel.prototype.config = config;

  // only scan top level
  for (var item in schema.tree) {
    // prevent overrides
    if (!utils.isUndefined(InstanceModel[item])) continue;
    // it must be defined and have a valid function value
    if (schema.tree[item].static === true && !utils.isUndefined(schema.tree[item].value)) {
      InstanceModel[item] = schema.tree[item].value;
    }
    if (schema.tree[item].method === true && !utils.isUndefined(schema.tree[item].value)) {
      InstanceModel.prototype[item] = schema.tree[item].value;
    }
  }

  // set up hooks
  var q = InstanceModel.schema && InstanceModel.schema.callQueue;
  if (q) {
    for (var i = 0, l = q.length; i < l; i++) {
      var hookFn = q[i][0];
      var args = q[i][1];
      InstanceModel[hookFn].apply(InstanceModel, args);
    }
  }

  // if the user wants to alloq modifications
  if (options.freeze !== false) utils.freeze(InstanceModel);

  return InstanceModel;
};

module.exports = Model;