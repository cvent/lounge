# Index queries <a id="queries"></a>

Any indexed property the Model will automatically get a `findBy*` static function for easier lookup.
For example code above:

```js
var User = lounge.model('User', userSchema)

User.findByEmail('joe@gmail.com', function(err, doc) {
  if(err) console.log(err)
  else console.log(doc)
})
```

We automatically singularize and camelize property key to derive the index name. So `usernames` becomes `findByUsername`.
We can specify the index "name" by passing along the `indexName` property. For example:

```js
var userSchema = lounge.schema({
  name: String
  usernames: [{ type: String, index: true, indexName: 'UN' }]
})

var User = lounge.model('User', userSchema)

User.findByUN('user1', function(err, doc) {
  if(err) console.log(err)
  else console.log(doc)
})
```

### Reference document errors

For example lets say we have a reference document `'$_ref_by_email_joe@gmail.com'`:

```json
{ "key": "2ba8a471-063b-420a-aa83-31debe58f46f" }
```

If the document with key does not exist `"2ba8a471-063b-420a-aa83-31debe58f46f"` the index query function (ie. `User.findByEmail`) will still return with both `err` and `document` params being undefined. In this scenario we do log debug warning with the problematic ids.

Additionally we can set `errorOnMissingIndex` property to `true` in `lounge` config options or in the query options and the query will then fail with error.

```js
var User = lounge.model('User', userSchema)

// set global option to error on all calls
lounge.setOption('errorOnMissingIndex', true)

User.findByEmail('joe@gmail.com', function(err, doc) {
  // assuming target document is not found
  console.error(err)  // print out the error stack with error message
  console.error(err.reference) // the reference document id(s)
  console.error(err.missing) // the missing document id(s)
})
``` 

Similary we can just choose a single call invocation to fail:

```js
var User = lounge.model('User', userSchema)

User.findByEmail('joe@gmail.com', { errorOnMissingIndex: true }, function(err, doc) {
  // assuming target document is not found
  console.error(err)  // print out the error stack with error message
  console.error(err.reference) // the reference document id(s)
  console.error(err.missing) // the missing document id(s)
})
``` 
