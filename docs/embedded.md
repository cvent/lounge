# Embedded Documents <a id="embedded"></a>

Lounge allows for embedding and referencing other Models within schema.

```js
const addressSchema = lounge.schema({
  street: String,
  city: String,
  country: String
})

const Address = lounge.model('Address', addressSchema)

const blogPostSchema = lounge.schema({
  title: String,
  body: String
})

const BlogPost = lounge.model('BlogPost', blogPostSchema)

const userSchema = lounge.schema({
  name: String,
  address: Address,
  posts: [BlogPost]
})

const User = lounge.model('User', userSchema)

const post = new BlogPost({
  title: 'Foo',
  body: 'Lorem ipsum'
})

var user = new User({
  name: 'Bob Smith',
  posts: [post],
  address: new Address({
    street: '123 Fake Street',
    city: 'Springfield',
    country: 'USA'
  })
})

user.posts.push(new BlogPost({
  title: 'Post 2',
  body: 'Some more text!'
}))
```

You can manipulate and work with subdocument just like any model instances. When the top level document is saved
all child subdocuments are saved as well. Subdocuments **must** be an instance of the Model defined in the schema or a
`String` in which case it represents the key / id of the subdocument.

If needed we can also specify embedded document type of a model that is not defined yet. For example:

```js
var siteSchema = lounge.schema({
  owner: {type: lounge.Model, modelName: 'User'},
  url: String
})

var Site = lounge.model('Site', siteSchema)

var userSchema = lounge.schema({
  email: String,
  name: String
})

var User = lounge.model('User', userSchema)

var user = new User({
  name: 'Joe Smith',
  email: 'jsmith@gmail.com'
})

var site = new Site({
  url: 'http://wwww.mysite.org',
  owner: user
})
```
