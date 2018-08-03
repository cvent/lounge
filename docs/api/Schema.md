---
sidebarDepth: 0
---
<a name="Schema"></a>

## Schema
Schema class represents the schema definition. It includes properties, methods, static methods, and any
middleware we want to define.

**Kind**: global class  
**Access**: public  

* [Schema](#Schema)
    * [new Schema(descriptor, options)](#new_Schema_new)
    * [.index(prop, options)](#Schema+index)
    * [.method(name, func)](#Schema+method)
    * [.static(name, val)](#Schema+static)
    * [.virtual(name, type, options)](#Schema+virtual)
    * [.set(key, [value])](#Schema+set)
    * [.get(key)](#Schema+get) ⇒ <code>\*</code>
    * [.pre()](#Schema+pre)
    * [.post()](#Schema+post)
    * [.add(key, descriptor)](#Schema+add)
    * [.extend(other)](#Schema+extend)
    * [.getDocumentKeyValue(id, full)](#Schema+getDocumentKeyValue) ⇒ <code>String</code>
    * [.getRefKey(name, v)](#Schema+getRefKey) ⇒ <code>string</code>
    * [.hasRefPath(path)](#Schema+hasRefPath) ⇒ <code>boolean</code>

<a name="new_Schema_new"></a>

### new Schema(descriptor, options)
Creates an object schema


| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>Object</code> | the schema definition |
| options | <code>Object</code> |  |
| options.strict | <code>Boolean</code> | By default (<code>true</code>), allow only values in the schema to be set.                                   When this is <code>false</code>, setting new fields will dynamically add the field                                   to the schema as type "any". |
| options.dotNotation | <code>Boolean</code> | Allow fields to be set via dot notation. Default: <code>true</code>.                                      <code>obj['user.name'] = 'Joe'; -> obj: { user: 'Joe' }</code> |
| options.minimize | <code>Boolean</code> | "minimize" schemas by removing empty objects. Default: <code>true</code> |
| options.toObject | <code>Object</code> | <code>toObject</code> method. |
| options.toObject.minimize | <code>Boolean</code> | "minimize" schemas by removing empty objects. Default: <code>true</code> |
| options.toObject.transform | <code>function</code> | transform function |
| options.toObject.virtuals | <code>Boolean</code> | whether to include virtual properties. Default: <code>false</code> |
| options.toObject.dateToISO | <code>Boolean</code> | convert dates to string in ISO format using <code>Date.toISOString()</code>. Default:  <code>false</code> |
| options.toJSON | <code>Object</code> | options for <code>toJSON</code> method options, similar to above |
| options.strict | <code>Boolean</code> | ensures that value passed in to assigned that were not specified in our                                   schema do not get saved |
| options.onBeforeValueSet | <code>function</code> | function called when write operations on an object takes place. Currently, it will only notify of write operations on the object itself and will not notify you when child objects are written to. If you return false or throw an error within the onBeforeValueSet handler, the write operation will be cancelled. Throwing an error will add the error to the error stack. |
| options.onValueSet | <code>function</code> | Similar to <code>onBeforeValueSet</code>, but called after we've set a value on the key, |
| options.saveOptions | <code>Object</code> | options for couchbase <code>save</code> method, such as <code>expiry</code>, <code>replicate_to</code>, and <code>persist_to</code>.                                       These options will propagate to all <code>save()</code> calls automatically and all index reference documents.                                       If a <code>save()</code> call has those options they are used over ones defined in the schema options. |

**Example**  
```js
var schema = new lounge.Schema({ name: String })
```
**Example** *(with &lt;code&gt;onBeforeValueSet&lt;/code&gt;)*  
```js
var User = lounge.schema({ name: String }, {
  onBeforeValueSet: function(key, value) {
    if(key === 'name' && value.indexOf('Joe') >= 0) {
      return false
    })
  }
})

var User = lounge.model('User', schema)
var user = new User()
user.name = 'Bill' // name not set
user.name = 'Joe Smith' //  { name: 'Joe Smith' }
```
<a name="Schema+index"></a>

### schema.index(prop, options)
Creates an index on the specified property.

**Kind**: instance method of [<code>Schema</code>](#Schema)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| prop | <code>String</code> | property to create the index on. If an array or property keys, generates compound key based                        on the property values, order matters. |
| options | <code>Object</code> | index options |
| options.indexName | <code>String</code> | the index name to be used for lookup function name generation.                                   - by default generated = require(property name. |
| options.indexType | <code>String</code> | the index type. <code>'singe'</code> or <code>'array'</code>.                                   - default: <code>'single'</code> |
| options.refKeyCase | <code>String</code> | the casing for the reference document key. The default is to take                                      value of the property as is, unmodified, to generate the reference document                                      key. Use this to force reference document key casing. This will also allow                                      you to to query via index function in case insensitive way.                                      options: <code>'upper'</code> or <code>'lower'</code> |

**Example** *(Simple reference document)*  
```js
var userSchema = lounge.schema({
  firstName: String,
  lastName: String,
  username: String
})

userSchema.index('username', { indexName: 'UserName' })
var User = lounge.model('User', userSchema)
// use User.findByUserName(username) to query
```
**Example** *(Simple coumpund document)*  
```js
var userSchema = lounge.schema({
  email: String,
  username: String
})

userSchema.index(['email', 'username'], { indexName: 'EmailAndUserName' })
var User = lounge.model('User', userSchema)
// use User.findByEmailAndUserName(email, username) to query
```
<a name="Schema+method"></a>

### schema.method(name, func)
Creates a instance method for the created model.
An object of function names and functions can also be passed in.

**Kind**: instance method of [<code>Schema</code>](#Schema)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | the name of the method |
| func | <code>function</code> | the actual function implementation |

**Example**  
```js
var userSchema = lounge.schema({
  firstName: String,
  lastName: String
})

userSchema.method('getFullName', function () {
  return this.firstName + ' ' + this.lastName
})

var User = lounge.model('User', userSchema)
var user = new User({
  firstName: 'Joe',
  lastName: 'Smith'
})

console.log(user.getFullName()) // Joe Smith
```
<a name="Schema+static"></a>

### schema.static(name, val)
Creates a static function or property for the created model.
An object of function or property names and functions or values can also be passed in.

**Kind**: instance method of [<code>Schema</code>](#Schema)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name of the static property |
| val | <code>\*</code> | the actual value or static function |

**Example** *(Create a static function)*  
```js
var userSchema = lounge.schema({ name: String })
userSchema.static('foo', function () {
  return 'bar'
})

var User = lounge.model('User', userSchema)
console.log(User.foo()) // 'bar'
```
**Example** *(Create a static property)*  
```js
var userSchema = lounge.schema({ name: String })
userSchema.static('FOO', 'bar')
var User = lounge.model('User', userSchema)
console.log(User.FOO) // 'bar'
```
<a name="Schema+virtual"></a>

### schema.virtual(name, type, options)
Creates a virtual property for the created model with the given object
specifying the get and optionally set function

**Kind**: instance method of [<code>Schema</code>](#Schema)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name of the virtual property |
| type | <code>String</code> \| <code>function</code> \| <code>Object</code> | optional type to be used for the virtual property. If not provided default is                                      <code>'any'</code> type. |
| options | <code>Object</code> | virtual options |
| options.get | <code>function</code> | the virtual getter function |
| options.set | <code>function</code> | the virtual setter function. If not provided the virtual becomes read-only. |

**Example**  
```js
var userSchema = lounge.schema({firstName: String, lastName: String})

userSchema.virtual('fullName', String, {
  get: function () {
    return this.firstName + ' ' + this.lastName
  },
  set: function (v) {
    if (v !== undefined) {
      var parts = v.split(' ')
      this.firstName = parts[0]
      this.lastName = parts[1]
    }
  }
})

var User = lounge.model('User', userSchema)

var user = new User({firstName: 'Joe', lastName: 'Smith'})
console.log(user.fullName) // Joe Smith
user.fullName = 'Bill Jones'
console.log(user.firstName) // Bill
console.log(user.lastName) // Jones
console.log(user.fullName) // Bill Jones
```
<a name="Schema+set"></a>

### schema.set(key, [value])
Sets/gets a schema option.

**Kind**: instance method of [<code>Schema</code>](#Schema)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | option name |
| [value] | <code>Object</code> | if not passed, the current option value is returned |

<a name="Schema+get"></a>

### schema.get(key) ⇒ <code>\*</code>
Gets a schema option.

**Kind**: instance method of [<code>Schema</code>](#Schema)  
**Returns**: <code>\*</code> - the option value  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | option name |

<a name="Schema+pre"></a>

### schema.pre()
Defines a pre hook for the schema.
See [grappling-hook](https://www.github.com/bojand/grappling-hook).

**Kind**: instance method of [<code>Schema</code>](#Schema)  
<a name="Schema+post"></a>

### schema.post()
Defines a post hook for the schema.
See [grappling-hook](https://www.github.com/bojand/grappling-hook).

**Kind**: instance method of [<code>Schema</code>](#Schema)  
<a name="Schema+add"></a>

### schema.add(key, descriptor)
Adds the descriptor to the schema at the given key. Or add an <code>object</code> as a descriptor.

**Kind**: instance method of [<code>Schema</code>](#Schema)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> \| <code>Object</code> | the property key |
| descriptor | <code>Object</code> | the property descriptor |

**Example**  
```js
var userSchema = lounge.schema({firstName: String })
userSchema.add('lastName', String)
userSchema.add({ email: String })
```
<a name="Schema+extend"></a>

### schema.extend(other)
Extends other schema. Copies descriptor properties, methods, statics, virtuals and middleware.
If this schema has a named property already, the property is not copied.

**Kind**: instance method of [<code>Schema</code>](#Schema)  

| Param | Type | Description |
| --- | --- | --- |
| other | [<code>Schema</code>](#Schema) | the schema to extend. |

<a name="Schema+getDocumentKeyValue"></a>

### schema.getDocumentKeyValue(id, full) ⇒ <code>String</code>
Helper function to get the document key

**Kind**: instance method of [<code>Schema</code>](#Schema)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | the id |
| full | <code>Boolean</code> | If <code>true</code> the full expanded value of the key will be returned if there were any suffix and / or prefix defined in schema they are also applied. We test if the passed in id already satisfies expansion. |

**Example**  
```js
var schema = lounge.schema({ email: String }, {keyPrefix: 'user::' })
console.log(schema.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', true)) // user::114477a8-1901-4146-8c90-0fc9eec57a58
console.log(schema.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', true)) // user::114477a8-1901-4146-8c90-0fc9eec57a58
console.log(schema.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', false)) // 114477a8-1901-4146-8c90-0fc9eec57a58
console.log(schema.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', false)) // 114477a8-1901-4146-8c90-0fc9eec57a58
```
<a name="Schema+getRefKey"></a>

### schema.getRefKey(name, v) ⇒ <code>string</code>
Gets the reference document key value

**Kind**: instance method of [<code>Schema</code>](#Schema)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | index name |
| v | <code>String</code> | index value |

<a name="Schema+hasRefPath"></a>

### schema.hasRefPath(path) ⇒ <code>boolean</code>
Returns whether this schema has the specified reference path

**Kind**: instance method of [<code>Schema</code>](#Schema)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | path to check |

