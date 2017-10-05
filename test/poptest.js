const lounge = require('../')
lounge.connect({
  connectionString: 'couchbase://127.0.0.1',
  bucket: 'lounge_test'
}, (e_, bucket) => {
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

  user.save((e_, savedUser) => {
    User.findById(savedUser.id, { populate: true }, (e_, doc) => {
      const post2 = new BlogPost({
        title: 'Another post',
        body: 'Texting'
      })

      var user2 = new User({
        name: 'Kate R',
        posts: [post2],
        address: new Address({
          street: '2nd Street',
          city: 'Freddy',
          country: 'USA'
        })
      })

      user2.posts.push(new BlogPost({
        title: 'Post 3',
        body: '2nd users 2nd post'
      }))

      user2.save((e_, savedUser2) => {
        User.findById([savedUser.id, savedUser2.id], { populate: ['address', 'posts.1'] }, (e_, docs) => {
          console.dir(docs, {depth: 3, colors: true})
          process.exit(0)
        })
      })
    })
  })
})
