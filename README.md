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
lounge.connect(''couchbase://127.0.0.1');

var Cat = lounge.model('Cat', { name: String });

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
* [Model](#model)
* [Embedded Documents](#embedded)
* [Middleware](#middleware)
* [Population](#population)
* [Indexes](#indexes)
* [Queries](#queries)
* [Events](#events)

#### Setup <a id="lounge"></a>

* Lounge setup and connecting
* Options

#### Model <a id="model"></a>

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