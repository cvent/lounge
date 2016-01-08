### Indexes <a id="indexes"></a>

Lounge provides Indexing mechanism using [reference lookup documents](http://docs.couchbase.com/developer/dev-guide-3.0/lookups.html).
This allows us to set up simple one to one lookups for easier document retrieval where we do not need to do create view
indexes. Specifying an index property is done at schema level:

```js
var userSchema = lounge.schema({
  name: String,
  email: {type: String, index: true}
});
```

Here we wish `User` models to have their own `id` as document key, but we want to be able to look up documents via email
as well as that is also unique property for users. Lounge will automatically manage (remove and upsert) lookup documents,
as user is `saved` or `removed`. 
 
```js
var user = new User({
  name: 'Joe Smith',
  email: 'joe@gmail.com'
});

user.save();
```

This will create the a lookup document similar to:

```
{ key: '2ba8a471-063b-420a-aa83-31debe58f46f' }
```

with document key `'$_ref_by_email_joe@gmail.com'`. We can manipulate this behaviour using schema options.

```js
var userSchema = lounge.schema({
  name: String,
  email: {type: String, index: true}
}, {
  keyPrefix: 'user::',
  delimiter: '::'
});
```

Saving a document defined with this schema will save user document with key `'user::5c4bfd6d-9c80-452b-be3a-3e528e4f53f5'`
and will save a lookup document with key `''user::$_ref_by_email::joe@gmail.com'`. Setting `refIndexKeyPrefix` can add
additional customization.

```js
{
  keyPrefix: 'user::',
  delimiter: '::',
  refIndexKeyPrefix: 'lookup_by_'
}
```
This will result in lookup document key `user::lookup_by_email::joe@gmail.com`.

Indexes can also be arrays:

```js
var userSchema = lounge.schema({
  name: String
  usernames: [{type: String, index: true}]
});
```

A lookup document will be generated for each value in the array. Index lookup properties have to be of type `String` or
`Number`.

Index lookup documents are automatically managed by lounge when documents are saved and removed using `save()` and
`remove()` functions. You can also manually kick of this process by calling `index()` function on any model instance.

#### Index queries <a id="queries"></a>

Any indexed property the Model will automatically get a `findBy*` static function for easier lookup. 
For example code above:

```js
var User = lounge.model('User', userSchema);

User.findByEmail('joe@gmail.com', function(err, doc) {
  if(err) console.log(err);
  else console.log(doc);
});
```

We automatically singularize and camelize property key to derive the index name. So `usernames` becomes `findByUsername`.
We can specify the index "name" by passing along the `indexName` property. For example:

```js
var userSchema = lounge.schema({
  name: String
  usernames: [{type: String, index: true, indexName: 'UN'}]
});

var User = lounge.model('User', userSchema);

User.findByUN('user1', function(err, doc) {
  if(err) console.log(err);
  else console.log(doc);
});
```