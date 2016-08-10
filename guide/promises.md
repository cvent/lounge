## Promises <a id="promises"></a>

Lounge implements [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) support
using the [Bluebird](bluebirdjs.com) module for all async operations. We support callback-style and Promise-style API, but you should not mix and use both at the same time. If a callback is provided a promise is not returned and normal callback-style
control flow happens. If no callback is provided a promise is returned, of course you do not have to do anything with it if you do not care about the result of an operation. Promise support can be completely turned off using `promisify` configuration setting within the Lounge object. Simple example for ES6:

```js
const lounge = require('lounge');

const createUserSchema = () => {
  return lounge.schema({
    firstName: String,
    lastName: String,
    email: String
  });
};

const createUser = User => {
  return new User({
    firstName: 'Joe',
    lastName: 'Smith',
    email: 'joe@gmail.com'
  });
};

const connOpts = {
  connectionString: 'couchbase://127.0.0.1',
  bucket: 'lounge_test'
};

lounge.connect(connOpts)
  .then(createUserSchema)
  .then(schema => lounge.model('User', schema))
  .then(createUser)
  .then(user => user.save())
  .then((savedDoc) => {
    console.log(`User instance ${savedDoc.id} saved.`);
  }).catch(e => {
    console.error(e);
  });
```

With [Babel](https://babeljs.io/) we can use JavaScript features not available in Node yet, like `async / await` for async control.

```js
await lounge.connect({
  connectionString: 'couchbase://127.0.0.1',
  bucket: 'lounge_test'
});

const schema = lounge.schema({
  firstName: String,
  lastName: String,
  email: String
});

const User = lounge.model('User', schema);

const user = new User({
  firstName: 'Joe',
  lastName: 'Smith',
  email: 'joe@gmail.com'
});

const doc = await user.save();
console.log(`User instance ${doc.id} saved.`);
```
