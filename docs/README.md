---
home: true
heroImage: /sofa128.png
actionText: Get Started →
features:
- title: Schema definition
  details: Strict modeling based on schema with automatic and custom type validation.
- title: Database operations
  details: Insert, upsert and remove documents.
- title: Middleware
  details: Support for pre and post middleware hooks.
- title: Embedded documents 
  details: Embedded documents with automatic or manual population.
- title: Indexing
  details: Automatic indexing for performant queries using reference lookup documents.
- title: Flexible API
  details: Use either callback or promise based API.
actionLink: /guide/
footer: MIT Licensed | Copyright © 2018 - present Bojan D.
---

```js
var lounge = require('lounge')
lounge.connect({
  connectionString: 'couchbase://127.0.0.1',
  bucket: 'lounge_test'
})

var schema = lounge.schema({ name: String })
var Cat = lounge.model('Cat', schema)

var kitty = new Cat({ name: 'Zildjian' })
kitty.save(function (err) {
  if (err) // ...
  console.log('meow')
})
```
