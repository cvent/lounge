# Lounge

Simple Mongoose-inspired ODM for [Couchbase](http://www.couchbase.com).

## Installation

`npm install lounge`

## Stability

This module is under development and there could be bugs. API may not be 100% locked down. 

## Overview

Lounge is a simple, somewhat opinionated, Mongoose-inspired ODM for [Couchbase](http://www.couchbase.com). Main goal is
to provide modeling tool framework for working with Couchbase databases in an asynchronous environment of Node.js. 

```js
var lounge = require('lounge');
lounge.connect('couchbase://127.0.0.1');

var schema = lounge.schema({ name: String });
var Cat = lounge.model('Cat', schema);

var kitty = new Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) // ...
  console.log('meow');
});
```

##### Features:

* Schema definition
* Strict modelling based on schema
* Schema inheritance
* Automatic type and custom validation
* Document upsert and removal
* Embedded (referenced) documents
* Automatic and manual population of embedded (referenced) document
* Middleware including pre and post hooks
* Indexing using [reference lookup documents](http://docs.couchbase.com/developer/dev-guide-3.0/lookups.html)

##### Outside of the scope of this module:

* Document and view management. There are two many patterns and ways of performing document and view management and 
 view lookup that it is impractical to accomplish anything sane within a simple ODM. This can easily be expanded
 on top of Lounge.
* View queries. For same reasons this falls outside of the scope of Lounge.

## Documentation

* [Setup](#lounge)
* [Modelling](#model)
* [Embedded Documents](#embedded)
* [Middleware](#middleware)
* [Population](#population)
* [Indexes](#indexes)
* [Queries](#queries)
* [Events](#events)

### Setup <a id="lounge"></a>

```js
var lounge = require('lounge');
```

Module exports an instance of `Lounge` class.

##### Lounge(options)

Creates a new instance of `Lounge` class. You rarely have to do this.

```js
var lounge = require('lounge');
var l = new lounge.Lounge();
```

** Options **

* `keyPrefix` - key prefix for all keys. No default. Generally useful if you wish to namespace documents. 
Example: `app::env::`.
* `storeFullReferenceId` - whether to store embedded document keys as fully expanded keys 
(with prefix and suffix applied) or just the minimized version. default: `false`. 
* `storeFullKey` - Similarly, to store the fully expanded document key inside the key property. default: `false`
* `alwaysReturnArrays` - set to true to force `findyById` to always return an array of documents even if only
a single key is passed in. Default: `false`
* `refIndexKeyPrefix` - reference lookup index document key prefix. The name of the index is appended to this.
Default: `'$_ref_by_'`
* `delimiter` - delimiter string used for concatenation in key expansion / generation. default: `'_'`
* `waitForIndex` - When documents are saved, indexes are updated. We can wait for this operation to finish before 
returning from `save()`. Default: `false`

Any of these options, or additional variables can be manipulated using the `setOption` and `getOption` methods.
  
```js
var lounge = require('lounge');
lounge.setOption('delimiter', '::');
console.log(lounge.getOption('delimiter');
```
##### Lounge.connect(options, fn, mock)

Connects to the database cluster based on `options`. When completed calls `fn` callback. Set `mock` to `true` to use
[Couchbase mocking](https://github.com/couchbase/couchnode#mock-testing). Alternatively you can set
`LOUNGE_COUCHBASE_MOCK` environment variable.

** Options **

* `connectionString` - connection string for the cluster. See [Cluster documentation](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html).
* `bucket` - name of the bucket to be used for [`openBucket`](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html#openBucket)
or the actual, already connected, Couchbase `bucket` instance.
* `password` - password for [`openBucket`](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html#openBucket)
* `certpath` - certpath for [cluster constructor](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html).

```js
var lounge = require('lounge');
lounge.connect('couchbase://127.0.0.1', function(err) {
  // ... connected
});
```

##### Lounge.disconnect()

Disconnect from the bucket. Deletes all defined models.

##### Lounge.schema(descriptor, options)

Creates a new `Schema` based on `descriptor` and `options`. Prefer this over the actual `Schema` constructor as this
will pass lounge config variables to the `Schema` constructor automatically. Same options.

##### Lounge.model(name, schema, options)

Defines a Model based on case sensitive model `name` and created `schema`, with given options. From there we can create
instances of the Model;

** Options **

* `freeze` - to freeze the model. See `Object.freeze`. Default: `true`

```js
var userSchema = lounge.schema({
  firstName: String,
  lastName: String,
  email: String,
  dateOfBirth: Date,
});

User = lounge.model('User', userSchema);
var user = new User({
  firstName: 'Joe',
  lastName: 'Smith',
  email: 'joe@gmail.com',
  dateOfBirth: new Date()
});

console.log(user instanceof User) // true
```

##### Lounge.modelNames()

Returns and array of all defined model names.

##### Bucket functions

Lounge instance also inherits all public [`Bucket`](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Bucket.html)
 functions and properties.
 
```js
lounge.get('mydocumentkey', function(err, res) {
  // .. save as if we did normal bucket.get()
});
```

##### Lounge.Schema

Exported `Schema` constructor. You can use this as well as `lounge.schema()`, which is preferred.

```js
var userSchema = new lounge.Schema({ name: String });
```

##### Lounge.Model

Exported `Model` constructor. You should never have to manually create a Model.

##### Lounge.Document

Exported  internal `Document` constructor. You should never have to manually create a Document.
 
```js
// already defined User model
var user = new User({name: 'Bob'});
console.log(user instanceof User) // true
console.log(user instanceof lounge.Model) // true
console.log(user instanceof lounge.Document) // true
```

#### Modelling <a id="model"></a>

* Defining schema and model creation 
* Options
* Validation
* Key
* Getters
* Setters
* Indexes
* Embedded documents
* Statics
* Methods

#### Embedded Documents <a id="embedded"></a>

Go deeper into embedded documents

#### Middleware <a id="middleware"></a>

Go deeper into pre and post middleware

#### Population <a id="population"></a>

Go deeper into population

#### Indexes <a id="indexes"></a>

Go deeper into indexes

#### Queries <a id="queries"></a>

Go deeper into indexes

#### Events <a id="events"></a>

Go deeper into events

## TODO

TODO

## Credits

Credits for draft, mongoose, other things.

## License

Copyright 2015 Bojan Djurkovic

Licensed under the MIT License.