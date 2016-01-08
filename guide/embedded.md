### Embedded Documents <a id="embedded"></a>

Lounge allows for embedding and referencing other Models within schema.

```js
var addressSchema = lounge.schema({
  street: String,
  city: String,
  country: String
});

var Address = lounge.model('Address', addressSchema);

var blogPostSchema = lounge.schema({
  title: String,
  body: String,
});

var BlogPost = lounge.model('BlogPost', blogPostSchema);

var userSchema = lounge.schema({
  name: String,
  address: Address,
  posts: [BlogPost]
});

var post = new BlogPost({
  title: 'Foo',
  body: 'Lorem ipsum'
});

var user = new User({
  name: 'Bob Smith',
  posts: [post],
  address: new Address({
    street: '123 Fake Street',
    city: 'Springfield',
    country: 'USA'
  })
});

user.posts.push(new BlogPost({
  title: 'Post 2',
  body: 'Some more text!'
});
```

You can manipulate and work with subdocument just like any model instances. When the top level document is saved
all child subdocuments are saved as well. Subdocuments **must** be an instance of the Model defined in the schema or a 
`String` in which case it represents the key / id of the subdocument.

### Saving Documents <a id="saving"></a>

Saving documents is done using `save` function that every model instance has. This will execute all pre 
'save' middleware and then perform Couchbase `upsert` operation on any subdocuments and the actual document. It will also
perform lookup document updates and finally execute any post hook middleware.

From our example code above:

```js
user.save(function(err, savedDoc) {
  if(err) console.log(err);
});
```

All documents and subdocuments would be upserted into the database.

**Model.save(data, options, fn)**

`data` - any data to be set into the model before saving.

**options**

All options not present here are first looked up from schema options, and then from config options.
* `storeFullReferenceId` - whether to save embedded document property values as full document keys or just the base value
* `storeFullKey` - whether to save the internal document key property as fully expanded value or as the simple value
* `refIndexKeyPrefix` - lookup index document key prefix.
* `waitForIndex` - whether we want to wait for indexing to finish before returning. default is false.
* `virtuals` - whether we want to save virtuals. default is `false`.
* `minimize` - to "minimize" the document by removing any empty properties. Default: `true`
* `expiry` - couchbase upsert option
* `persist_to` - couchbase persist_to option
* `replicate_to` - couchbase option