# Array index type

If we can have multiple documents to be indexed by the same value then want the the reference lookup document to
store an array of document keys. This can be accomplished using `'array'` `indexType`.

```js
var userSchema = lounge.schema({
  email: { type: String, key: true, generate: false },
  username: { type: String, index: true, indexType: 'array' }
});
```

Here we *really* mean that multiple users can have the same nickname and we would like to index both. Example:

```js
var user1 = new User({ email: 'bob@gmail.com', nickname: 'bobby' });
var user2 = new User({ email: 'robert@outlook.com', nickname: 'bobby' });
```

When these two documents are indexed the lookup reference document with the key `'$_ref_by_nickname_bobby'` would
actually contain the keys to both our documents and would look like:

```json
"keys": [
  "bob@gmail.com",
  "robert@outlook.com"
]
```

Now if we call `User.findByNickname('bobby', ...)` the result would be 2 `User` instances. Array index types can be
combined within an array field:

```js
var userSchema = lounge.schema({
  email: { type: String, key: true, generate: false },
  usernames: [{ type: String, index: true, indexType: 'array' }]
});
```
