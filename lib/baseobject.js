const _ = require('lodash');
const clone = require('clone');
var EventEmitter = require('events').EventEmitter;

import _privateKey from './privatekey'
import { typecast, getFunctionName } from './utils';
import { ObjectArray } from './objectarray'

const _reservedFields = ['super'];

// Add field to schema and initializes getter and setter for the field.
function addToSchema(index, properties) {
  this.schema.add(index, properties);

  defineGetter.call(this[_privateKey]._getset, index, this.schema.descriptor[index]);
  defineSetter.call(this[_privateKey]._getset, index, this.schema.descriptor[index]);
}

// Defines getter for specific field.
function defineGetter(index, properties) {
  // If the field type is an alias, we retrieve the value through the alias's target.
  let indexOrAliasIndex = properties.type === 'alias' ? properties.target : index;

  this.__defineGetter__(index, () => {
    try {
      return getter.call(this, this[_privateKey]._obj[indexOrAliasIndex], properties);
    } catch (error) {
      // This typically happens when the default value isn't valid -- log error.
      this[_privateKey]._errors.push(error);
    }
  });
}

// Defines setter for specific field.
function defineSetter(index, properties) {
  this.__defineSetter__(index, (value) => {
    // Don't proceed if readOnly is true.
    if (properties.readOnly) {
      return;
    }

    // call custom validate if specified
    if (properties.validate) {
      if (!properties.validate.call(this, value)) {
        return;
      }
    }

    try {
      // this[_privateKey]._this[index] is used instead of this[_privateKey]._obj[index] to route through the public interface.
      writeValue.call(this[_privateKey]._this, typecast.call(this, value, this[_privateKey]._this[index], properties), properties);
    } catch (error) {
      // Setter failed to validate value -- log error.
      this[_privateKey]._errors.push(error);
    }
  });

  // Aliased fields reflect values on other fields and do not need to be initialized.
  if (properties.isAlias === true) {
    return;
  }

  if (properties.virtual === true) {
    return;
  }

  // In case of object & array, they must be initialized immediately.
  if (properties.type === 'object') {
    if (properties.default !== undefined) {
      writeValue.call(this[_privateKey]._this, _.isFunction(properties.default) ? properties.default.call(this) : properties.default, properties);
    } else if (!properties.ref) {
      // only create default if not an embedded sub doc
      writeValue.call(this[_privateKey]._this, properties.objectType ? new properties.objectType : {}, properties);
    }

    // Native arrays are never used so that toArray can be globally supported.
    // Additionally, other properties such as unique rely on passing through us.
  } else if (properties.type === 'array') {
    writeValue.call(this[_privateKey]._this, new ObjectArray(this, properties), properties);
  }
}

// Used to fetch current values.
function getter(value, properties) {
  // Most calculations happen within the typecast and the value passed is typically the value we want to use.
  // Typically, the getter just returns the value.
  // Modifications to the value within the getter are not written to the object.

  // Getter can transform value after typecast.
  if (properties.get) {
    value = properties.get.call(this, value);
  }

  return value;
}

// Used to write value to object.
function writeValue(value, fieldSchema) {
  // onBeforeValueSet allows you to cancel the operation.
  // It doesn't work like transform and others that allow you to modify the value because all typecast has already happened.
  // For use-cases where you need to modify the value, you can set a new value in the handler and return false.
  if (this.schema.options.onBeforeValueSet) {
    if (this.schema.options.onBeforeValueSet.call(this, fieldSchema.name, value) === false) {
      return;
    }
  }

  // Alias simply copies the value without actually writing it to alias target.
  // Because the value isn't actually set on the alias target, onValueSet isn't fired.
  if (fieldSchema.type === 'alias') {
    this[fieldSchema.target] = value;
    return;
  }

  // if virtual and set specified call it
  if (fieldSchema.virtual === true) {
    if (fieldSchema.set) {
      value = fieldSchema.set.call(this, value);
    }
    else {
      return;
    }
  }

  // Write the value to the inner object.
  this[_privateKey]._obj[fieldSchema.name] = value;

  // onValueSet notifies you after a value has been written.
  if (this.schema.options.onValueSet) {
    this.schema.options.onValueSet.call(this, fieldSchema.name, value);
  }
}

// Reset field to default value.
function clearField(index, properties) {
  // Aliased fields reflect values on other fields and do not need to be cleared.
  if (properties.isAlias === true) {
    return;
  }

  // In case of object & array, they must be initialized immediately.
  if (properties.type === 'object') {
    if (this[properties.name].clear) {
      this[properties.name].clear();
    }
    else {
      writeValue.call(this[_privateKey]._this, undefined, properties);
    }

    // Native arrays are never used so that toArray can be globally supported.
    // Additionally, other properties such as unique rely on passing through Document.
  } else if (properties.type === 'array') {
    this[properties.name].length = 0;

    // Other field types can simply have their value set to undefined.
  } else {
    writeValue.call(this[_privateKey]._this, undefined, properties);
  }
}

export class BaseObject extends EventEmitter {
  /**
   * @classdesc Base representation for all created Document instances.
   * Represents just the document data and generic properties and functions.
   * Also used for "object" abstraction / representation of sub documents that are not actual Models / Documents.
   * Clients should never have to call this directly. Extends <code>EventEmitter</code>.
   *
   * @description Clients do not need to create <code>BaseObject</code> instances manually.
   * @class
   * @augments EventEmitter
   * @param {Object} values - the object data
   * @param {Object} options - creation options
   * @param {Boolean} options.clone - Whether to deep clone the incoming data. Default: <code>false</code>.
   *                                  Make sure you wish to do this as it has performance implications. This is
   *                                  useful if you are creating multiple instances from same base data and then
   *                                  wish to modify each instance.
   * @param {Schema} schema - schema instance
   * @returns {BaseObject}
   */
  constructor(values, options, schema) {
    super();

    // Object used to store internals.
    const _private = this[_privateKey] = {};

    // Object with getters and setters bound.
    _private._getset = this;

    // Public version of ourselves.
    // Overwritten with proxy if available.
    _private._this = this;

    // Object used to store raw values.
    _private._obj = {};

    _private.schema = schema;

    // Errors, retrieved with getErrors().
    _private._errors = [];

    // Reserved keys for storing internal properties accessible from outside.
    _private._reservedFields = {};

    // Define getters/typecasts based off of schema.
    _.each(schema.descriptor, (properties, index) => {
      // Use getter / typecast to intercept and re-route, transform, etc.
      defineGetter.call(_private._getset, index, properties);
      defineSetter.call(_private._getset, index, properties);
    });

    // Proxy used as interface to object allows to intercept all access.
    // Without Proxy we must register individual getter/typecasts to put any logic in place.
    // With Proxy, we still use the individual getter/typecasts, but also catch values that aren't in the schema.
    if (typeof(Proxy) !== 'undefined') {
      const proxy = this[_privateKey]._this = new Proxy(this, {
        // Ensure only public keys are shown
        ownKeys: (target) => {
          return Object.keys(this.toObject());
        },

        // Return keys to iterate
        enumerate: (target) => {
          return Object.keys(this[_privateKey]._this)[Symbol.iterator]();
        },

        // Check to see if key exists
        has: (target, key) => {
          return !!_private._getset[key];
        },

        // Ensure correct prototype is returned.
        getPrototypeOf: () => {
          return _private._getset;
        },

        // Ensure readOnly fields are not writeable.
        getOwnPropertyDescriptor: (target, key) => {
          return {
            value: proxy[key],
            writeable: schema.descriptor[key].readOnly !== true,
            enumerable: true,
            configurable: true
          };
        },

        // Intercept all get calls.
        get: (target, name, receiver) => {
          // First check to see if it's a reserved field.
          if (_reservedFields.includes(name)) {
            return this[_privateKey]._reservedFields[name];
          }

          // Support dot notation via lodash.
          if (this.schema.options.dotNotation && name.indexOf('.') !== -1) {
            return _.get(this[_privateKey]._this, name);
          }

          // Use registered getter without hitting the proxy to avoid creating an infinite loop.
          return this[name];
        },

        // Intercept all set calls.
        set: (target, name, value, receiver) => {
          // Support dot notation via lodash.
          if (this.schema.options.dotNotation && name.indexOf('.') !== -1) {
            return _.set(this[_privateKey]._this, name, value);
          }

          if (!schema.descriptor[name]) {
            if (this.schema.options.strict) {
              // Strict mode means we don't want to deal with anything not in the schema.
              // TODO: SetterError here.
              return;
            } else {
              // Add index to schema dynamically when value is set.
              // This is necessary for toObject to see the field.
              addToSchema.call(this, name, {type: 'any'});
            }
          }

          // This hits the registered setter but bypasses the proxy to avoid an infinite loop.
          this[name] = value;
        },

        // Intercept all delete calls.
        deleteProperty: (target, property) => {
          this[property] = undefined;
          return true;
        }
      });
    }

    // Populate schema defaults into object.
    _.each(schema.descriptor, (properties, index) => {
      if (properties.default !== undefined) {
        // Temporarily ensure readOnly is turned off to prevent the set from failing.
        const readOnly = properties.readOnly;
        properties.readOnly = false;
        this[index] = _.isFunction(properties.default) ? properties.default.call(this) : properties.default;
        properties.readOnly = readOnly;
      }
    });

    // Populate runtime values as provided to this instance of object.
    if (_.isObject(values)) {
      var data = values;
      if (options.clone) {
        data = clone(values);
      }
      this.set(data);
    }

    // May return actual object instance or Proxy, depending on harmony support.
    return _private._this;
  }

  /**
   * Get the model schema instance
   * @api public
   * @returns {Schema}
   */
  get schema() {
    return this[_privateKey].schema;
  }

  /**
   * Sets data on the document based on the schema.
   * Accepts a key of property and value for the property, or object representing the data for document.
   *
   * @api public
   * @example
   * user.set('fistName', 'Joe');
   * user.set({ lastName: 'Smith');
   */
  set(path, value) {
    if (_.isObject(path) && !value) {
      value = path;
      for (const key in value) {
        this[_privateKey]._this[key] = value[key];
      }
    }
    else {
      this[_privateKey]._this[path] = value;
    }
  }

  _prepareToObjectOptions(options, json) {
    var defaultOptions = {transform: true, json: json, minimize: true};

    // When internally saving this document we always pass options,
    // bypassing the custom schema options.
    if (!(options && 'Object' === getFunctionName(options.constructor)) ||
      (options && options._useSchemaOptions)) {
      if (json) {
        options = this.schema.options.toJSON ?
          clone(this.schema.options.toJSON) : {};
        options.json = true;
        options._useSchemaOptions = true;
      } else {
        options = this.schema.options.toObject ?
          clone(this.schema.options.toObject) : {};
        options.json = false;
        options._useSchemaOptions = true;
      }
    }

    for (var key in defaultOptions) {
      if (defaultOptions.hasOwnProperty(key) && options[key] === undefined) {
        options[key] = defaultOptions[key];
      }
    }

    return options;
  }

  /**
   *
   * @param options
   * @param json
   * @returns {{}}
   * @private
   */
  _toObject(options, json) {
    options = this._prepareToObjectOptions(options, json);

    // remember the root transform function
    // to save it from being overwritten by sub-transform functions
    var originalTransform = options.transform;

    let ret = {};

    // Populate all properties in schema.
    _.each(this.schema.descriptor, (properties, index) => {
      // Do not write values to object that are marked as invisible.
      if (properties.invisible && !properties.virtual) {
        return;
      }

      if (properties.virtual && !options.virtuals) {
        return;
      }

      // Fetch value through the public interface.
      let value = this[_privateKey]._this[index];

      if (value === undefined && options.minimize) {
        return;
      }

      // Clone objects so they can't be modified by reference.
      if (typeof value === 'object') {
        if (value._isBaseObject) {
          if (options && options.json && 'function' === typeof value.toJSON) {
            value = value.toJSON(options);
          } else {
            value = value.toObject(options);
          }
        } else if (value._isObjectArray) {
          value = value.toArray();
        } else if (_.isArray(value)) {
          value = value.splice(0);
        } else if (_.isDate(value)) {
          // https://github.com/documentcloud/underscore/pull/863
          // _.clone doesn't work on Date object.
          var d = new Date(value.getTime());
          if (options.dateToISO === true) {
            ret[index] = d.toISOString();
          }
          else {
            ret[index] = new Date(value.getTime());
          }
        } else {
          value = _.clone(value);
        }

        // Don't write empty objects or arrays.
        if (!_.isDate(value) && options.minimize && !_.size(value)) {
          return;
        }
      }

      // Write to object.
      ret[index] = value;
    });

    var transform = options.transform;

    // In the case where a subdocument has its own transform function, we need to
    // check and see if the parent has a transform (options.transform) and if the
    // child schema has a transform (this.schema.options.toObject) In this case,
    // we need to adjust options.transform to be the child schema's transform and
    // not the parent schema's
    if (true === transform || (this.schema.options.toObject && transform)) {

      var opts = options.json ? this.schema.options.toJSON : this.schema.options.toObject;

      if (opts) {
        transform = (typeof options.transform === 'function' ? options.transform : opts.transform);
      }
    } else {
      options.transform = originalTransform;
    }

    if (typeof transform === 'function') {
      var xformed = transform(this, ret, options);
      if (typeof xformed !== 'undefined') {
        ret = xformed;
      }
    }

    return ret;
  }

  /**
   * Converts this document into a plain javascript object.
   *
   * @api public
   * @param {Object} options
   * @param {Function} options.transform - a transform function to apply to the resulting document before returning.
   * @param {Boolean} options.virtuals - apply virtual getters. Default: <code>false</code>
   * @param {Boolean} options.minimize - remove empty objects. Default: <code>true</code>
   * @param {Boolean} options.dateToISO - convert dates to string in ISO format using <code>Date.toISOString()</code>. Default: <code>false</code>
   *
   * @return {Object} Plain javascript object representation of document.
   *
   * @example
   * var userSchema = lounge.schema({ name: String });
   * var User = lounge.model('User', userSchema);
   * var user = new User({name: 'Joe Smith'});
   * console.log(user); // automatically invokes toObject()
   *
   * @example <caption>Example with transform option.</caption>
   * var xform = function (doc, ret, options) {
   *   ret.name = ret.name.toUpperCase();
   *   return ret;
   * };
   * console.dir(user.toObject({transform: xform}); // { name: 'JOE SMITH' }
   */
  toObject(options) {
    return this._toObject(options);
  }

  /**
   * Similar as <code>toObject</code> but applied when <code>JSON.stringify</code> is called
   *
   * @api public
   * @param {Object} options - Same options as <code>toObject</code>.
   * @return {Object} Plain javascript object representation of document.
   */
  toJSON(options) {
    return this._toObject(options, true);
  }

  /**
   * Helper for <code>console.log</code>. Just invokes default <code>toObject</code>.
   * @api public
   */
  inspect() {
    return this.toObject({});
  }

  /**
   * Helper for <code>console.log</code>. Alias for <code>inspect</code>.
   * @api public
   */
  toString() {
    return this.inspect();
  }

  /**
   * Clear the document data.
   */
  clear() {
    _.each(this.schema.descriptor, (properties, index) => {
      clearField.call(this[_privateKey]._this, index, properties);
    });
  }

  /**
   * Gets the errors object.
   */
  getErrors() {
    return this[_privateKey]._errors;
  }

  /**
   * Clears all the errors.
   */
  clearErrors() {
    this[_privateKey]._errors.length = 0;
  }

  /**
   * Checks whether we have any errors.
   * @return {Boolean} <code>true</code> if we have errors, <code>false</code> otherwise.
   */
  hasErrors() {
    return !!this[_privateKey]._errors.length;
  }

  /**
   * Used to detect instance of schema object internally.
   * @private
   */
  _isBaseObject() {
    return true;
  }
}
