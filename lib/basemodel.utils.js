import _ from 'lodash';

import ObjectArray from './objectarray';
import { typecast } from './utils';
import _privateKey from './privatekey';

export function defineProperty(index, properties) {
  const indexOrAliasIndex = properties.type === 'alias' ? properties.target : index;

  Object.defineProperty(this, index, {
    configurable: true,
    get: () => {
      try {
        return getter.call(this, this[_privateKey]._obj[indexOrAliasIndex], properties);
      }
      catch (err) {
        // This typically happens when the default value isn't valid -- log error.
        this[_privateKey]._errors.push(err);
      }
    },
    set: value => {
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
      }
      catch (err) {
        // Setter failed to validate value -- log error.
        this[_privateKey]._errors.push(err);
      }
    }
  });

  // Aliased fields reflect values on other fields and do not need to be initialized.
  if (properties.isAlias === true) {
    return;
  }

  if (properties.virtual === true) {
    return;
  }

  if (properties.type === 'object' && properties.default !== undefined) {
    writeValue.call(this[_privateKey]._this, _.isFunction(properties.default) ? properties.default.call(this) : properties.default, properties);
  }
  else if (properties.type === 'array') {
    // Native arrays are never used so that toArray can be globally supported.
    // Additionally, other properties such as unique rely on passing through us.
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
export function clearField(index, properties) {
  // Aliased fields reflect values on other fields and do not need to be cleared.
  if (properties.isAlias === true) {
    return;
  }

  // Do not try to clear a field if it is not set,
  // i.e. when schema has {serializable: false}
  if (!this[properties.name]) {
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
  }
  else if (properties.type === 'array') {
    this[properties.name].length = 0;

    // Other field types can simply have their value set to undefined.
  }
  else {
    writeValue.call(this[_privateKey]._this, undefined, properties);
  }
}
