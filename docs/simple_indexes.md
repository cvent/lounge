# Simple Indexes <a id="indexes"></a>

Lounge provides Indexing mechanism using [reference lookup documents](http://docs.couchbase.com/developer/dev-guide-3.0/lookups.html).
This allows us to set up simple lookups for easier document retrieval where we do not need to do create view
indexes. Specifying an index property is done at schema level:

```js
var userSchema = lounge.schema({
  name: String,
  email: { type: String, index: true }
})
```

Here we wish `User` models to have their own `id` as document key, but we want to be able to look up documents via email
as well as that is also unique property for users. Lounge will automatically manage (remove and upsert) lookup documents,
as user is `saved` or `removed`.

```js
var user = new User({
  name: 'Joe Smith',
  email: 'joe@gmail.com'
})

user.save()
```

This will create the a lookup document similar to:

```json
{ "key": "2ba8a471-063b-420a-aa83-31debe58f46f" }
```

with document key `'$_ref_by_email_joe@gmail.com'`. We can manipulate this behaviour using schema options.

```js
var userSchema = lounge.schema({
  name: String,
  email: { type: String, index: true }
}, {
  keyPrefix: 'user::',
  delimiter: '::'
})
```

Saving a document defined with this schema will save user document with key `'user::5c4bfd6d-9c80-452b-be3a-3e528e4f53f5'`
and will save a lookup document with key `'user::$_ref_by_email::joe@gmail.com'`. Setting `refIndexKeyPrefix` can add
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
  usernames: [{ type: String, index: true }]
})
```

A lookup document will be generated for each value in the array. Index lookup properties have to be of type `String` or
`Number`.

Index lookup documents are automatically managed by lounge when documents are saved and removed using `save()` and
`remove()` functions. You can also manually kick of this process by calling `index()` function on any model instance.

You can control reference document key casing using `refKeyCase` option. Options are `'upper'` or `'lower'`.
This will make query lookups case insensitive.


Couchbase keys can only be 250 bytes, so if a lookup document key is too long, its index values will be hashed and the prefix `hashed_` will precede the hashed value.

```js
var userSchema = lounge.schema({
  name: String,
  email: { type: String, index: true }
})

var user = new User({
  name: 'Joe Smith',
  email: 'joesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmithjoesmith@gmail.com'
})

user.save()
```

will result in lookup document key `$_ref_by_email_hashed_ac2685991d01d0f4a308d528868e8b9b`.
