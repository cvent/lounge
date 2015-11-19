var utils = require('./utils');

/**
 * Creates a Type used in a Tree instance for a
 * Schema instance. It is meant to provide methods
 * for validation and coercion.
 *
 * @constructor Type
 * @api public
 * @param {Function} Constructor
 * @param {Object} descriptor
 */

function Type(Constructor, descriptor) {
  // ensure creation of Type
  if (!(this instanceof Type)) return new Type(Constructor, descriptor);
  // ensure descriptor object
  descriptor = (typeof descriptor === 'object') ? descriptor : {};

  if (!utils.isFunction(Constructor)) throw new TypeError('Type only expects a function');

  // set the constructor for reference
  this.Constructor = Constructor;

  // remove type property from the descriptor if it was set there
  delete descriptor.type;
  // check for getter
  if (utils.isFunction(descriptor.get)) (this.get = descriptor.get) && delete descriptor.get;
  // check for setter
  if (utils.isFunction(descriptor.set)) (this.set = descriptor.set) && delete descriptor.set;
  // check if the values of this property are enumerable
  if (utils.isArray(descriptor.enum)) (this.enum = descriptor.enum) && delete descriptor.enum;
  // check if strict mode
  if (utils.isBoolean(descriptor.strict)) (this.strict = descriptor.strict) && delete descriptor.strict;
  // check if static
  if (utils.isBoolean(descriptor.static)) (this.static = descriptor.static) && delete descriptor.static;
  // check if method
  if (utils.isBoolean(descriptor.method)) (this.method = descriptor.method) && delete descriptor.method;
  // check if virtual
  if (utils.isBoolean(descriptor.virtual)) (this.virtual = descriptor.virtual) && delete descriptor.virtual;
  // check if ref
  if (utils.isString(descriptor.ref)) (this.ref = descriptor.ref) && delete descriptor.ref;
  // check if has set value
  if (descriptor.value) (this.value = descriptor.value) && delete descriptor.value;
  // check if has validator
  if (utils.isFunction(descriptor.validator)) (this.validator = descriptor.validator) && delete descriptor.validator;
  // check if has default
  if (descriptor.default) {
    if (Constructor !== Function && 'function' === typeof descriptor.default) {
      this.default = descriptor.default();
    } else {
      this.default = descriptor.default;
    }

    delete descriptor.default;
  }
}

/**
 * Return original constructor let it handle valueOf
 */

Type.prototype.valueOf = function () {
  return this.Constructor.valueOf();
};


/**
 * Default getter that coerces a value
 *
 * @api public
 * @function Type#get
 * @param {Mixed} value
 */

Type.prototype.get = function (value) {
  return this.coerce(value);
};


/**
 * Default setter that coerces a value
 *
 * @api public
 * @function Type#set
 * @param {Mixed} value
 */

Type.prototype.set = function (value) {
  return this.coerce(value);
};


/**
 * Validates a defined type.
 * It performs instance of checks on values that are not primitive.
 * Primitive inputs are validated with a 'typeof' check
 *
 * @api public
 * @function Type#validate
 * @param {Mixed} input
 */

Type.prototype.validate = function (input) {
  var Constructor;
  // validate with validator first if present
  if (utils.isFunction(this.validator) && !this.validator(input)) return false;
  // if not strict mode then we don't need to validate anything
  if (this.strict === false) return true;
  // if its an object and the type constructor is
  // not an object then validate that it is an
  // actual instance of the type constructor
  if (typeof input === 'object' && this.Constructor !== Object)
    return (input instanceof this.Constructor);
  // check for enumerated values
  if (utils.isArray(this.enum)) {
    return utils.inArray(this.enum, input);
  }

  // if ref, special case, we can allow mulitple types
  if (this.ref) {
    return (typeof input === 'object' || typeof input === 'string' || typeof input === 'number');
  }

  // check input for primitive types
  switch (typeof input) {
    case 'string':
      Constructor = String;
      break;
    case 'function':
      Constructor = Function;
      break;
    case 'boolean':
      Constructor = Boolean;
      break;
    case 'object':
      Constructor = Object;
      break;
    case 'number':
      Constructor = Number;
      break;
  }
  // compare Type Constructor with input Constructor
  return this.Constructor === Constructor;
};


/**
 * Coerces a given input with the set Constructor type
 *
 * @api public
 * @function Type#coerce
 * @param {Mixed} input
 */

Type.prototype.coerce = function (input) {
  try {
    if (this.Constructor === Date && input instanceof Date) {
      return new this.Constructor(input.toISOString());
    }
    else {
      return this.Constructor(input);
    }
  }
  catch (e) {
    return input;
  }
};

module.exports = exports = Type;