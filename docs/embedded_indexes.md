# Indexing on embedded documents

Finally, indexing can be accomplished on embedded documents.

```js
var companySchema = lounge.schema({
  id: { type: String, key: true, generate: false },
  name: String
});

var userSchema = lounge.schema({
  email: { type: String, key: true, generate: false },
  company: { type: Company, index: true }
});

// ...

var company = new Company({ id: 'acme_inc.', name: 'Acme Inc.' });
var user = new User({ email: 'bob@gmail.com', company: company });
```

Here a lookup reference document will be created with key `'$_ref_by_company_acme_inc.'` and it will link to our `User`
document:

```json
{ "key": "bob@gmail.com" }
```

We can use `User.findByCompany(company.id, ...)` to get the `User` instance.

This example probably doesn't make much sense in real world. Multiple users can be associated with the same company,
so we really should use the `'array'` index type.

```js
var companySchema = lounge.schema({
  id: { type: String, key: true, generate: false },
  name: String
});

var userSchema = lounge.schema({
  email: { type: String, key: true, generate: false },
  company: { type: Company, index: true, indexType: 'array' }
});

// ...

var company = new Company({ id: 'acme_inc.', name: 'Acme Inc.' });
var user1 = new User({ email: 'bob@gmail.com', company: company });
var user2 = new User({ email: 'joe@outlook.com', company: company });
```

Here now the company lookup reference document will have contents:

```json
"keys": [
  "bob@gmail.com",
  "joe@outlook.com"
]
```

We can use `User.findByCompany(company.id, ...)` to get both `User` instances.
