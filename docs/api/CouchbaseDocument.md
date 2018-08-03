---
sidebarDepth: 0
---
<a name="CouchbaseDocument"></a>

## CouchbaseDocument ⇐ [<code>Document</code>](#Document)
CouchbaseDocument inherits Document and handles all the database related actions.
Clients should never have to call this directly.

**Kind**: global class  
**Extends**: [<code>Document</code>](#Document)  

* [CouchbaseDocument](#CouchbaseDocument) ⇐ [<code>Document</code>](#Document)
    * [new CouchbaseDocument(values, cas, options, schema, name)](#new_CouchbaseDocument_new)
    * _instance_
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
    * _static_
        * [.findById(id, options, fn)](#CouchbaseDocument.findById)
        * [.remove(id, options, fn)](#CouchbaseDocument.remove)

<a name="new_CouchbaseDocument_new"></a>

### new CouchbaseDocument(values, cas, options, schema, name)
Clients do not need to create Document manually.


| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object</code> | the object data |
| cas | <code>Object</code> | the Couchbase <code>CAS</code> value for the document |
| options | <code>Object</code> | creation options |
| options.clone | <code>Boolean</code> | Whether to deep clone the incoming data. Default: <code>false</code>.                                  Make sure you wish to do this as it has performance implications. This is                                  useful if you are creating multiple instances from same base data and then                                  wish to modify each instance. |
| schema | [<code>Schema</code>](#Schema) | schema instance |
| name | <code>String</code> | the model name |

<a name="CouchbaseDocument+cas"></a>

### couchbaseDocument.cas ⇒ <code>String</code>
Returns the string representation of <code>CAS</code> value.

**Kind**: instance property of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
**Example**  
```js
console.log(doc.cas) // String: 00000000a71626e4
```
<a name="CouchbaseDocument+db"></a>

### couchbaseDocument.db ⇒ <code>Driver</code> \| <code>null</code>
Gets the database driver of the model

**Kind**: instance property of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
<a name="CouchbaseDocument+config"></a>

### couchbaseDocument.config ⇒ <code>Object</code>
Gets the config object

**Kind**: instance property of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
<a name="Document+modelName"></a>

### couchbaseDocument.modelName : <code>String</code>
The name the name of the model. This is both a static and instance property.

**Kind**: instance property of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(Cat.modelName) // 'Cat'
console.log(kitty.modelName) // 'Cat'
```
<a name="Document+_isNew"></a>

### couchbaseDocument._isNew : <code>Boolean</code>
Has a key been generated for this document.

**Kind**: instance property of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
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

### couchbaseDocument.getCAS(raw) ⇒ <code>String</code> \| <code>Object</code>
Returns the document <code>CAS</code> value.

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
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

### couchbaseDocument.save(options, replicate_to, fn)
Save the current model instance. Calls db set function for the model id and saves the properties.

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

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

### couchbaseDocument.index(options, fn)
Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
and deletes the old ones not needed any more.

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| options.atomicLock | <code>Boolean</code> | whether to use atomicLock |
| fn | <code>function</code> | callback |

<a name="CouchbaseDocument+remove"></a>

### couchbaseDocument.remove(options, fn)
Removes the instance from the database.
Calls the bucket <code>remove()</code> function. Options can be passed to the driver.

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

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

### couchbaseDocument.removeIndexes(options, fn)
Removes all lookup / index documents for this document.

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| fn | <code>function</code> | callback |

<a name="CouchbaseDocument+populate"></a>

### couchbaseDocument.populate(options, fn)
Populates this instance given the options

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

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

### couchbaseDocument.getDocumentKeyValue(full) ⇒ <code>String</code>
Helper function to get the document key.

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
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

### couchbaseDocument.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: instance method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyKey()) // email
```
<a name="CouchbaseDocument.findById"></a>

### CouchbaseDocument.findById(id, options, fn)
All models created come with a static function <code>findById</code> that can be used to look up a single
or multiple keys and retrieve documents from the database. If key does not exist and document is not found we
**do not** return an error but also no model is generated. This is different than present couchbase module behaviour.

**Kind**: static method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> \| <code>Array</code> | the document id / key or an array of keys |
| options | <code>Object</code> |  |
| options.populate | <code>Boolean</code> \| <code>String</code> \| <code>Array</code> | populate options, can be a <code>Boolean</code>;                               <code>String</code> representing a path;                               <code>Object</code> with form <code>{ path: String, target: String }</code> where                               <code>path</code> is the path to be populated and <code>target</code> is the target                               field into which to populate. If this format is used, <code>target</code> should be                               part of schema;                               or an <code>Array</code> of                               <code>Strings</code> or <code>Object</code>. |
| options.keepSortOrder | <code>Boolean</code> | If getting an array of objects, whether we should keep same sort order of                                        returned objects as the <code>id</code>'s passed in.                                        Default: <code>false</code> |
| options.missing | <code>Boolean</code> | If set to <code>false</code> we won't return missing keys as the final param in                                  the callback. This option overwrites the Lounge config <code>missing</code> option.                                  Default: <code>true</code>. |
| fn | <code>function</code> | callback |

**Example**  
```js
User.findById('user123', function(err, doc, missing) {
  if(err) console.log(err) // there was an error looking up the key
  else if(!doc) console.log('no document found')
  else console.log(doc) // doc is instance of User and will print it out
})
```
<a name="CouchbaseDocument.remove"></a>

### CouchbaseDocument.remove(id, options, fn)
Removes specified document(s).

**Kind**: static method of [<code>CouchbaseDocument</code>](#CouchbaseDocument)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> \| <code>Array</code> | id(s) to remove |
| options | <code>Object</code> | options |
| options.lean | <code>Boolean</code> | if <code>true</code> we will directly do document removal. We do not create an instance of model.                                 No middleware is invoked. No indexes updated. Embedded documents are not deleted. Default: <code>false</code>. |
| options.removeRefs | <code>Boolean</code> | If set to <code>true</code> will remove embedded reference documents. Default: <code>false</code>. |
| fn | <code>function</code> | callback |

**Example**  
```js
User.remove('user123', function(err, doc) {
  if(err) console.log(err)
})
```
