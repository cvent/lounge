var hooks = require('hooks-fixed');
var inflection = require('inflection');

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

/**
 * Creates a new Model class based on name and schema
 * @param {String} name name of the model
 * @param {Schema} schema schema definition
 * @param {Driver} db the database driver
 * @param {Object} config the Lounge config
 * @param {Object} options
 *                - freeze - to freeze the model. see Object.freeze()
 * @returns {Function}
 */
Model.compile = function (name, schema, db, config, options) {

  function InstanceModel(data) {
    if (!(this instanceof InstanceModel))
      return new InstanceModel(data);
    return Model.apply(this, arguments);
  }

  var BaseProto = Model.prototype;
  var Base = Model;

  // inherit
  InstanceModel.prototype = Object.create(BaseProto);
  // reset constructor
  InstanceModel.prototype.constructor = InstanceModel;

  InstanceModel.__proto__ = Base;
  InstanceModel.prototype.__proto__ = BaseProto;

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

  setupHooks(InstanceModel);

  setupIndexFunctions(InstanceModel);

  // if the user wants to allow modifications
  if (options.freeze !== false) utils.freeze(InstanceModel);

  return InstanceModel;
};

/*!
 * Sets up hooks for the new Model
 * @param InstanceModel
 */
function setupHooks(InstanceModel) {
  // set up hooks
  var ourHookedFnNames = ['save', 'remove'];
  ourHookedFnNames.forEach(function (fnName) {
    InstanceModel.hook(fnName, InstanceModel.prototype[fnName]);
  });

  var q = InstanceModel.schema && InstanceModel.schema.callQueue;

  if (q) {
    for (var i = 0, l = q.length; i < l; i++) {
      var hookFn = q[i].hook;
      var args = q[i].args;

      var hookedFnName = args[0];
      if (ourHookedFnNames.indexOf(hookedFnName) === -1) {
        InstanceModel.hook(hookedFnName, InstanceModel.prototype[hookedFnName]);
      }

      function wrapPostHook(fnArgs, index) {
        var mwfn = fnArgs[index];

        function hookCb(next) {
          mwfn.apply(this);
          next(undefined, this);
        }

        fnArgs[index] = hookCb;
      }

      // wrap post
      if (hookFn === 'post' && ourHookedFnNames.indexOf(hookedFnName) >= 0) {
        if (args.length === 2 && typeof args[1] === 'function') {
          wrapPostHook(args, 1);
        }
        else if (args.length === 3 && typeof args[2] === 'function') {
          wrapPostHook(args, 2);
        }
      }

      InstanceModel[hookFn].apply(InstanceModel, args);
    }
  }
}

/*!
 * Sets up index query functions
 * @param InstanceModel
 */
function setupIndexFunctions(InstanceModel) {
  if (InstanceModel && InstanceModel.schema && InstanceModel.schema.indexes) {
    var indexes = InstanceModel.schema.indexes;
    var v;
    for (v in indexes) {
      if (indexes.hasOwnProperty(v)) {
        var path = indexes[v].path;
        var name = indexes[v].name;
        var fnName = 'findBy'.concat(inflection.camelize(name));

        InstanceModel[fnName] = function (param, options, fn) {
          if (!param) {
            return process.nextTick(fn);
          }

          var docKey = this.schema.getRefKey(name, param);
          return InstanceModel.$_findByIndexValue(docKey, path, options, fn);
        };
      }
    }
  }
}

module.exports = Model;