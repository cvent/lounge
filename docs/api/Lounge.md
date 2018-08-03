---
sidebarDepth: 0
---
<a name="Lounge"></a>

## Lounge ⇐ <code>Bucket</code>
The Lounge module
The exports object of the <code>lounge</code> module is an instance of this class.
Most apps will only use this one instance. We copy all Couchbase <code>Bucket</code> methods and properties
so you can call them generically = require(this instance as well.

**Kind**: global class  
**Extends**: <code>Bucket</code>  

* [Lounge](#Lounge) ⇐ <code>Bucket</code>
    * [new Lounge(options)](#new_Lounge_new)
    * [.Schema](#Lounge+Schema)
    * [.Model](#Lounge+Model)
    * [.CouchbaseDocument](#Lounge+CouchbaseDocument)
    * [.Document](#Lounge+Document)
    * [.Lounge](#Lounge+Lounge)
    * [.connect(options, fn)](#Lounge+connect) ⇒ <code>Bucket</code>
    * [.disconnect()](#Lounge+disconnect)
    * [.schema(descriptor, options)](#Lounge+schema) ⇒ [<code>Schema</code>](#Schema)
    * [.model(name, schema, options)](#Lounge+model) ⇒ [<code>ModelInstance</code>](#ModelInstance)
    * [.getModel(name)](#Lounge+getModel) ⇒ [<code>Model</code>](#Model) \| <code>undefined</code>
    * [.setOption(key, value)](#Lounge+setOption)
    * [.getOption(key)](#Lounge+getOption) ⇒ <code>\*</code>
    * [.modelNames()](#Lounge+modelNames) ⇒ <code>Array</code>

<a name="new_Lounge_new"></a>

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
| options.retryTemporaryErrors | <code>Boolean</code> | Whether to automatically backoff/retry on temporary                                       couchbase errors. Default: <code>false</code>.                                            See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.tempRetryTimes | <code>Number</code> | The number of attempts to make when backing off temporary errors.                                            See <code>async.retry</code>. Default: <code>5</code>.                                            See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.tempRetryInterval | <code>Number</code> | The time to wait between retries, in milliseconds, when backing off temporary errors .                                               See <code>async.retry</code>. Default: <code>50</code>.                                            See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.atomicRetryTimes | <code>Number</code> | The number of attempts to make within <code>Driver.atomic()</code>. Default: <code>5</code>.                                            See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.atomicRetryInterval | <code>Number</code> | The time to wait between retries, in milliseconds, within <code>Driver.atomic()</code>.                                               Default: <code>0</code>. See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.atomicLock | <code>Boolean</code> | Whether to use <code>getAndLock</code> or standard <code>get</code> during atomic                                       operations within indexing. Default: <code>true</code>.                                       See [https://github.com/bojand/couchbase-driver](https://github.com/bojand/couchbase-driver) |
| options.promisify | <code>Boolean</code> | to enable promise support. By default all async functions support promises and return a promise.                                      To disable promise support set this  option to <code>false</code>, ideally at start before                                      doing <code>connect</code> or any other operations. Default: <code>true</code>. |
| options.errorOnMissingIndex | <code>Boolean</code> | error when a document referenced by index reference document is missing. Default: `false`                                                The error will have `reference` property of document reference target document id(s).                                                The error will have `missing` property of missing document ids. |
| options.emitErrors | <code>Boolean</code> | Whether to broadcast error events. Default: `true` |

<a name="Lounge+Schema"></a>

### lounge.Schema
The Lounge Schema constructor

**Kind**: instance property of [<code>Lounge</code>](#Lounge)  
<a name="Lounge+Model"></a>

### lounge.Model
The Lounge Model constructor.

**Kind**: instance property of [<code>Lounge</code>](#Lounge)  
<a name="Lounge+CouchbaseDocument"></a>

### lounge.CouchbaseDocument
The Lounge CouchbaseDocument constructor.

**Kind**: instance property of [<code>Lounge</code>](#Lounge)  
<a name="Lounge+Document"></a>

### lounge.Document
The Lounge Document constructor.

**Kind**: instance property of [<code>Lounge</code>](#Lounge)  
<a name="Lounge+Lounge"></a>

### lounge.Lounge
The Lounge constructor
The exports of the Lounge module is an instance of this class.

**Kind**: instance property of [<code>Lounge</code>](#Lounge)  
<a name="Lounge+connect"></a>

### lounge.connect(options, fn) ⇒ <code>Bucket</code>
Connect to the database. You may define Models before connecting, but you should not create any actual document
instances before connecting to the database.

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
**Returns**: <code>Bucket</code> - Couchbase <code>Bucket</code> instance  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.connectionString | <code>String</code> | connection string for the cluster |
| options.bucket | <code>String</code> \| <code>Bucket</code> | name of the bucket or the actual Couchbase <code>bucket</code> instance |
| options.username | <code>String</code> | username |
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
<a name="Lounge+disconnect"></a>

### lounge.disconnect()
Disconnect = require(the bucket. Deletes all defined models.

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
<a name="Lounge+schema"></a>

### lounge.schema(descriptor, options) ⇒ [<code>Schema</code>](#Schema)
Creates a schema. Prefer to use this over Schema constructor as this will pass along Lounge config settings.

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
**Returns**: [<code>Schema</code>](#Schema) - created <code>Schema</code> instance  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>Object</code> | the schema descriptor |
| options | <code>Object</code> | Schema options |

**Example**  
```js
var schema = lounge.schema({ name: String })
```
<a name="Lounge+model"></a>

### lounge.model(name, schema, options) ⇒ [<code>ModelInstance</code>](#ModelInstance)
Creates a model = require(a schema.

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
**Returns**: [<code>ModelInstance</code>](#ModelInstance) - The created <code>ModelInstance</code> class.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name of the model. |
| schema | [<code>Schema</code>](#Schema) | instance |
| options | <code>Object</code> |  |
| options.freeze | <code>Object</code> | to Freeze model. See <code>Object.freeze</code>. Default: <code>true</code> |

**Example**  
```js
var Cat = lounge.model('Cat', schema)
```
<a name="Lounge+getModel"></a>

### lounge.getModel(name) ⇒ [<code>Model</code>](#Model) \| <code>undefined</code>
Returns the model given the name.

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
**Returns**: [<code>Model</code>](#Model) \| <code>undefined</code> - The <code>ModelInstance</code> or <code>undefined</code> if the model by that name does
not exist.  

| Param |
| --- |
| name | 

**Example**  
```js
var Cat = lounge.getModel('Cat')
```
<a name="Lounge+setOption"></a>

### lounge.setOption(key, value)
Sets lounge config options

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | the config key |
| value | <code>\*</code> | option value |

<a name="Lounge+getOption"></a>

### lounge.getOption(key) ⇒ <code>\*</code>
Get config option.

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
**Returns**: <code>\*</code> - Option value  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | the config key |

<a name="Lounge+modelNames"></a>

### lounge.modelNames() ⇒ <code>Array</code>
Returns an array of model names created on this instance of Lounge.

**Kind**: instance method of [<code>Lounge</code>](#Lounge)  
**Returns**: <code>Array</code> - Array of model names registered.  
**Access**: public  
**Example**  
```js
console.log(lounge.modelNames()) // [ 'Cat', 'Dog' ]
```
