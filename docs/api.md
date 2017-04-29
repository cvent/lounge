## Classes

<dl>
<dt>[AbstractBaseModel](#AbstractBaseModel)</dt>
<dd><p>Abstract Base Model representation for all created Document instances.
Represents just the document data and generic properties and functions.
Also used for &quot;object&quot; abstraction / representation of sub documents that are not actual Models / Documents.
Clients should never have to call this directly.</p>
</dd>
<dt>[BaseModel](#BaseModel) ⇐ <code>EventEmitter</code></dt>
<dd><p>BaseModel implements <code>AbstractBaseModel</code> and is a representation for all created Document
instances that have a user defined schema. Represents just the document data and generic properties and functions.
Clients should never have to call this directly. Inherits <code>EventEmitter</code></p>
</dd>
<dt>[CouchbaseDocument](#CouchbaseDocument) ⇐ <code>[Document](#Document)</code></dt>
<dd><p>CouchbaseDocument inherits Document and handles all the database related actions.
Clients should never have to call this directly.</p>
</dd>
<dt>[Document](#Document) ⇐ <code>[BaseModel](#BaseModel)</code></dt>
<dd><p>Base constructor for all created Document instances.
Represents just the document data and generic properties and functions.
Clients should never have to call this directly.</p>
</dd>
<dt>[Lounge](#Lounge) ⇐ <code>Bucket</code></dt>
<dd><p>The Lounge module
The exports object of the <code>lounge</code> module is an instance of this class.
Most apps will only use this one instance. We copy all Couchbase <code>Bucket</code> methods and properties
so you can call them generically = require(this instance as well.</p>
</dd>
<dt>[Model](#Model) ⇐ <code>[CouchbaseDocument](#CouchbaseDocument)</code></dt>
<dd><p>Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code></p>
</dd>
<dt>[ModelInstance](#ModelInstance) ⇐ <code>[Model](#Model)</code></dt>
<dd><p>ModelInstance class is the compiled class from a schema definition. It extends <code>Model</code>.
All models generated are an instance of <code>ModelInstance</code>. It also inherits <code>grappling-hook</code>
See <a href="https://www.github.com/bojand/grappling-hook">grappling-hook</a> for pre and post hooks.</p>
</dd>
<dt>[Schema](#Schema)</dt>
<dd><p>Schema class represents the schema definition. It includes properties, methods, static methods, and any
middleware we want to define.</p>
</dd>
</dl>

<a name="abstractbasemodel" id="abstractbasemodel" data-id="abstractbasemodel"></a>

## AbstractBaseModel
Abstract Base Model representation for all created Document instances.
Represents just the document data and generic properties and functions.
Also used for "object" abstraction / representation of sub documents that are not actual Models / Documents.
Clients should never have to call this directly.

**Kind**: global class  

* [AbstractBaseModel](#AbstractBaseModel)
    * [new AbstractBaseModel(values, options, schema)](#new_AbstractBaseModel_new)
    * [.schema](#AbstractBaseModelschema) ⇒ <code>[Schema](#Schema)</code>
    * [.set()](#AbstractBaseModelset)
    * [.get(path)](#AbstractBaseModelget) ⇒ <code>\*</code>
    * [.toObject(options)](#AbstractBaseModeltoObject) ⇒ <code>Object</code>
    * [.toJSON(options)](#AbstractBaseModeltoJSON) ⇒ <code>Object</code>
    * [.inspect()](#AbstractBaseModelinspect)
    * [.toString()](#AbstractBaseModeltoString)
    * [.clear()](#AbstractBaseModelclear)
    * [.getErrors()](#AbstractBaseModelgetErrors)
    * [.clearErrors()](#AbstractBaseModelclearErrors)
    * [.hasErrors()](#AbstractBaseModelhasErrors) ⇒ <code>Boolean</code>

<a name="new_abstractbasemodel_new" id="new_abstractbasemodel_new" data-id="new_abstractbasemodel_new"></a>

### new AbstractBaseModel(values, options, schema)
Clients do not need to create <code>AbstractBaseModel</code> instances manually.


| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object</code> | the object data |
| options | <code>Object</code> | creation options |
| options.clone | <code>Boolean</code> | Whether to deep clone the incoming data. Default: <code>false</code>.                                  Make sure you wish to do this as it has performance implications. This is                                  useful if you are creating multiple instances from same base data and then                                  wish to modify each instance. |
| schema | <code>[Schema](#Schema)</code> | schema instance |

<a name="abstractbasemodelschema" id="abstractbasemodelschema" data-id="abstractbasemodelschema"></a>

### abstractBaseModel.schema ⇒ <code>[Schema](#Schema)</code>
Get the model schema instance

**Kind**: instance property of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Access**: public  
<a name="abstractbasemodelset" id="abstractbasemodelset" data-id="abstractbasemodelset"></a>

### abstractBaseModel.set()
Sets data on the document based on the schema.
Accepts a key of property and value for the property, or object representing the data for document.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Access**: public  
**Example**  
```js
user.set('fistName', 'Joe')
user.set({ lastName: 'Smith' })
```
<a name="abstractbasemodelget" id="abstractbasemodelget" data-id="abstractbasemodelget"></a>

### abstractBaseModel.get(path) ⇒ <code>\*</code>
Gets value at a specified path.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Returns**: <code>\*</code> - The value at the path.  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | The path / property to retrieve. |

<a name="abstractbasemodeltoobject" id="abstractbasemodeltoobject" data-id="abstractbasemodeltoobject"></a>

### abstractBaseModel.toObject(options) ⇒ <code>Object</code>
Converts this document into a plain javascript object.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Returns**: <code>Object</code> - Plain javascript object representation of document.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.transform | <code>function</code> | a transform function to apply to the resulting document before returning. |
| options.virtuals | <code>Boolean</code> | apply virtual getters. Default: <code>false</code> |
| options.minimize | <code>Boolean</code> | remove empty objects. Default: <code>true</code> |
| options.serializable | <code>Boolean</code> | whether to include <code>serializable</code> properties. Default: <code>true</code> |
| options.dateToISO | <code>Boolean</code> | convert dates to string in ISO format using <code>Date.toISOString()</code>. Default: <code>true</code> |

**Example**  
```js
var userSchema = lounge.schema({ name: String })
var User = lounge.model('User', userSchema)
var user = new User({name: 'Joe Smith'})
console.log(user) // automatically invokes toObject()
```
**Example** *(Example with transform option.)*  
```js
var xform = function (doc, ret, options) {
  ret.name = ret.name.toUpperCase()
  return ret
}
console.dir(user.toObject({transform: xform}) // { name: 'JOE SMITH' }
```
<a name="abstractbasemodeltojson" id="abstractbasemodeltojson" data-id="abstractbasemodeltojson"></a>

### abstractBaseModel.toJSON(options) ⇒ <code>Object</code>
Similar as <code>toObject</code> but applied when <code>JSON.stringify</code> is called

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Returns**: <code>Object</code> - Plain javascript object representation of document.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Same options as <code>toObject</code>. |

<a name="abstractbasemodelinspect" id="abstractbasemodelinspect" data-id="abstractbasemodelinspect"></a>

### abstractBaseModel.inspect()
Helper for <code>console.log</code>. Just invokes default <code>toObject</code>.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Access**: public  
<a name="abstractbasemodeltostring" id="abstractbasemodeltostring" data-id="abstractbasemodeltostring"></a>

### abstractBaseModel.toString()
Helper for <code>console.log</code>. Alias for <code>inspect</code>.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Access**: public  
<a name="abstractbasemodelclear" id="abstractbasemodelclear" data-id="abstractbasemodelclear"></a>

### abstractBaseModel.clear()
Clear the document data. This can be overridden at schema level using <code>Schema.set()</code>.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
<a name="abstractbasemodelgeterrors" id="abstractbasemodelgeterrors" data-id="abstractbasemodelgeterrors"></a>

### abstractBaseModel.getErrors()
Gets the errors object.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
<a name="abstractbasemodelclearerrors" id="abstractbasemodelclearerrors" data-id="abstractbasemodelclearerrors"></a>

### abstractBaseModel.clearErrors()
Clears all the errors.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
<a name="abstractbasemodelhaserrors" id="abstractbasemodelhaserrors" data-id="abstractbasemodelhaserrors"></a>

### abstractBaseModel.hasErrors() ⇒ <code>Boolean</code>
Checks whether we have any errors.

**Kind**: instance method of <code>[AbstractBaseModel](#AbstractBaseModel)</code>  
**Returns**: <code>Boolean</code> - <code>true</code> if we have errors, <code>false</code> otherwise.  
<a name="basemodel" id="basemodel" data-id="basemodel"></a>

## BaseModel ⇐ <code>EventEmitter</code>
BaseModel implements <code>AbstractBaseModel</code> and is a representation for all created Document
instances that have a user defined schema. Represents just the document data and generic properties and functions.
Clients should never have to call this directly. Inherits <code>EventEmitter</code>

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  
<a name="new_basemodel_new" id="new_basemodel_new" data-id="new_basemodel_new"></a>

### new BaseModel()
Clients do not need to create <code>BaseModel</code> instances manually.

<a name="couchbasedocument" id="couchbasedocument" data-id="couchbasedocument"></a>

## CouchbaseDocument ⇐ <code>[Document](#Document)</code>
CouchbaseDocument inherits Document and handles all the database related actions.
Clients should never have to call this directly.

**Kind**: global class  
**Extends**: <code>[Document](#Document)</code>  

* [CouchbaseDocument](#CouchbaseDocument) ⇐ <code>[Document](#Document)</code>
    * [new CouchbaseDocument(values, cas, options, schema, name)](#new_CouchbaseDocument_new)
    * _instance_
        * [.cas](#CouchbaseDocumentcas) ⇒ <code>String</code>
        * [.db](#CouchbaseDocumentdb) ⇒ <code>Driver</code> \| <code>null</code>
        * [.config](#CouchbaseDocumentconfig) ⇒ <code>Object</code>
        * [.modelName](#DocumentmodelName) : <code>String</code>
        * [._isNew](#Document_isNew) : <code>Boolean</code>
        * [.getCAS(raw)](#CouchbaseDocumentgetCAS) ⇒ <code>String</code> \| <code>Object</code>
        * [.save(options, replicate_to, fn)](#CouchbaseDocumentsave)
        * [.index(options, fn)](#CouchbaseDocumentindex)
        * [.remove(options, fn)](#CouchbaseDocumentremove)
        * [.removeIndexes(options, fn)](#CouchbaseDocumentremoveIndexes)
        * [.populate(options, fn)](#CouchbaseDocumentpopulate)
        * [.getDocumentKeyValue(full)](#DocumentgetDocumentKeyValue) ⇒ <code>String</code>
        * [.getDocumentKeyKey()](#DocumentgetDocumentKeyKey) ⇒ <code>String</code>
    * _static_
        * [.findById(id, options, fn)](#CouchbaseDocument.findById)
        * [.remove(id, options, fn)](#CouchbaseDocument.remove)

<a name="new_couchbasedocument_new" id="new_couchbasedocument_new" data-id="new_couchbasedocument_new"></a>

### new CouchbaseDocument(values, cas, options, schema, name)
Clients do not need to create Document manually.


| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object</code> | the object data |
| cas | <code>Object</code> | the Couchbase <code>CAS</code> value for the document |
| options | <code>Object</code> | creation options |
| options.clone | <code>Boolean</code> | Whether to deep clone the incoming data. Default: <code>false</code>.                                  Make sure you wish to do this as it has performance implications. This is                                  useful if you are creating multiple instances from same base data and then                                  wish to modify each instance. |
| schema | <code>[Schema](#Schema)</code> | schema instance |
| name | <code>String</code> | the model name |

<a name="couchbasedocumentcas" id="couchbasedocumentcas" data-id="couchbasedocumentcas"></a>

### couchbaseDocument.cas ⇒ <code>String</code>
Returns the string representation of <code>CAS</code> value.

**Kind**: instance property of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
**Example**  
```js
console.log(doc.cas) // String: 00000000a71626e4
```
<a name="couchbasedocumentdb" id="couchbasedocumentdb" data-id="couchbasedocumentdb"></a>

### couchbaseDocument.db ⇒ <code>Driver</code> \| <code>null</code>
Gets the database driver of the model

**Kind**: instance property of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
<a name="couchbasedocumentconfig" id="couchbasedocumentconfig" data-id="couchbasedocumentconfig"></a>

### couchbaseDocument.config ⇒ <code>Object</code>
Gets the config object

**Kind**: instance property of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
<a name="documentmodelname" id="documentmodelname" data-id="documentmodelname"></a>

### couchbaseDocument.modelName : <code>String</code>
The name the name of the model. This is both a static and instance property.

**Kind**: instance property of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(Cat.modelName) // 'Cat'
console.log(kitty.modelName) // 'Cat'
```
<a name="document_isnew" id="document_isnew" data-id="document_isnew"></a>

### couchbaseDocument._isNew : <code>Boolean</code>
Has a key been generated for this document.

**Kind**: instance property of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(kitty._isNew) // true
var kat = new Cat({ id: '123abc', name: 'Sabian' })
console.log(kat._isNew) // false
```
<a name="couchbasedocumentgetcas" id="couchbasedocumentgetcas" data-id="couchbasedocumentgetcas"></a>

### couchbaseDocument.getCAS(raw) ⇒ <code>String</code> \| <code>Object</code>
Returns the document <code>CAS</code> value.

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
**Returns**: <code>String</code> \| <code>Object</code> - the CAS value  

| Param | Type | Description |
| --- | --- | --- |
| raw | <code>Boolean</code> | If <code>true</code> returns the raw CAS document. If <code>false</code> returns string                        representation of CAS. Defaults to <code>false</code>. |

**Example**  
```js
console.log(doc.getCAS()) // String: 00000000a71626e4
console.log(doc.getCAS(true)) // Object: CouchbaseCas<11338961768815788032>
```
<a name="couchbasedocumentsave" id="couchbasedocumentsave" data-id="couchbasedocumentsave"></a>

### couchbaseDocument.save(options, replicate_to, fn)
Save the current model instance. Calls db set function for the model id and saves the properties.

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

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
<a name="couchbasedocumentindex" id="couchbasedocumentindex" data-id="couchbasedocumentindex"></a>

### couchbaseDocument.index(options, fn)
Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
and deletes the old ones not needed any more.

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| options.atomicLock | <code>Boolean</code> | whether to use atomicLock |
| fn | <code>function</code> | callback |

<a name="couchbasedocumentremove" id="couchbasedocumentremove" data-id="couchbasedocumentremove"></a>

### couchbaseDocument.remove(options, fn)
Removes the instance from the database.
Calls the bucket <code>remove()</code> function. Options can be passed to the driver.

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

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
<a name="couchbasedocumentremoveindexes" id="couchbasedocumentremoveindexes" data-id="couchbasedocumentremoveindexes"></a>

### couchbaseDocument.removeIndexes(options, fn)
Removes all lookup / index documents for this document.

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| fn | <code>function</code> | callback |

<a name="couchbasedocumentpopulate" id="couchbasedocumentpopulate" data-id="couchbasedocumentpopulate"></a>

### couchbaseDocument.populate(options, fn)
Populates this instance given the options

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Boolean</code> \| <code>String</code> \| <code>Array</code> | populate options, can be a <code>Boolean</code>;                               <code>String</code> representing a path;                               <code>Object</code> with form <code>{ path: String, target: String }</code> where                               <code>path</code> is the path to be populated and <code>target</code> is the target                               field into which to populate. If this format is used, <code>target</code> should be                               part of schema;                               or an <code>Array</code> of                               <code>Strings</code> or <code>Object</code>. |
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
<a name="documentgetdocumentkeyvalue" id="documentgetdocumentkeyvalue" data-id="documentgetdocumentkeyvalue"></a>

### couchbaseDocument.getDocumentKeyValue(full) ⇒ <code>String</code>
Helper function to get the document key.

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
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
<a name="documentgetdocumentkeykey" id="documentgetdocumentkeykey" data-id="documentgetdocumentkeykey"></a>

### couchbaseDocument.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: instance method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyKey()) // email
```
<a name="couchbasedocument.findbyid" id="couchbasedocument.findbyid" data-id="couchbasedocument.findbyid"></a>

### CouchbaseDocument.findById(id, options, fn)
All models created come with a static function <code>findById</code> that can be used to look up a single
or multiple keys and retrieve documents from the database. If key does not exist and document is not found we
**do not** return an error but also no model is generated. This is different than present couchbase module behaviour.

**Kind**: static method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> \| <code>Array</code> | the document id / key or an array of keys |
| options | <code>Object</code> |  |
| options.populate | <code>Boolean</code> \| <code>String</code> \| <code>Array</code> | populate options, can be a <code>Boolean</code>;                               <code>String</code> representing a path;                               <code>Object</code> with form <code>{ path: String, target: String}</code> where                               <code>path</code> is the path to be populated and <code>target</code> is the target                               field into which to populate. If this format is used, <code>target</code> should be                               part of schema;                               or an <code>Array</code> of                               <code>Strings</code> or <code>Object</code>. |
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
<a name="couchbasedocument.remove" id="couchbasedocument.remove" data-id="couchbasedocument.remove"></a>

### CouchbaseDocument.remove(id, options, fn)
Removes specified document(s).

**Kind**: static method of <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

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
<a name="document" id="document" data-id="document"></a>

## Document ⇐ <code>[BaseModel](#BaseModel)</code>
Base constructor for all created Document instances.
Represents just the document data and generic properties and functions.
Clients should never have to call this directly.

**Kind**: global class  
**Extends**: <code>[BaseModel](#BaseModel)</code>  

* [Document](#Document) ⇐ <code>[BaseModel](#BaseModel)</code>
    * [new Document(values, options, schema, name)](#new_Document_new)
    * _instance_
        * [.modelName](#DocumentmodelName) : <code>String</code>
        * [._isNew](#Document_isNew) : <code>Boolean</code>
        * [.getDocumentKeyValue(full)](#DocumentgetDocumentKeyValue) ⇒ <code>String</code>
        * [.getDocumentKeyKey()](#DocumentgetDocumentKeyKey) ⇒ <code>String</code>
    * _static_
        * [.getDocumentKeyValue(id, full)](#Document.getDocumentKeyValue) ⇒ <code>string</code>

<a name="new_document_new" id="new_document_new" data-id="new_document_new"></a>

### new Document(values, options, schema, name)
Clients do not need to create Document manually.


| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object</code> | the object data |
| options | <code>Object</code> | creation options |
| options.clone | <code>Boolean</code> | Whether to deep clone the incoming data. Default: <code>false</code>.                                  Make sure you wish to do this as it has performance implications. This is                                  useful if you are creating multiple instances from same base data and then                                  wish to modify each instance. |
| schema | <code>[Schema](#Schema)</code> | schema instance |
| name | <code>String</code> | the model name |

<a name="documentmodelname" id="documentmodelname" data-id="documentmodelname"></a>

### document.modelName : <code>String</code>
The name the name of the model. This is both a static and instance property.

**Kind**: instance property of <code>[Document](#Document)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(Cat.modelName) // 'Cat'
console.log(kitty.modelName) // 'Cat'
```
<a name="document_isnew" id="document_isnew" data-id="document_isnew"></a>

### document._isNew : <code>Boolean</code>
Has a key been generated for this document.

**Kind**: instance property of <code>[Document](#Document)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(kitty._isNew) // true
var kat = new Cat({ id: '123abc', name: 'Sabian' })
console.log(kat._isNew) // false
```
<a name="documentgetdocumentkeyvalue" id="documentgetdocumentkeyvalue" data-id="documentgetdocumentkeyvalue"></a>

### document.getDocumentKeyValue(full) ⇒ <code>String</code>
Helper function to get the document key.

**Kind**: instance method of <code>[Document](#Document)</code>  
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
<a name="documentgetdocumentkeykey" id="documentgetdocumentkeykey" data-id="documentgetdocumentkeykey"></a>

### document.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: instance method of <code>[Document](#Document)</code>  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyKey()) // email
```
<a name="document.getdocumentkeyvalue" id="document.getdocumentkeyvalue" data-id="document.getdocumentkeyvalue"></a>

### Document.getDocumentKeyValue(id, full) ⇒ <code>string</code>
Static version of <code>getDocumentKeyValue</code>.

**Kind**: static method of <code>[Document](#Document)</code>  
**Returns**: <code>string</code> - Document key / id  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of the document |
| full | <code>Boolean</code> | If <options>true</options> the full expanded value of the key will be returned.                  If there were any suffix and / or prefix defined in schema they are applied. |

**Example**  
```js
// assuming keyPrefix: 'user::'
console.log(User.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', true)) // user::114477a8-1901-4146-8c90-0fc9eec57a58
console.log(User.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', true)) // user::114477a8-1901-4146-8c90-0fc9eec57a58
console.log(User.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', false)) // 114477a8-1901-4146-8c90-0fc9eec57a58
console.log(User.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', false)) // 114477a8-1901-4146-8c90-0fc9eec57a58
```
<a name="lounge" id="lounge" data-id="lounge"></a>

## Lounge ⇐ <code>Bucket</code>
The Lounge module
The exports object of the <code>lounge</code> module is an instance of this class.
Most apps will only use this one instance. We copy all Couchbase <code>Bucket</code> methods and properties
so you can call them generically = require(this instance as well.

**Kind**: global class  
**Extends**: <code>Bucket</code>  

* [Lounge](#Lounge) ⇐ <code>Bucket</code>
    * [new Lounge(options)](#new_Lounge_new)
    * [.Schema](#LoungeSchema)
    * [.Model](#LoungeModel)
    * [.CouchbaseDocument](#LoungeCouchbaseDocument)
    * [.Document](#LoungeDocument)
    * [.Lounge](#LoungeLounge)
    * [.connect(options, fn)](#Loungeconnect) ⇒ <code>Bucket</code>
    * [.disconnect()](#Loungedisconnect)
    * [.schema(descriptor, options)](#Loungeschema) ⇒ <code>[Schema](#Schema)</code>
    * [.model(name, schema, options)](#Loungemodel) ⇒ <code>[ModelInstance](#ModelInstance)</code>
    * [.getModel(name)](#LoungegetModel) ⇒ <code>[Model](#Model)</code> \| <code>undefined</code>
    * [.setOption(key, value)](#LoungesetOption)
    * [.getOption(key)](#LoungegetOption) ⇒ <code>\*</code>
    * [.modelNames()](#LoungemodelNames) ⇒ <code>Array</code>

<a name="new_lounge_new" id="new_lounge_new" data-id="new_lounge_new"></a>

### new Lounge(options)
The Lounge constructor


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.keyPrefix | <code>String</code> | key prefix for all keys. No default. Generally useful if you wish to namespace documents. Example: <code>app::env::</code>. |
| options.keySuffix | <code>String</code> | Similar as prefix but used as a suffix |
| options.storeFullReferenceId | <code>Boolean</code> | whether to store embedded document keys as fully expanded keys (with prefix and suffix applied) or just the minimized version. default: <code>false</code> |
| options.storeFullKey | <code>Boolean</code> | Similarly to store the fully expanded document key inside the key property. default: <code>false</code> |
| options.alwaysReturnArrays | <code>Boolean</code> | set to true to force <code>findyById</code> to always return an array of documents even if only a single key is passed in |
| options.refIndexKeyPrefix | <code>String</code> | reference lookup index document key prefix. The name of the index is appended. default: <code>$_ref_by_</code> |
| options.delimiter | <code>String</code> | delimiter string used for concatenation in reference document key expansion / generation. default: <code>'_'</code>. This is prepended to the reference document key. |
| options.waitForIndex | <code>Boolean</code> | When documents are saved, indexes are updated. We can wait for this operation to finish before returning = require(<code>save()</code>. Default: <code>false</code> |
| options.minimize | <code>Boolean</code> | "minimize" schemas by removing empty objects. Default: <code>true</code> |
| options.missing | <code>Boolean</code> | By default the <code>findById</code> and index query functions return 3 parameters to the callback:                                  <code>(err, docs, missing)</code>. If this option is set to <code>false</code> we won't return                                  missing keys as the final param in the callback. Default: <code>true</code>. |
| options.atomicRetryTimes | <code>Number</code> | The number of attempts to make within <code>Driver.atomic()</code>. Default: <code>5</code>.                                            See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.atomicRetryInterval | <code>Number</code> | The time to wait between retries, in milliseconds, within <code>Driver.atomic()</code>.                                               Default: <code>0</code>. See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.atomicLock | <code>Boolean</code> | Whether to use <code>getAndLock</code> or standard <code>get</code> during atomic                                       operations within indexing. Default: <code>true</code>.                                       See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.promisify | <code>Boolean</code> | to enable promise support. By default all async functions support promises and return a promise.                                      To disable promise support set this  option to <code>false</code>, ideally at start before                                      doing <code>connect</code> or any other operations. Default: <code>true</code>. |

<a name="loungeschema" id="loungeschema" data-id="loungeschema"></a>

### lounge.Schema
The Lounge Schema constructor

**Kind**: instance property of <code>[Lounge](#Lounge)</code>  
<a name="loungemodel" id="loungemodel" data-id="loungemodel"></a>

### lounge.Model
The Lounge Model constructor.

**Kind**: instance property of <code>[Lounge](#Lounge)</code>  
<a name="loungecouchbasedocument" id="loungecouchbasedocument" data-id="loungecouchbasedocument"></a>

### lounge.CouchbaseDocument
The Lounge CouchbaseDocument constructor.

**Kind**: instance property of <code>[Lounge](#Lounge)</code>  
<a name="loungedocument" id="loungedocument" data-id="loungedocument"></a>

### lounge.Document
The Lounge Document constructor.

**Kind**: instance property of <code>[Lounge](#Lounge)</code>  
<a name="loungelounge" id="loungelounge" data-id="loungelounge"></a>

### lounge.Lounge
The Lounge constructor
The exports of the Lounge module is an instance of this class.

**Kind**: instance property of <code>[Lounge](#Lounge)</code>  
<a name="loungeconnect" id="loungeconnect" data-id="loungeconnect"></a>

### lounge.connect(options, fn) ⇒ <code>Bucket</code>
Connect to the database. You may define Models before connecting, but you should not create any actual document
instances before connecting to the database.

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
**Returns**: <code>Bucket</code> - Couchbase <code>Bucket</code> instance  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.connectionString | <code>String</code> | connection string for the cluster |
| options.bucket | <code>String</code> \| <code>Bucket</code> | name of the bucket or the actual Couchbase <code>bucket</code> instance |
| options.password | <code>String</code> | password |
| options.certpath | <code>String</code> | certpath for cluster |
| options.mock | <code>Boolean</code> | whether to use mocking |
| fn | <code>function</code> | callback |

**Example**  
```js
lounge.connect({
  connectionString: 'couchbase://127.0.0.1',
  bucket: 'lounge_test'
})
```
<a name="loungedisconnect" id="loungedisconnect" data-id="loungedisconnect"></a>

### lounge.disconnect()
Disconnect = require(the bucket. Deletes all defined models.

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
<a name="loungeschema" id="loungeschema" data-id="loungeschema"></a>

### lounge.schema(descriptor, options) ⇒ <code>[Schema](#Schema)</code>
Creates a schema. Prefer to use this over Schema constructor as this will pass along Lounge config settings.

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
**Returns**: <code>[Schema](#Schema)</code> - created <code>Schema</code> instance  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>Object</code> | the schema descriptor |
| options | <code>Object</code> | Schema options |

**Example**  
```js
var schema = lounge.schema({ name: String })
```
<a name="loungemodel" id="loungemodel" data-id="loungemodel"></a>

### lounge.model(name, schema, options) ⇒ <code>[ModelInstance](#ModelInstance)</code>
Creates a model = require(a schema.

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
**Returns**: <code>[ModelInstance](#ModelInstance)</code> - The created <code>ModelInstance</code> class.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name of the model. |
| schema | <code>[Schema](#Schema)</code> | instance |
| options | <code>Object</code> |  |
| options.freeze | <code>Object</code> | to Freeze model. See <code>Object.freeze</code>. Default: <code>true</code> |

**Example**  
```js
var Cat = lounge.model('Cat', schema)
```
<a name="loungegetmodel" id="loungegetmodel" data-id="loungegetmodel"></a>

### lounge.getModel(name) ⇒ <code>[Model](#Model)</code> \| <code>undefined</code>
Returns the model given the name.

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
**Returns**: <code>[Model](#Model)</code> \| <code>undefined</code> - The <code>ModelInstance</code> or <code>undefined</code> if the model by that name does
not exist.  

| Param |
| --- |
| name | 

**Example**  
```js
var Cat = lounge.getModel('Cat')
```
<a name="loungesetoption" id="loungesetoption" data-id="loungesetoption"></a>

### lounge.setOption(key, value)
Sets lounge config options

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | the config key |
| value | <code>\*</code> | option value |

<a name="loungegetoption" id="loungegetoption" data-id="loungegetoption"></a>

### lounge.getOption(key) ⇒ <code>\*</code>
Get config option.

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
**Returns**: <code>\*</code> - Option value  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | the config key |

<a name="loungemodelnames" id="loungemodelnames" data-id="loungemodelnames"></a>

### lounge.modelNames() ⇒ <code>Array</code>
Returns an array of model names created on this instance of Lounge.

**Kind**: instance method of <code>[Lounge](#Lounge)</code>  
**Returns**: <code>Array</code> - Array of model names registered.  
**Access**: public  
**Example**  
```js
console.log(lounge.modelNames()) // [ 'Cat', 'Dog' ]
```
<a name="model" id="model" data-id="model"></a>

## Model ⇐ <code>[CouchbaseDocument](#CouchbaseDocument)</code>
Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code>

**Kind**: global class  
**Extends**: <code>[CouchbaseDocument](#CouchbaseDocument)</code>  

* [Model](#Model) ⇐ <code>[CouchbaseDocument](#CouchbaseDocument)</code>
    * [new Model()](#new_Model_new)
    * [.cas](#CouchbaseDocumentcas) ⇒ <code>String</code>
    * [.db](#CouchbaseDocumentdb) ⇒ <code>Driver</code> \| <code>null</code>
    * [.config](#CouchbaseDocumentconfig) ⇒ <code>Object</code>
    * [.modelName](#DocumentmodelName) : <code>String</code>
    * [._isNew](#Document_isNew) : <code>Boolean</code>
    * [.getCAS(raw)](#CouchbaseDocumentgetCAS) ⇒ <code>String</code> \| <code>Object</code>
    * [.save(options, replicate_to, fn)](#CouchbaseDocumentsave)
    * [.index(options, fn)](#CouchbaseDocumentindex)
    * [.remove(options, fn)](#CouchbaseDocumentremove)
    * [.removeIndexes(options, fn)](#CouchbaseDocumentremoveIndexes)
    * [.populate(options, fn)](#CouchbaseDocumentpopulate)
    * [.getDocumentKeyValue(full)](#DocumentgetDocumentKeyValue) ⇒ <code>String</code>
    * [.getDocumentKeyKey()](#DocumentgetDocumentKeyKey) ⇒ <code>String</code>

<a name="new_model_new" id="new_model_new" data-id="new_model_new"></a>

### new Model()
Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code>

<a name="couchbasedocumentcas" id="couchbasedocumentcas" data-id="couchbasedocumentcas"></a>

### model.cas ⇒ <code>String</code>
Returns the string representation of <code>CAS</code> value.

**Kind**: instance property of <code>[Model](#Model)</code>  
**Example**  
```js
console.log(doc.cas) // String: 00000000a71626e4
```
<a name="couchbasedocumentdb" id="couchbasedocumentdb" data-id="couchbasedocumentdb"></a>

### model.db ⇒ <code>Driver</code> \| <code>null</code>
Gets the database driver of the model

**Kind**: instance property of <code>[Model](#Model)</code>  
<a name="couchbasedocumentconfig" id="couchbasedocumentconfig" data-id="couchbasedocumentconfig"></a>

### model.config ⇒ <code>Object</code>
Gets the config object

**Kind**: instance property of <code>[Model](#Model)</code>  
<a name="documentmodelname" id="documentmodelname" data-id="documentmodelname"></a>

### model.modelName : <code>String</code>
The name the name of the model. This is both a static and instance property.

**Kind**: instance property of <code>[Model](#Model)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(Cat.modelName) // 'Cat'
console.log(kitty.modelName) // 'Cat'
```
<a name="document_isnew" id="document_isnew" data-id="document_isnew"></a>

### model._isNew : <code>Boolean</code>
Has a key been generated for this document.

**Kind**: instance property of <code>[Model](#Model)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(kitty._isNew) // true
var kat = new Cat({ id: '123abc', name: 'Sabian' })
console.log(kat._isNew) // false
```
<a name="couchbasedocumentgetcas" id="couchbasedocumentgetcas" data-id="couchbasedocumentgetcas"></a>

### model.getCAS(raw) ⇒ <code>String</code> \| <code>Object</code>
Returns the document <code>CAS</code> value.

**Kind**: instance method of <code>[Model](#Model)</code>  
**Returns**: <code>String</code> \| <code>Object</code> - the CAS value  

| Param | Type | Description |
| --- | --- | --- |
| raw | <code>Boolean</code> | If <code>true</code> returns the raw CAS document. If <code>false</code> returns string                        representation of CAS. Defaults to <code>false</code>. |

**Example**  
```js
console.log(doc.getCAS()) // String: 00000000a71626e4
console.log(doc.getCAS(true)) // Object: CouchbaseCas<11338961768815788032>
```
<a name="couchbasedocumentsave" id="couchbasedocumentsave" data-id="couchbasedocumentsave"></a>

### model.save(options, replicate_to, fn)
Save the current model instance. Calls db set function for the model id and saves the properties.

**Kind**: instance method of <code>[Model](#Model)</code>  

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
<a name="couchbasedocumentindex" id="couchbasedocumentindex" data-id="couchbasedocumentindex"></a>

### model.index(options, fn)
Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
and deletes the old ones not needed any more.

**Kind**: instance method of <code>[Model](#Model)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| options.atomicLock | <code>Boolean</code> | whether to use atomicLock |
| fn | <code>function</code> | callback |

<a name="couchbasedocumentremove" id="couchbasedocumentremove" data-id="couchbasedocumentremove"></a>

### model.remove(options, fn)
Removes the instance from the database.
Calls the bucket <code>remove()</code> function. Options can be passed to the driver.

**Kind**: instance method of <code>[Model](#Model)</code>  

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
<a name="couchbasedocumentremoveindexes" id="couchbasedocumentremoveindexes" data-id="couchbasedocumentremoveindexes"></a>

### model.removeIndexes(options, fn)
Removes all lookup / index documents for this document.

**Kind**: instance method of <code>[Model](#Model)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| fn | <code>function</code> | callback |

<a name="couchbasedocumentpopulate" id="couchbasedocumentpopulate" data-id="couchbasedocumentpopulate"></a>

### model.populate(options, fn)
Populates this instance given the options

**Kind**: instance method of <code>[Model](#Model)</code>  

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
<a name="documentgetdocumentkeyvalue" id="documentgetdocumentkeyvalue" data-id="documentgetdocumentkeyvalue"></a>

### model.getDocumentKeyValue(full) ⇒ <code>String</code>
Helper function to get the document key.

**Kind**: instance method of <code>[Model](#Model)</code>  
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
<a name="documentgetdocumentkeykey" id="documentgetdocumentkeykey" data-id="documentgetdocumentkeykey"></a>

### model.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: instance method of <code>[Model](#Model)</code>  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyKey()) // email
```
<a name="modelinstance" id="modelinstance" data-id="modelinstance"></a>

## ModelInstance ⇐ <code>[Model](#Model)</code>
ModelInstance class is the compiled class from a schema definition. It extends <code>Model</code>.
All models generated are an instance of <code>ModelInstance</code>. It also inherits <code>grappling-hook</code>
See [grappling-hook](https://www.github.com/bojand/grappling-hook) for pre and post hooks.

**Kind**: global class  
**Extends**: <code>[Model](#Model)</code>  

* [ModelInstance](#ModelInstance) ⇐ <code>[Model](#Model)</code>
    * [new ModelInstance(data, options, cas)](#new_ModelInstance_new)
    * _instance_
        * [.cas](#CouchbaseDocumentcas) ⇒ <code>String</code>
        * [.db](#CouchbaseDocumentdb) ⇒ <code>Driver</code> \| <code>null</code>
        * [.config](#CouchbaseDocumentconfig) ⇒ <code>Object</code>
        * [.modelName](#DocumentmodelName) : <code>String</code>
        * [._isNew](#Document_isNew) : <code>Boolean</code>
        * [.getCAS(raw)](#CouchbaseDocumentgetCAS) ⇒ <code>String</code> \| <code>Object</code>
        * [.save(options, replicate_to, fn)](#CouchbaseDocumentsave)
        * [.index(options, fn)](#CouchbaseDocumentindex)
        * [.remove(options, fn)](#CouchbaseDocumentremove)
        * [.removeIndexes(options, fn)](#CouchbaseDocumentremoveIndexes)
        * [.populate(options, fn)](#CouchbaseDocumentpopulate)
        * [.getDocumentKeyValue(full)](#DocumentgetDocumentKeyValue) ⇒ <code>String</code>
        * [.getDocumentKeyKey()](#DocumentgetDocumentKeyKey) ⇒ <code>String</code>
    * _static_
        * [.schema](#ModelInstance.schema)
        * [.modelName](#ModelInstance.modelName)
        * [.db](#ModelInstance.db)
        * [.config](#ModelInstance.config)

<a name="new_modelinstance_new" id="new_modelinstance_new" data-id="new_modelinstance_new"></a>

### new ModelInstance(data, options, cas)
This would be the constructor for the generated models.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | the model instance data |
| options | <code>Object</code> | optional creation options |
| options.clone | <code>Boolean</code> | Whether to deep clone the incoming data. Default: <code>false</code>.                                  Make sure you wish to do this as it has performance implications. This is                                  useful if you are creating multiple instances from same base data and then                                  wish to modify each instance. |
| cas | <code>Object</code> | the Couchbase <code>CAS</code> value |

<a name="couchbasedocumentcas" id="couchbasedocumentcas" data-id="couchbasedocumentcas"></a>

### modelInstance.cas ⇒ <code>String</code>
Returns the string representation of <code>CAS</code> value.

**Kind**: instance property of <code>[ModelInstance](#ModelInstance)</code>  
**Example**  
```js
console.log(doc.cas) // String: 00000000a71626e4
```
<a name="couchbasedocumentdb" id="couchbasedocumentdb" data-id="couchbasedocumentdb"></a>

### modelInstance.db ⇒ <code>Driver</code> \| <code>null</code>
Gets the database driver of the model

**Kind**: instance property of <code>[ModelInstance](#ModelInstance)</code>  
<a name="couchbasedocumentconfig" id="couchbasedocumentconfig" data-id="couchbasedocumentconfig"></a>

### modelInstance.config ⇒ <code>Object</code>
Gets the config object

**Kind**: instance property of <code>[ModelInstance](#ModelInstance)</code>  
<a name="documentmodelname" id="documentmodelname" data-id="documentmodelname"></a>

### modelInstance.modelName : <code>String</code>
The name the name of the model. This is both a static and instance property.

**Kind**: instance property of <code>[ModelInstance](#ModelInstance)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(Cat.modelName) // 'Cat'
console.log(kitty.modelName) // 'Cat'
```
<a name="document_isnew" id="document_isnew" data-id="document_isnew"></a>

### modelInstance._isNew : <code>Boolean</code>
Has a key been generated for this document.

**Kind**: instance property of <code>[ModelInstance](#ModelInstance)</code>  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(kitty._isNew) // true
var kat = new Cat({ id: '123abc', name: 'Sabian' })
console.log(kat._isNew) // false
```
<a name="couchbasedocumentgetcas" id="couchbasedocumentgetcas" data-id="couchbasedocumentgetcas"></a>

### modelInstance.getCAS(raw) ⇒ <code>String</code> \| <code>Object</code>
Returns the document <code>CAS</code> value.

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  
**Returns**: <code>String</code> \| <code>Object</code> - the CAS value  

| Param | Type | Description |
| --- | --- | --- |
| raw | <code>Boolean</code> | If <code>true</code> returns the raw CAS document. If <code>false</code> returns string                        representation of CAS. Defaults to <code>false</code>. |

**Example**  
```js
console.log(doc.getCAS()) // String: 00000000a71626e4
console.log(doc.getCAS(true)) // Object: CouchbaseCas<11338961768815788032>
```
<a name="couchbasedocumentsave" id="couchbasedocumentsave" data-id="couchbasedocumentsave"></a>

### modelInstance.save(options, replicate_to, fn)
Save the current model instance. Calls db set function for the model id and saves the properties.

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  

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
<a name="couchbasedocumentindex" id="couchbasedocumentindex" data-id="couchbasedocumentindex"></a>

### modelInstance.index(options, fn)
Update all lookup documents for this document instance. Creates new lookup documents for properties that have changed
and deletes the old ones not needed any more.

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| options.atomicLock | <code>Boolean</code> | whether to use atomicLock |
| fn | <code>function</code> | callback |

<a name="couchbasedocumentremove" id="couchbasedocumentremove" data-id="couchbasedocumentremove"></a>

### modelInstance.remove(options, fn)
Removes the instance from the database.
Calls the bucket <code>remove()</code> function. Options can be passed to the driver.

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  

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
<a name="couchbasedocumentremoveindexes" id="couchbasedocumentremoveindexes" data-id="couchbasedocumentremoveindexes"></a>

### modelInstance.removeIndexes(options, fn)
Removes all lookup / index documents for this document.

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.storeFullReferenceId | <code>Boolean</code> | whether we store full document id in reference documents |
| fn | <code>function</code> | callback |

<a name="couchbasedocumentpopulate" id="couchbasedocumentpopulate" data-id="couchbasedocumentpopulate"></a>

### modelInstance.populate(options, fn)
Populates this instance given the options

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  

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
<a name="documentgetdocumentkeyvalue" id="documentgetdocumentkeyvalue" data-id="documentgetdocumentkeyvalue"></a>

### modelInstance.getDocumentKeyValue(full) ⇒ <code>String</code>
Helper function to get the document key.

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  
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
<a name="documentgetdocumentkeykey" id="documentgetdocumentkeykey" data-id="documentgetdocumentkeykey"></a>

### modelInstance.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: instance method of <code>[ModelInstance](#ModelInstance)</code>  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyKey()) // email
```
<a name="modelinstance.schema" id="modelinstance.schema" data-id="modelinstance.schema"></a>

### ModelInstance.schema
Schema the schema of this model.

**Kind**: static property of <code>[ModelInstance](#ModelInstance)</code>  
<a name="modelinstance.modelname" id="modelinstance.modelname" data-id="modelinstance.modelname"></a>

### ModelInstance.modelName
The name of the model.

**Kind**: static property of <code>[ModelInstance](#ModelInstance)</code>  
<a name="modelinstance.db" id="modelinstance.db" data-id="modelinstance.db"></a>

### ModelInstance.db
The driver.

**Kind**: static property of <code>[ModelInstance](#ModelInstance)</code>  
<a name="modelinstance.config" id="modelinstance.config" data-id="modelinstance.config"></a>

### ModelInstance.config
The config.

**Kind**: static property of <code>[ModelInstance](#ModelInstance)</code>  
<a name="schema" id="schema" data-id="schema"></a>

## Schema
Schema class represents the schema definition. It includes properties, methods, static methods, and any
middleware we want to define.

**Kind**: global class  
**Access**: public  

* [Schema](#Schema)
    * [new Schema(descriptor, options)](#new_Schema_new)
    * [.index(prop, options)](#Schemaindex)
    * [.method(name, func)](#Schemamethod)
    * [.static(name, val)](#Schemastatic)
    * [.virtual(name, type, options)](#Schemavirtual)
    * [.set(key, [value])](#Schemaset)
    * [.get(key)](#Schemaget) ⇒ <code>\*</code>
    * [.pre()](#Schemapre)
    * [.post()](#Schemapost)
    * [.add(key, descriptor)](#Schemaadd)
    * [.extend(other)](#Schemaextend)
    * [.getDocumentKeyValue(id, full)](#SchemagetDocumentKeyValue) ⇒ <code>String</code>
    * [.getRefKey(name, v)](#SchemagetRefKey) ⇒ <code>string</code>
    * [.hasRefPath(path)](#SchemahasRefPath) ⇒ <code>boolean</code>

<a name="new_schema_new" id="new_schema_new" data-id="new_schema_new"></a>

### new Schema(descriptor, options)
Creates an object schema


| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>Object</code> | the schema definition |
| options | <code>Object</code> |  |
| options.strict | <code>Boolean</code> | By default (<code>true</code>), allow only values in the schema to be set.                                   When this is <code>false</code>, setting new fields will dynamically add the field                                   to the schema as type "any". |
| options.dotNotation | <code>Boolean</code> | Allow fields to be set via dot notation. Default: <code>true</code>.                                      <code>obj['user.name'] = 'Joe'; -> obj: { user: 'Joe' }</code> |
| options.minimize | <code>Boolean</code> | "minimize" schemas by removing empty objects. Default: <code>true</code> |
| options.toObject | <code>Object</code> | <code>toObject</code> method options. |
| options.toObject.minimize | <code>Boolean</code> | "minimize" schemas by removing empty objects. Default: <code>true</code> |
| options.toObject.transform | <code>function</code> | transform function |
| options.toObject.virtuals | <code>Boolean</code> | whether to include virtual properties. Default: <code>false</code> |
| options.toObject.dateToISO | <code>Boolean</code> | convert dates to string in ISO format using <code>Date.toISOString()</code>. Default:  <code>false</code> |
| options.toJSON | <code>Object</code> | options for <code>toJSON</code> method options, similar to above |
| options.strict | <code>Boolean</code> | ensures that value passed in to assigned that were not specified in our                                   schema do not get saved |
| options.onBeforeValueSet | <code>function</code> | function called when write operations on an object takes place. Currently, it will only notify of write operations on the object itself and will not notify you when child objects are written to. If you return false or throw an error within the onBeforeValueSet handler, the write operation will be cancelled. Throwing an error will add the error to the error stack. |
| options.onValueSet | <code>function</code> | Similar to <code>onBeforeValueSet</code>, but called after we've set a value on the key, |

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
<a name="schemaindex" id="schemaindex" data-id="schemaindex"></a>

### schema.index(prop, options)
Creates an index on the specified property.

**Kind**: instance method of <code>[Schema](#Schema)</code>  
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
<a name="schemamethod" id="schemamethod" data-id="schemamethod"></a>

### schema.method(name, func)
Creates a instance method for the created model.
An object of function names and functions can also be passed in.

**Kind**: instance method of <code>[Schema](#Schema)</code>  
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
<a name="schemastatic" id="schemastatic" data-id="schemastatic"></a>

### schema.static(name, val)
Creates a static function or property for the created model.
An object of function or property names and functions or values can also be passed in.

**Kind**: instance method of <code>[Schema](#Schema)</code>  
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
<a name="schemavirtual" id="schemavirtual" data-id="schemavirtual"></a>

### schema.virtual(name, type, options)
Creates a virtual property for the created model with the given object
specifying the get and optionally set function

**Kind**: instance method of <code>[Schema](#Schema)</code>  
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
<a name="schemaset" id="schemaset" data-id="schemaset"></a>

### schema.set(key, [value])
Sets/gets a schema option.

**Kind**: instance method of <code>[Schema](#Schema)</code>  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | option name |
| [value] | <code>Object</code> | if not passed, the current option value is returned |

<a name="schemaget" id="schemaget" data-id="schemaget"></a>

### schema.get(key) ⇒ <code>\*</code>
Gets a schema option.

**Kind**: instance method of <code>[Schema](#Schema)</code>  
**Returns**: <code>\*</code> - the option value  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | option name |

<a name="schemapre" id="schemapre" data-id="schemapre"></a>

### schema.pre()
Defines a pre hook for the schema.
See [grappling-hook](https://www.github.com/bojand/grappling-hook).

**Kind**: instance method of <code>[Schema](#Schema)</code>  
<a name="schemapost" id="schemapost" data-id="schemapost"></a>

### schema.post()
Defines a post hook for the schema.
See [grappling-hook](https://www.github.com/bojand/grappling-hook).

**Kind**: instance method of <code>[Schema](#Schema)</code>  
<a name="schemaadd" id="schemaadd" data-id="schemaadd"></a>

### schema.add(key, descriptor)
Adds the descriptor to the schema at the given key. Or add an <code>object</code> as a descriptor.

**Kind**: instance method of <code>[Schema](#Schema)</code>  

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
<a name="schemaextend" id="schemaextend" data-id="schemaextend"></a>

### schema.extend(other)
Extends other schema. Copies descriptor properties, methods, statics, virtuals and middleware.
If this schema has a named property already, the property is not copied.

**Kind**: instance method of <code>[Schema](#Schema)</code>  

| Param | Type | Description |
| --- | --- | --- |
| other | <code>[Schema](#Schema)</code> | the schema to extend. |

<a name="schemagetdocumentkeyvalue" id="schemagetdocumentkeyvalue" data-id="schemagetdocumentkeyvalue"></a>

### schema.getDocumentKeyValue(id, full) ⇒ <code>String</code>
Helper function to get the document key

**Kind**: instance method of <code>[Schema](#Schema)</code>  

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
<a name="schemagetrefkey" id="schemagetrefkey" data-id="schemagetrefkey"></a>

### schema.getRefKey(name, v) ⇒ <code>string</code>
Gets the reference document key value

**Kind**: instance method of <code>[Schema](#Schema)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | index name |
| v | <code>String</code> | index value |

<a name="schemahasrefpath" id="schemahasrefpath" data-id="schemahasrefpath"></a>

### schema.hasRefPath(path) ⇒ <code>boolean</code>
Returns whether this schema has the specified reference path

**Kind**: instance method of <code>[Schema](#Schema)</code>  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | path to check |

