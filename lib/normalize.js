const _ = require('lodash')
const clone = require('clone')

let model = null

module.exports = normalizeProperties

// Properties can be passed in multiple forms (an object, just a type, etc).
// Normalize to a standard format.
function normalizeProperties (properties, name) {
  // HACK
  if (!model) {
    model = require('./model')
  }

  // Allow for shorthand type declaration:
  // Check to see if the user passed in a raw type of a properties hash.
  if (properties) {
    // Raw type passed.
    // index: Type is translated to index: {type: Type}
    // Properties hash created.
    if (properties.type === undefined) {
      properties = {
        type: properties
      }

      // Properties hash passed.
      // Copy properties hash before modifying.
      // Users can pass in their own custom types to the schema and we don't want to write to that object.
      // Especially since properties.name contains the index of our field and copying that will break functionality.
    } else {
      properties = clone(properties)
    }
  }

  // Type may be an object with properties.
  // If "type.type" exists, we'll assume it's meant to be properties.
  // This means that shorthand objects can't use the "type" index.
  // If "type" is necessary, they must be wrapped in a Model.
  if (_.isObject(properties.type) && properties.type.type !== undefined) {
    _.each(properties.type, (value, key) => {
      if (properties[key] === undefined) {
        properties[key] = value
      }
    })
    properties.type = properties.type.type
  }

  // Null or undefined should be flexible and allow any value.
  if (properties.type === null || properties.type === undefined) {
    properties.type = 'any'

    // Convert object representation of type to lowercase string.
    // String is converted to 'string', Number to 'number', etc.
    // Do not convert the initialized ModelInstance to a string!
    // Check for a shorthand declaration of schema by key length.
  } else if (_.isString(properties.type.name) && properties.type.name !== 'ModelInstance' && Object.keys(properties.type).length === 0) {
    properties.type = properties.type.name
  }
  if (_.isString(properties.type)) {
    properties.type = properties.type.toLowerCase()
  }

  // index: [Type] or index: [] is translated to index: {type: Array, arrayType: Type}
  if (_.isArray(properties.type)) {
    if (_.size(properties.type)) {
      // Properties will be normalized when array is initialized.
      properties.arrayType = properties.type[0]
    }
    properties.type = 'array'
  }

  // index: {} or index: Model is translated to index: {type: Object, objectType: Type}
  if (!_.isString(properties.type)) {
    if (_.isFunction(properties.type)) {
      properties.objectType = properties.type
      properties.type = 'object'

      // if it's a function we have a ctor. if we have model name defined than it's one of ours.
      // set it as ref so we can typecase appropriately
      if (properties.objectType.modelName) {
        properties.ref = true
      }
    } else if (_.isObject(properties.type)) {
      // When {} is passed, no schema is enforced.
      if (_.size(properties.type)) {
        // Options should be inherited by sub-models.
        properties.objectType = model.compile(properties.type, this.options || {}, undefined, this.lounge)
      }
      properties.type = 'object'
    }
  }

  // Set name if passed on properties.
  // It's used to show what field an error what generated on.
  if (name) {
    properties.name = name
  }

  return properties
}
