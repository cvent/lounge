# Index queries <a id="queries"></a>

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
  usernames: [{ type: String, index: true, indexName: 'UN' }]
});

var User = lounge.model('User', userSchema);

User.findByUN('user1', function(err, doc) {
  if(err) console.log(err);
  else console.log(doc);
});
```
