# Events <a id="events"></a>

All model instances inherit [`EventEmitter`](https://nodejs.org/api/events.html#events_class_events_eventemitter), and
emit four events:

* `index` - when indexing of lookup document is successfully finished.
* `save` - when the document was successfully saved.
* `remove` - when the document was successfully removed.
* `error` - when an error happened when performing an action.

All "success" event handers take arguments `(document, options)`. `document` is the instance of document that the action was
performed on, and `options` are the options used for the action. When an `'error'` event occurs the handler takes arguments
`(error, document)`, where `error` is an `Error` instance and `document` is the document instance of the context.

```js
var userSchema = lounge.schema({
  name: String,
  email: { type: String, index: true }
})

var User = lounge.model('User', userSchema)
var user = new User({
  name: 'Bob Smith',
  email: 'bob@gmail.com'
})

user.on('index', function (doc) {
  console.log('indexed document: ' + doc.id)
})

user.on('remove', function (doc) {
  console.log('document removed')
})

user.on('save', function (doc) {
  console.log('document saved')
})
```

Similarly, the generated Model classes emit events when actions happen for any model instance of that type.

```js
var userSchema = lounge.schema({
  name: String,
  email: { type: String, key: true, generate: false }
})

var User = lounge.model('User', userSchema)

User.on('index', function (doc, options) {
  console.log('indexed User document: ' + doc.id)
})

User.on('save', function (doc, options) {
  console.log('saved User document: ' + doc.id)
})

User.on('remove', function (doc, options) {
  console.log('removed User document: ' + doc.id)
})

var user = new User({
  name: 'Bob Smith',
  email: 'bob@gmail.com'
})

user.save() // prints 'saved User document: bob@gmail.com'
```

Finally, the `lounge` object itself is an instance of `EventEmitter` that emits events when actions happen
for any model instance of any type:

```js
lounge.on('index', function (doc, options) {
  console.log('indexed ' + doc.modelName + ' document: ' + doc.id)
})

lounge.on('save', function (doc, options) {
  console.log('saved ' + doc.modelName + ' document: ' + doc.id)
})

lounge.on('remove', function (doc, options) {
  console.log('removed ' + doc.modelName + ' document: ' + doc.id)
})

var userSchema = lounge.schema({
  name: String,
  email: { type: String, key: true, generate: false }
})

var User = lounge.model('User', userSchema)
var user = new User({
  name: 'Bob Smith',
  email: 'bob@gmail.com'
})

user.save() // prints 'saved User document: bob@gmail.com'
```

Errors are emitted by default, but if you do not have listeners attached, they will manifest as uncaught exceptions in your application.
Error emitting can be disabled via your the config on your lounge instance (the other emit types will not be impacted):

```js
const lounge = new Lounge({emitErrors: false});

// or
const lounge = new Lounge();
lounge.setOption('emitErrors', false);
```