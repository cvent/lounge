---
sidebarDepth: 0
---
<a name="AbstractBaseModel"></a>

## AbstractBaseModel
Abstract Base Model representation for all created Document instances.
Represents just the document data and generic properties and functions.
Also used for "object" abstraction / representation of sub documents that are not actual Models / Documents.
Clients should never have to call this directly.

**Kind**: global class  

* [AbstractBaseModel](#AbstractBaseModel)
    * [new AbstractBaseModel(values, options, schema)](#new_AbstractBaseModel_new)
    * [.schema](#AbstractBaseModel+schema) ⇒ [<code>Schema</code>](#Schema)
    * [.set()](#AbstractBaseModel+set)
    * [.get(path)](#AbstractBaseModel+get) ⇒ <code>\*</code>
    * [.toObject(options)](#AbstractBaseModel+toObject) ⇒ <code>Object</code>
    * [.toJSON(options)](#AbstractBaseModel+toJSON) ⇒ <code>Object</code>
    * [.inspect()](#AbstractBaseModel+inspect)
    * [.toString()](#AbstractBaseModel+toString)
    * [.clear()](#AbstractBaseModel+clear)
    * [.getErrors()](#AbstractBaseModel+getErrors)
    * [.clearErrors()](#AbstractBaseModel+clearErrors)
    * [.hasErrors()](#AbstractBaseModel+hasErrors) ⇒ <code>Boolean</code>

<a name="new_AbstractBaseModel_new"></a>

### new AbstractBaseModel(values, options, schema)
Clients do not need to create <code>AbstractBaseModel</code> instances manually.


| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object</code> | the object data |
| options | <code>Object</code> | creation options |
| options.clone | <code>Boolean</code> | Whether to deep clone the incoming data. Default: <code>false</code>.                                  Make sure you wish to do this as it has performance implications. This is                                  useful if you are creating multiple instances from same base data and then                                  wish to modify each instance. |
| schema | [<code>Schema</code>](#Schema) | schema instance |

<a name="AbstractBaseModel+schema"></a>

### abstractBaseModel.schema ⇒ [<code>Schema</code>](#Schema)
Get the model schema instance

**Kind**: instance property of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
**Access**: public  
<a name="AbstractBaseModel+set"></a>

### abstractBaseModel.set()
Sets data on the document based on the schema.
Accepts a key of property and value for the property, or object representing the data for document.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
**Access**: public  
**Example**  
```js
user.set('fistName', 'Joe')
user.set({ lastName: 'Smith' })
```
<a name="AbstractBaseModel+get"></a>

### abstractBaseModel.get(path) ⇒ <code>\*</code>
Gets value at a specified path.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
**Returns**: <code>\*</code> - The value at the path.  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | The path / property to retrieve. |

<a name="AbstractBaseModel+toObject"></a>

### abstractBaseModel.toObject(options) ⇒ <code>Object</code>
Converts this document into a plain javascript object.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
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
<a name="AbstractBaseModel+toJSON"></a>

### abstractBaseModel.toJSON(options) ⇒ <code>Object</code>
Similar as <code>toObject</code> but applied when <code>JSON.stringify</code> is called

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
**Returns**: <code>Object</code> - Plain javascript object representation of document.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Same options as <code>toObject</code>. |

<a name="AbstractBaseModel+inspect"></a>

### abstractBaseModel.inspect()
Helper for <code>console.log</code>. Just invokes default <code>toObject</code>.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
**Access**: public  
<a name="AbstractBaseModel+toString"></a>

### abstractBaseModel.toString()
Helper for <code>console.log</code>. Alias for <code>inspect</code>.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
**Access**: public  
<a name="AbstractBaseModel+clear"></a>

### abstractBaseModel.clear()
Clear the document data. This can be overridden at schema level using <code>Schema.set()</code>.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
<a name="AbstractBaseModel+getErrors"></a>

### abstractBaseModel.getErrors()
Gets the errors object.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
<a name="AbstractBaseModel+clearErrors"></a>

### abstractBaseModel.clearErrors()
Clears all the errors.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
<a name="AbstractBaseModel+hasErrors"></a>

### abstractBaseModel.hasErrors() ⇒ <code>Boolean</code>
Checks whether we have any errors.

**Kind**: instance method of [<code>AbstractBaseModel</code>](#AbstractBaseModel)  
**Returns**: <code>Boolean</code> - <code>true</code> if we have errors, <code>false</code> otherwise.  
