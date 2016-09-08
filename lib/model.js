import { EventEmitter } from 'events';
import _ from 'lodash';
import grappling from 'grappling-hook';
import inflection from 'inflection';
import Promise from 'bluebird';

import { PlainBaseModel } from './basemodel';
import Schema from './schema';
import CouchbaseDocument from './cbdocument';
import _privateKey from './privatekey';
import { promisifyCall } from './utils';

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
   * All models generated are an instance of <code>ModelInstance</code>. It also inherits <code>grappling-hook</code>
   * See {@link https://www.github.com/bojand/grappling-hook grappling-hook} for pre and post hooks.
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
      this[_privateKey].db = db || ModelInstance.db;
      this[_privateKey].config = config || ModelInstance.config;
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
  Object.defineProperty(ModelInstance, 'db', {
    enumerable: true,
    configurable: false,
    get: () => {
      return ModelInstance._private.db;
    }
  });

  Object.defineProperty(ModelInstance, '_private', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: { db }
  });

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

  grappling.attach(ModelInstance, {
    createThenable: function (fn) {
      return new Promise(fn);
    },
    attachToPrototype: true
  });

  setupHooks(ModelInstance, config);

  setupIndexFunctions(ModelInstance);

  setupOverrides(ModelInstance);

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
function setupHooks(InstanceModel, config) {
  const ourHookedFnNames = ['save', 'remove', 'index'];
  const schema = InstanceModel.schema;
  const hooks = _.values(schema.hooks);

  _.forEach(hooks, ho => {
    let addHookFn = 'addDynamicHooks';
    if (!config.promisify) {
      addHookFn = 'addFlexibleHooks';
    }
    InstanceModel.prototype[addHookFn](ho.name);
    const mwopts = { passParams: true };
    _.forEach(ho.fns, (fn, index) => {
      if (ourHookedFnNames.indexOf(ho.name) >= 0) {
        const mwFn = fn;
        if (ho.hook === 'post') {
          ho.fns[index] = function (next) {
            mwFn.apply(this);
            next();
          };
        }

        mwopts.passParams = false;
      }
    });
    InstanceModel.prototype[ho.hook](ho.name, ho.fns, mwopts);
  });
}

function generateIndexFinder(InstanceModel, path, name) {
  return function indexFind(param, options, fn) {
    if (!param) {
      return process.nextTick(fn);
    }

    const docKey = this.schema.getRefKey(name, param);
    return InstanceModel._findByIndexValue(docKey, path, options, fn);
  };
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

        const indexFind = generateIndexFinder(InstanceModel, path, name);
        InstanceModel[fnName] = function () {
          return promisifyCall(this, indexFind, ...arguments);
        };
      }
    }
  }
}

const overridableMethods = ['clear'];

function setupOverrides(ModelInstance) {
  const schema = ModelInstance.schema;
  _.forEach(overridableMethods, m => {
    const so = schema.get(m);
    if (_.isFunction(so)) {
      ModelInstance.prototype[m] = so;
    }
  });
}
