var hooks = require('hooks-fixed');

var CouchbaseDocument = require('./couchdoc');
var utils = require('./utils');

function Model() {
  CouchbaseDocument.apply(this, arguments);
}

/**
 * Set up middleware support
 */

for (var k in hooks) {
  Model.prototype[k] = Model[k] = hooks[k];
}

/**
 * Inherits from CouchbaseDocument.
 */

Model.prototype.__proto__ = CouchbaseDocument.prototype;

/**
 *
 * @param schema
 * @param options
 * @returns {Function}
 */
Model.compile = function (name, schema, connection, options) {

  function model(data) {
    if (!(this instanceof model))
      return new model(data);
    return Model.apply(this, arguments);
  }

  // inherit
  model.prototype = Object.create(Model.prototype);
  // reset constructor
  model.prototype.constructor = model;

  model.__proto__ = Model;
  model.prototype.__proto__ = Model.prototype;

  // attach schema instance
  model.schema = model.prototype.schema = schema;

  // model name
  model.modelName = model.prototype.modelName = name;

  // connection
  model.db = model.prototype.db = connection;

  // only scan top level
  for (var item in schema.tree) {
    // prevent overrides
    if (!utils.isUndefined(model[item])) continue;
    // it must be defined and have a valid function value
    if (schema.tree[item].static === true && !utils.isUndefined(schema.tree[item].value)) {
      model[item] = schema.tree[item].value;
    }
    if (schema.tree[item].method === true && !utils.isUndefined(schema.tree[item].value)) {
      model.prototype[item] = schema.tree[item].value;
    }
  }

  // set up hooks
  var q = model.schema && model.schema.callQueue;
  if (q) {
    for (var i = 0, l = q.length; i < l; i++) {
      var hookFn = q[i][0];
      var args = q[i][1];
      model[hookFn].apply(model, args);
    }
  }

  // if the user wants to alloq modifications
  if (options.freeze !== false) utils.freeze(model);

  return model;
};

module.exports = Model;