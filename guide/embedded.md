## Embedded Documents <a id="embedded"></a>

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
