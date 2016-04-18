## Schema Extension <a id="extend"></a>

It is useful to have a common base schema, that all other schemas / models would extend or "inherit" properties from.
This can be accomplished by using the `Schema.extend` function. When used all properties, virtuals,
methods, statics, and middleware that are present in the base schema **but not** present in destination schema are copied
into the destination schema.

```js
 var baseSchema = lounge.schema({
  metadata: {
    doc_type: String,
    createdAt: Date,
    updatedAt: Date
  }
});

baseSchema.pre('save', function (next) {
  if (!this.metadata) {
    this.metadata = {};
  }

  var now = new Date();

  if (!this.metadata.createdAt) {
    this.metadata.createdAt = now;
  }

  this.metadata.updatedAt = now;
  this.metadata.doc_type = this.modelName;

  next();
});

baseSchema.method('baseFoo', function () {
  console.log('base foo');
});

var userSchema = lounge.schema({
  name: String,
  email: String,
});

userSchema.pre('save', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  next();
});

userSchema.method('userFoo', function () {
  console.log('user foo');
});

// make user schema extend the base schema
userSchema.extend(baseSchema);
var User = lounge.model('User', userSchema);

user = new User({
  name: 'Bob Smith',
  email: 'BSmith@gmail.com'
});

user.baseFoo() // prints 'base foo'
user.userFoo() // prints 'user foo'

user.save(function(err, savedDoc) {
  console.log(user.metadata.updatedAt); // Sat Dec 29 2015 03:30:00 GMT-0400 (AST)
  console.log(user.metadata.doc_type); // 'user'
  console.log(user.email); // 'bsmith@gmail.com'
});
```
