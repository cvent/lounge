---
sidebarDepth: 0
---

# API Reference

## Classes

<dl>
<dt><a href="/lounge/api/AbstractBaseModel.html">AbstractBaseModel</a></dt>
<dd><p>Abstract Base Model representation for all created Document instances.
Represents just the document data and generic properties and functions.
Also used for &quot;object&quot; abstraction / representation of sub documents that are not actual Models / Documents.
Clients should never have to call this directly.</p>
</dd>
<dt><a href="/lounge/api/BaseModel.html">BaseModel</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>BaseModel implements <code>AbstractBaseModel</code> and is a representation for all created Document
instances that have a user defined schema. Represents just the document data and generic properties and functions.
Clients should never have to call this directly. Inherits <code>EventEmitter</code></p>
</dd>
<dt><a href="/lounge/api/CouchbaseDocument.html">CouchbaseDocument</a> ⇐ <code><a href="#Document">Document</a></code></dt>
<dd><p>CouchbaseDocument inherits Document and handles all the database related actions.
Clients should never have to call this directly.</p>
</dd>
<dt><a href="/lounge/api/Document.html">Document</a> ⇐ <code><a href="#BaseModel">BaseModel</a></code></dt>
<dd><p>Base constructor for all created Document instances.
Represents just the document data and generic properties and functions.
Clients should never have to call this directly.</p>
</dd>
<dt><a href="/lounge/api/Lounge.html">Lounge</a> ⇐ <code>Bucket</code></dt>
<dd><p>The Lounge module
The exports object of the <code>lounge</code> module is an instance of this class.
Most apps will only use this one instance. We copy all Couchbase <code>Bucket</code> methods and properties
so you can call them generically = require(this instance as well.</p>
</dd>
<dt><a href="/lounge/api/Model.html">Model</a> ⇐ <code><a href="#CouchbaseDocument">CouchbaseDocument</a></code></dt>
<dd><p>Model class is a base class for all <code>ModelInstances</code> and it extends <code>CouchbaseDocument</code></p>
</dd>
<dt><a href="/lounge/api/ModelInstance.html">ModelInstance</a> ⇐ <code><a href="#Model">Model</a></code></dt>
<dd><p>ModelInstance class is the compiled class from a schema definition. It extends <code>Model</code>.
All models generated are an instance of <code>ModelInstance</code>. It also inherits <code>grappling-hook</code>
See <a href="https://www.github.com/bojand/grappling-hook">grappling-hook</a> for pre and post hooks.</p>
</dd>
<dt><a href="/lounge/api/Schema.html">Schema</a></dt>
<dd><p>Schema class represents the schema definition. It includes properties, methods, static methods, and any
middleware we want to define.</p>
</dd>
</dl>

