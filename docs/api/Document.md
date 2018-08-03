---
sidebarDepth: 0
---
<a name="Document"></a>

## Document ⇐ [<code>BaseModel</code>](#BaseModel)
Base constructor for all created Document instances.
Represents just the document data and generic properties and functions.
Clients should never have to call this directly.

**Kind**: global class  
**Extends**: [<code>BaseModel</code>](#BaseModel)  

* [Document](#Document) ⇐ [<code>BaseModel</code>](#BaseModel)
    * [new Document(values, options, schema, name)](#new_Document_new)
    * _instance_
        * [.modelName](#Document+modelName) : <code>String</code>
        * [._isNew](#Document+_isNew) : <code>Boolean</code>
        * [.getDocumentKeyValue(full)](#Document+getDocumentKeyValue) ⇒ <code>String</code>
        * [.getDocumentKeyKey()](#Document+getDocumentKeyKey) ⇒ <code>String</code>
    * _static_
        * [.getDocumentKeyKey()](#Document.getDocumentKeyKey) ⇒ <code>String</code>
        * [.getDocumentKeyValue(id, full)](#Document.getDocumentKeyValue) ⇒ <code>string</code>

<a name="new_Document_new"></a>

### new Document(values, options, schema, name)
Clients do not need to create Document manually.


| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object</code> | the object data |
| options | <code>Object</code> | creation options |
| options.clone | <code>Boolean</code> | Whether to deep clone the incoming data. Default: <code>false</code>.                                  Make sure you wish to do this as it has performance implications. This is                                  useful if you are creating multiple instances from same base data and then                                  wish to modify each instance. |
| schema | [<code>Schema</code>](#Schema) | schema instance |
| name | <code>String</code> | the model name |

<a name="Document+modelName"></a>

### document.modelName : <code>String</code>
The name the name of the model. This is both a static and instance property.

**Kind**: instance property of [<code>Document</code>](#Document)  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(Cat.modelName) // 'Cat'
console.log(kitty.modelName) // 'Cat'
```
<a name="Document+_isNew"></a>

### document._isNew : <code>Boolean</code>
Has a key been generated for this document.

**Kind**: instance property of [<code>Document</code>](#Document)  
**Example**  
```js
var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)
var kitty = new Cat({ name: 'Zildjian' })
console.log(kitty._isNew) // true
var kat = new Cat({ id: '123abc', name: 'Sabian' })
console.log(kat._isNew) // false
```
<a name="Document+getDocumentKeyValue"></a>

### document.getDocumentKeyValue(full) ⇒ <code>String</code>
Helper function to get the document key.

**Kind**: instance method of [<code>Document</code>](#Document)  
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

### document.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: instance method of [<code>Document</code>](#Document)  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }})
var User = lounge.model('User', schema)
var user = new User({ email: 'bsmith@acme.com' })
console.log(user.getDocumentKeyKey()) // email
```
<a name="Document.getDocumentKeyKey"></a>

### Document.getDocumentKeyKey() ⇒ <code>String</code>
Gets the Document key property name.

**Kind**: static method of [<code>Document</code>](#Document)  
**Returns**: <code>String</code> - Document key property name  
**Access**: public  
**Example**  
```js
var schema = lounge.schema({ email: { type: String, key: true, generate: false }});
var User = lounge.model('User', schema);
console.log(User.getDocumentKeyKey()); // email
```
<a name="Document.getDocumentKeyValue"></a>

### Document.getDocumentKeyValue(id, full) ⇒ <code>string</code>
Static version of <code>getDocumentKeyValue</code>.

**Kind**: static method of [<code>Document</code>](#Document)  
**Returns**: <code>string</code> - Document key / id  
**Access**: public  


**Example**  
```js
// assuming keyPrefix: 'user::'
console.log(User.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', true)) // user::114477a8-1901-4146-8c90-0fc9eec57a58
console.log(User.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', true)) // user::114477a8-1901-4146-8c90-0fc9eec57a58
console.log(User.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', false)) // 114477a8-1901-4146-8c90-0fc9eec57a58
console.log(User.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', false)) // 114477a8-1901-4146-8c90-0fc9eec57a58
```
