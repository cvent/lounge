import { EventEmitter } from 'events';
import _ from 'lodash';
import hooks from 'hooks-fixed';
import inflection from 'inflection';

import { PlainBaseModel } from './basemodel';
import Schema from './schema';
import CouchbaseDocument from './cbdocument';
import _privateKey from './privatekey';

/**
 * @name Model
 * @classdesc Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code>
 * @description Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code>
 * @class
 * @augments CouchbaseDocument
*/
export class Model extends CouchbaseDocument {}

/**
 * Compiles a schema into a Model
 * @param schema
 * @param options
 * @returns {ObjectInstance}
 * @private
 */

function compilePlainObject(schema, options) {
  class PlainModelInstance extends PlainBaseModel {
    constructor(data, options = {}) {
      super(data, options, schema);
    }
  }

  PlainModelInstance.schema = schema;

  // if the user wants to allow modifications
  if (options.freeze !== false) {
    Object.freeze(PlainModelInstance);
  }

  return PlainModelInstance;
}

/**
 * Compiles a descriptor into an <code>PlainModelInstance</code> or <code>ModelInstance</code>
 * @param {Schema|Object} descriptor - the schema or schema descriptor. If <code>Object</code> we create a new schema and
 *                                     create an <code>PlainModelInstance</code>, otherwise we create a <code>ModelInstance</code>
 * @param {Object} options - Schema creation options
 * @param {String|undefined} name - the name of the model
 * @param {Driver|null} db - the database driver
 * @param {Object} config - the config
 * @returns {PlainModelInstance|ModelInstance}
 * @private
 */
export function compile(descriptor, options = {}, name = undefined, lounge) {
  // Some of the options require the reflection.
  if (typeof Proxy === 'undefined') {
    // If strict mode is off but the --harmony flag is not, fail.
    if (!options.strict) {
      throw new Error('Turning strict mode off requires --harmony flag.');
    }

    // If dot notation is on but the --harmony flag is not, fail.
    if (options.dotNotation) {
      throw new Error('Dot notation support requires --harmony flag.');
    }
  }

  let schema = descriptor;
  if (!(schema instanceof Schema)) {
    schema = new Schema(schema, options);
    return compilePlainObject(schema, options);
  }

  const db = lounge ? lounge.db : null;
  const config = lounge ? lounge.config : null;

  /**
   * ModelInstance class is the compiled class from a schema definition. It extends <code>Model</code>.
   * All models generated are an instance of ModelInstance. It also inherits <code>hooks-fixed</code>
   * See {@link https://www.npmjs.com/package/hooks-fixed hooks-fixed} for pre and post hooks.
   * @class
   * @augments Model
   *
   */
  class ModelInstance extends Model {
    /**
     * This would be the constructor for the generated models.
     * @param {Object} data - the model instance data
     * @param {Object} options - optional creation options
     * @param {Boolean} options.clone - Whether to deep clone the incoming data. Default: <code>false</code>.
     *                                  Make sure you wish to do this as it has performance implications. This is
     *                                  useful if you are creating multiple instances from same base data and then
     *                                  wish to modify each instance.
     * @param {Object} cas - the Couchbase <code>CAS</code> value
     */
    constructor(data, options = {}, cas = undefined) {
      super(data, cas, options, schema, name);
      this[_privateKey].lounge = lounge;
      this[_privateKey].db = db;
      this[_privateKey].config = config;
    }
  }

  // inherit hooks
  let k;
  for (k in hooks) {
    if (hooks.hasOwnProperty(k)) {
      ModelInstance.prototype[k] = ModelInstance[k] = hooks[k];
    }
  }

  // inherit EventEmitter into the ModelInstance for ModelInstance-scoped events
  ModelInstance.emitter = new EventEmitter();
  [
    'listenerCount', 'addListener', 'emit', 'getMaxListeners', 'listenerCount', 'listeners', 'on', 'once',
    'removeAllListeners', 'removeListener', 'setMaxListeners'
  ].forEach(key => {
    ModelInstance[key] = function () {
      ModelInstance.emitter[key](...arguments);
    };
  });

  /**
   * @name schema
   * @static {Schema}
   * @memberof ModelInstance
   * @description Schema the schema of this model.
   */
  ModelInstance.schema = schema;

  /**
   * @name modelName
   * @static {String}
   * @memberof ModelInstance
   * @description The name of the model.
   */
  ModelInstance.modelName = name;

  /**
   * @name db
   * @static {Driver}
   * @memberof ModelInstance
   * @description The driver.
   */
  ModelInstance.db = db;

  /**
   * @name config
   * @static {Object}
   * @memberof ModelInstance
   * @description The config.
   */
  ModelInstance.config = config;

  // Add custom methods to generated class.
  _.each(schema.methods, (method, key) => {
    if (ModelInstance.prototype[key]) {
      throw new Error(`Cannot overwrite existing ${key} method with custom method.`);
    }
    ModelInstance.prototype[key] = method;
  });

  // Add custom static methods to generated class.
  _.each(schema.statics, (method, key) => {
    if (ModelInstance[key]) {
      throw new Error(`Cannot overwrite existing ${key} static with custom method.`);
    }
    ModelInstance[key] = method;
  });

  setupHooks(ModelInstance);

  setupIndexFunctions(ModelInstance);

  // if the user wants to allow modifications
  if (options.freeze !== false) {
    Object.freeze(ModelInstance);
  }

  return ModelInstance;
}

/*!
 * Sets up hooks for the new Model
 * @param InstanceModel
 */
function setupHooks(InstanceModel) {
  // set up hooks
  const ourHookedFnNames = ['save', 'remove'];
  ourHookedFnNames.forEach(fnName => {
    InstanceModel.hook(fnName, InstanceModel.prototype[fnName]);
  });

  const q = InstanceModel.schema && InstanceModel.schema.callQueue;

  function wrapPostHook(fnArgs, index) {
    const mwfn = fnArgs[index];

    function hookCb(next) {
      mwfn.apply(this);
      next(undefined, this);
    }

    fnArgs[index] = hookCb;
  }

  if (q) {
    let i;
    let l;
    for (i = 0, l = q.length; i < l; i++) {
      const hookFn = q[i].hook;
      const args = q[i].args;

      const hookedFnName = args[0];
      if (ourHookedFnNames.indexOf(hookedFnName) === -1) {
        InstanceModel.hook(hookedFnName, InstanceModel.prototype[hookedFnName]);
      }

      // wrap post
      if (hookFn === 'post' && ourHookedFnNames.indexOf(hookedFnName) >= 0) {
        if (args.length === 2 && typeof args[1] === 'function') {
          wrapPostHook(args, 1);
        } else if (args.length === 3 && typeof args[2] === 'function') {
          wrapPostHook(args, 2);
        }
      }

      InstanceModel[hookFn](...args);
    }
  }
}

/*!
 * Sets up index query functions
 * @param InstanceModel
 */
function setupIndexFunctions(InstanceModel) {
  if (InstanceModel && InstanceModel.schema && InstanceModel.schema.indexes) {
    const indexes = InstanceModel.schema.indexes;
    let v;
    for (v in indexes) {
      if (indexes.hasOwnProperty(v)) {
        const path = indexes[v].path;
        const name = indexes[v].name;
        const fnName = 'findBy'.concat(inflection.camelize(name));

        InstanceModel[fnName] = function (param, options, fn) {
          if (!param) {
            return process.nextTick(fn);
          }

          const docKey = this.schema.getRefKey(name, param);
          return InstanceModel._findByIndexValue(docKey, path, options, fn);
        };
      }
    }
  }
}
