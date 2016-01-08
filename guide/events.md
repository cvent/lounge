### Events <a id="events"></a>

All model instances inherit [`EventEmitter`](https://nodejs.org/api/events.html#events_class_events_eventemitter), and 
emit three events:

* `index` - when indexing of lookup documents finished regardless if successful or not. Emits `error` if there was any.
* `save` - when the document was successfully saved.
* `remove` - when the document was successfully removed.

```js
var userSchema = lounge.schema({
  name: String,
  email: {type: String, index: true}
});

var User = lounge.model('User', userSchema);
var user = new User({
  name: 'Bob Smith',
  email: 'bob@gmail.com'
});

user.on('index', function (err) {
  if(err) console.log('Error indexing document' + err.message);
});

user.on('remove', function (doc) {
  console.log('document removed');
});

user.on('save', function (doc) {
  console.log('document saved');
});
```