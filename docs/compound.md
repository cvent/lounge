# Compound Indexes

Additionally all of the indexing options can be specified using `index()` function.

```js
var userSchema = lounge.schema({
  name: String,
  username: String,
});

userSchema.index('username', { indexName: 'UserName', refKeyCase: 'upper' });

var User = lounge.model('User', userSchema);

// lookup will be case insensitive because of refKeyCase option
User.findByUserName('uSeRnAmE123', function(err, doc) {
  if(err) console.log(err);
  else console.log(doc);
});
```

The first param to `index()` function is the property name to index on.
If the option is an array of property names, the module will create compound
key indexes. For example if you wanted to index by both "email" _and_ "username"
you could do:

```js
var userSchema = lounge.schema({
  email: String,
  username: String,
});

userSchema.index(['email', 'username']);
var User = lounge.model('User', userSchema);

User.findByEmailAndUsername('joe@gmail.com', 'username123', function(err, doc) {
  if(err) console.log(err);
  else console.log(doc);
});
```

Compound indexes work with all other options as described above.
