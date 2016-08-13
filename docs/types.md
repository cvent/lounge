## Types <a id="types"></a>

Supported types:
- String
- Number
- Boolean
- Date
- Array (including types within Array)
- Object (including typed Models for sub-schemas)
- 'any'

When a type is specified, it will be enforced. Typecasting is enforced on all types except 'any'. If a value cannot be typecasted to the correct type, the original value will remain untouched.

Types can be extended with a variety of attributes. Some attributes are type-specific and some apply to all types.

Custom types can be created by defining an object with type properties.

```js
var NotEmptyString = {type: String, minLength: 1};
country: {type: NotEmptyString, default: 'USA'}
```

#### General attributes

**transform**
Called immediately when value is set and before any typecast is done.

```js
name: {type: String, transform: function(value) {
  // Modify the value here...
  return value;
}}
```

**validate**
Called immediately when value is set and before any typecast is done. Can be used for validating input data.
If you return `false` the write operation will be cancelled.

```js
name: {type: String, validate: function(value) {
  // check
  return value;
}}
```

**default**
Provide default value. You may pass value directly or pass a function which will be executed when the object is initialized. The function is executed in the context of the object and can use "this" to access other properties (which .

```js
country: {type: String, default: 'USA'}
```

**get**
Provide function to transform value when retrieved. Executed in the context of the object and can use "this" to access properties.

```js
string: {type: String, getter: function(value) { return value.toUpperCase(); }}
```

**readOnly**
If `true`, the value can be read but cannot be written to. This can be useful for creating fields that reflect other values.

```js
fullName: {type: String, readOnly: true, default: function(value) {
  return (this.firstName + ' ' + this.lastName).trim();
}}
```

**invisible**
If `true`, the value can be written to but isn't outputted as an index when `toObject()` is called.
This can be useful for hiding internal variables.

**serializable**
By default all values defined in the schema except those that are set to invisible using the property above are written
to the database when the document is saved. If this property is set to `false`, the value can be written to and can be
read and will be visible using `toObject` and `toJSON` methods but is not written when model is saved to the database.
This can be useful when you need some "working" properties that you never want to serialized but otherwise passed around
and visible.

#### String

**stringTransform**
Called after value is typecast to string **if** value was successfully typecast but called before all validation.

```js
postalCode: {type: String, stringTransform: function(string) {
  // Type will ALWAYS be String, so using string prototype is OK.
  return string.toUpperCase();
}}
```

**regex**
Validates string against Regular Expression. If string doesn't match, it's rejected.

```js
memberCode: {type: String, regex: new RegExp('^([0-9A-Z]{4})$')}
```

**enum**
Validates string against array of strings. If not present, it's rejected.

```js
gender: {type: String, enum: ['m', 'f']}
```

**minLength**
Enforces minimum string length.

```js
notEmpty: {type: String, minLength: 1}
```

**maxLength**
Enforces maximum string length.

```js
stateAbbrev: {type: String, maxLength: 2}
```

**clip**
If `true`, clips string to maximum string length instead of rejecting string.

```js
bio: {type: String, maxLength: 255, clip: true}
```

#### Number

**min**
Number must be > min attribute or it's rejected.

```js
positive: {type: Number, min: 0}
```

**max**
Number must be < max attribute or it's rejected.

```js
negative: {type: Number, max: 0}
```

#### Array

**unique**
Ensures duplicate-free array, using === to test object equality.

```js
emails: {type: Array, unique: true, arrayType: String}
```

**arrayType**
Elements within the array will be typed to the attributes defined.

```js
aliases: {type: Array, arrayType: {type: String, minLength: 1}}
```

An alternative shorthand version is also available -- wrap the properties within array brackets.

```js
aliases: [{type: String, minLength: 1}]
```

#### Object

**objectType**
Allows you to define a typed object.

```js
company: {type: Object, objectType: {
  name: String
}}
```

An alternative shorthand version is also available -- simply pass a descriptor.

```js
company: {
  name: String
}
```

#### Alias

**index (required)**

The index key of the property being aliased.

```js
zip: String,
postalCode: {type: 'alias', target: 'zip'}
// this.postalCode = 12345 -> this.toObject() -> {zip: '12345'}
```
