# Lean Queries

Sometimes we may only be interested in the index key value(s), and we do not actually wish to get the target document(s)
and create the model instances. This can be accomplished using `lean` option:

```js
var userSchema = lounge.schema({
  name: String,
  email: { type: String, index: true }
});

// ...

User.findByEmail('joe@gmail.com', { lean: true }, function(err, rdoc) {
  console.log(rdoc); // '8bfda30c-604f-495c-a945-4c2e5ad123ad'
});
```

This also works with array types:

```js
var userSchema = lounge.schema({
  name: String,
  email: { type: String, index: true, indexType: 'array' }
});

// ...

User.findByEmail('joe@gmail.com', { lean: true }, function(err, rdoc) {
  console.log(rdoc); // [ '4c2e5ad1-604f-495c-a945-8bfda30c23ad', 'b81134d5-24ac-408b-b2d6-40a33a057f50' ]
});
```

And similarly with embedded documents:

```js
var companySchema = lounge.schema({
  name: String,
  address: String
});

Company = lounge.model('Company', companySchema);

var userSchema = lounge.schema({
  firstName: String,
  lastName: String,
  email: {type: String, key: true, generate: false},
  company: {type: Company, index: true}
});

User = lounge.model('User', userSchema);

// ...

User.findByCompany(companyId, { lean: true }, function(err, rdoc) {
  console.log(rdoc); // joe@gmail.com
});
```
