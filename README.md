# Lounge

Simple Mongoose-inspired ODM for [Couchbase](http://www.couchbase.com).

## Installation

`npm install lounge`

**Node.js >= 0.10 supported. For Node.js versions < 6.0 run `node` with the harmony `--harmony` and harmony proxies `--harmony_proxies` flags. For Node.js version >= 6.0 no special flags are needed.**

## Overview

Lounge is a simple, somewhat opinionated, Mongoose-inspired ODM for [Couchbase](http://www.couchbase.com). Main goal is
to provide modeling tool framework for working with Couchbase databases in an asynchronous environment of Node.js.

```js
var lounge = require('lounge');
lounge.connect({
  connectionString: 'couchbase://127.0.0.1',
  bucket: 'lounge_test'
});

var schema = lounge.schema({ name: String });
var Cat = lounge.model('Cat', schema);

var kitty = new Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) // ...
  console.log('meow');
});
```

### Features:

* Schema definition
* Strict modeling based on schema
* Schema extension
* Automatic type validation and custom validation
* Document upsert and removal
* Embedded (referenced) documents
* Automatic and manual population of embedded (referenced) document
* Middleware including pre and post hooks
* Indexing using [reference lookup documents](http://docs.couchbase.com/developer/dev-guide-3.0/lookups.html)
* Promise support

### Outside of the scope of this module:

* Document and view management. There are too many patterns and ways of performing document and view management and
 view lookup that it is impractical to accommodate anything sane within a simple ODM. This can easily be expanded
 on top of Lounge.
* View queries. For same reasons this falls outside of the scope of Lounge.
* Automatic document removal on key change. That is if a document key property changes, the new document is saved under
the new key. The old document sticks around under the old key. There are too many implications if we start automatically
handling document removal in this scenario. This should be handled by the user of this module. In most use cases this
should not really be an issue.

## Documentation

* [Guide & API Documentation](http://bojand.github.io/lounge)

## Tests

Module automated tests can be run using `npm test` command. The tests are executed using [Couchbase mocking](https://github.com/couchbase/couchnode#mock-testing).
To run tests against an actual local database create a bucket `lounge_test` and remove `LOUNGE_COUCHBASE_MOCK=true` from
`test` script property in `package.json`.

## Credits

Lots of code and design inspired by [Mongoose](http://mongoosejs.com/).
Uses modified code from [node-schema-object](https://github.com/scotthovestadt/node-schema-object) for modeling
available as a separate module [Plaster](https://github.com/bojand/plaster).
Website design based on [koajs.com](http://koajs.com/) design.

## License

Copyright 2015 Bojan D.

Licensed under the MIT License.
