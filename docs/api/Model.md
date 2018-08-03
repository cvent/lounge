---
sidebarDepth: 0
---
<a name="Model"></a>

## Model ⇐ [<code>CouchbaseDocument</code>](#CouchbaseDocument)
Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code>

**Kind**: global class  
**Extends**: [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

* [Model](#Model) ⇐ [<code>CouchbaseDocument</code>](#CouchbaseDocument)
    * [new Model()](#new_Model_new)
    * [.cas](#CouchbaseDocument+cas) ⇒ <code>String</code>
    * [.db](#CouchbaseDocument+db) ⇒ <code>Driver</code> \| <code>null</code>
    * [.config](#CouchbaseDocument+config) ⇒ <code>Object</code>
    * [.modelName](#Document+modelName) : <code>String</code>
    * [._isNew](#Document+_isNew) : <code>Boolean</code>
    * [.getCAS(raw)](#CouchbaseDocument+getCAS) ⇒ <code>String</code> \| <code>Object</code>
    * [.save(options, replicate_to, fn)](#CouchbaseDocument+save)
    * [.index(options, fn)](#CouchbaseDocument+index)
    * [.remove(options, fn)](#CouchbaseDocument+remove)
    * [.removeIndexes(options, fn)](#CouchbaseDocument+removeIndexes)
    * [.populate(options, fn)](#CouchbaseDocument+populate)
    * [.getDocumentKeyValue(full)](#Document+getDocumentKeyValue) ⇒ <code>String</code>
    * [.getDocumentKeyKey()](#Document+getDocumentKeyKey) ⇒ <code>String</code>

<a name="new_Model_new"></a>

### new Model()
Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code>

<a name="CouchbaseDocument+cas"></a>

### model.cas ⇒ <code>String</code>
Returns the string representation of <code>CAS</code> value.

**Kind**: instance property of [<code>Model</code>](#Model)  
**Example**  
```js
console.log(doc.cas) // String: 00000000a71626e4
```
<a name="CouchbaseDocument+db"></a>

### model.db ⇒ <code>Driver</code> \| <code>null</code>
Gets the database driver of the model

**Kind**: instance property of [<code>Model</code>](#Model)  
<a name="CouchbaseDocument+config"></a>

### model.config ⇒ <code>Object</code>
Gets the config object

**Kind**: instance property of [<code>Model</code>](#Model)  
<a name="Document+modelName"></a>

### model.modelName : <code>String</code>
The name the name of the model. This is both a static and instance property.

**Kind**: instance property of [<code>Model</code>](#Model)  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(Cat.modelName) // 'Cat'
console.log(kitty.modelName) // 'Cat'
```
<a name="Document+_isNew"></a>

### model._isNew : <code>Boolean</code>
Has a key been generated for this document.

**Kind**: instance property of [<code>Model</code>](#Model)  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(kitty._isNew) // true
var kat = new Cat({ id: '123abc', name: 'Sabian' })
console.log(kat._isNew) // false
```
<a name="CouchbaseDocument+getCAS"></a>

### model.getCAS(raw) ⇒ <code>String</code> \| <code>Object</code>
Returns the document <code>CAS</code> value.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>String</code> \| <code>Object</code> - the CAS value  

| Param | Type | Description |
| --- | --- | --- |
| raw | <code>Boolean</code> | If <code>true</code> returns the raw CAS document. If <code>false</code> returns string                        representation of CAS. Defaults to <code>false</code>. |

**Example**  
```js
console.log(doc.getCAS()) // String: 00000000a71626e4
console.log(doc.getCAS(true)) // Object: CouchbaseCas<11338961768815788032>
```
<a name="CouchbaseDocument+save"></a>

### model.save(options, replicate_to, fn)
Save the current model instance. Calls db set function for the model id and saves the properties.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | The save options. All options not present here are first looked up from schema options, and then from config options. |
| options.storeFullReferenceId | <code>Boolean</code> | whether to save embedded document property values as full document keys or just the base value |
| options.storeFullKey | <code>Boolean</code> | whether to save the internal document key property as fully expanded value or as the simple value |
| options.refIndexKeyPrefix | <code>String</code> | lookup index document key prefix. |
| options.waitForIndex | <code>Boolean</code> | whether we want to wait for indexing to finish before returning. Default: <code>false</code>. |
| options.virtuals | <code>Boolean</code> | whether we want to save virtuals. Default: <code>false</code>. |
| options.minimize | <code>Boolean</code> | to "minimize" the document by removing any empty properties. Default: <code>true</code> |
| options.expiry | <code>Number</code> | couchbase upsert option |
| options.persist_to | <code>Number</code> | couchbase persist_to option |
| replicate_to | <code>Number</code> | couchbase option |
| fn | <code>function</code> | callback |

**Example**  
```js
var user = new User({ name: 'Bob Smith', email: 'bsmith@acme.com' })
user.save(function(err, savedDoc) {
  if(err) console.log(err)
})
```
<a name="CouchbaseDocument+index"></a>

### model.index(options, fn)
Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
and deletes the old ones not needed any more.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| options.atomicLock | <code>Boolean</code> | whether to use atomicLock |
| fn | <code>function</code> | callback |

<a name="CouchbaseDocument+remove"></a>

### model.remove(options, fn)
Removes the instance from the database.
Calls the bucket <code>remove()</code> function. Options can be passed to the driver.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options to be passed to the Couchbase `Bucket.remove()` function. |
| fn | <code>function</code> | callback |

**Example**  
```js
user.remove(function(err, doc) {
  if(err) console.log(err)
})
```
<a name="CouchbaseDocument+removeIndexes"></a>

### model.removeIndexes(options, fn)
Removes all lookup / index documents for this document.

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| fn | <code>function</code> | callback |

<a name="CouchbaseDocument+populate"></a>

### model.populate(options, fn)
Populates this instance given the options

**Kind**: instance method of [<code>Model</code>](#Model)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Boolean</code> \| <code>String</code> \| <code>Array</code> | populate options, can be a <code>Boolean</code>;                               <code>String</code> representing a path;                               <code>Object</code> with form <code>{ path: String, target: String}</code> where                               <code>path</code> is the path to be populated and <code>target</code> is the target                               field into which to populate. If this format is used, <code>target</code> should be                               part of schema;                               or an <code>Array</code> of                               <code>Strings</code> or <code>Object</code>. |
| fn | <code>function</code> | Callback |

**Example** *(Populate an instance)*  
```js
User.findBy(userId, (err, user) {
  console.log(user.company) // ID
  user.populate((err, populatedUser) => {
    console.log(user.company) // full populated sub documnet
  })
})
```
**Example** *(Populate a specific path within an instance)*  
```js
User.findBy(userId, (err, user) {
  console.log(user.company) // ID
  user.populate('company', (err, populatedUser) => {
    console.log(user.company) // full populated sub documnet
  })
})
```
<a name="Document+getDocumentKeyValue"></a>

### model.getDocumentKeyValue(full) ⇒ <code>String</code>
Helper function to get the document key.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>String</code> - document key  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| full | <code>Boolean</code> | If <code>true</code> the full expanded value of the key will be returned.                  If there were any suffix and / or prefix defined in schema they are applied. |

**Example**  
```js
var schema = lounge.schema({ email: String }, { keyPrefix: 'user::'})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyValue()) // 114477a8-1901-4146-8c90-0fc9eec57a58
console.log(user.getDocumentKeyValue(true)) // user::114477a8-1901-4146-8c90-0fc9eec57a58
```
<a name="Document+getDocumentKeyKey"></a>

### model.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyKey()) // email
```
