## Middleware <a id="middleware"></a>

Similar to Mongoose middleware, Lounge exposes `pre` and `post` [hooks](https://www.npmjs.com/package/hooks-fixed).
Normally this is used to do additional validation pre save, and cleanup post document removal. Although the hooks can be
setup for any method including `toObject` and `toJSON` methods.


```js
var userSchema = lounge.schema({
  firstName: String,
  lastName: String,
  email: String
});

userSchema.pre('save', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  // we must call next to continue control flow
  next();
});

userSchema.post('remove', function () {
  console.log('document %s removed', this.id);
});
```

Important note here is that `post` 'save' and 'remove' hooks do not receive any form of control flow. There are no
callbacks passed.

The callback passed into `pre` hooks can be used to control flow of logic and execution:

```js
schema.pre('save', function (next) {
  // some custom validation method
  if (!this.validate()) {
    return next(new Error('Validation error!'));
  }

  next();
});

// elsewhere...

doc.save(function(err, savedDoc) {
  if(err) console.log(err); // 'Validation error!' Document was not saved
});
```

**onBeforeValueSet(key, value) / onValueSet(key, value)**

`onBeforeValueSet` / `onValueSet` allow you to bind an event handler to all write operations on an object.
Currently, it will only notify of write operations on the object itself and will not notify you when child objects are
written to. If you return `false` or throw an error within the `onBeforeValueSet` handler, the write operation will be
cancelled. Throwing an error will add the error to the error stack.

```js
var User = lounge.schema({ name: String }, {
  onBeforeValueSet: function(key, value) {
    if(key === 'name' && value.indexOf('Joe') === -1) {
      return false;
    });
  }
});

var User = lounge.model('User', schema);
var user = new User();
user.name = 'Bill'; // { name: undefined }
user.name = 'Joe Smith'; //  { name: 'Joe Smith' }
```
