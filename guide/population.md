## Population <a id="population"></a>

`findById` comes with an options parameter that can have one property `populate` that can be used to dictate
if and how we want to get any embedded subdocuments from the database. If `populate` option is `true` all embedded
subdocuments are retrieved from the database.

From our "Embedded Documents" example, if we were to retrieve the user document created:

```js
User.findById(userId, {populate: true}, function(err, doc) {
  console.log(user instanceof User); // true
  console.log(user.address instanceof Address); // true
  console.log(user.posts[0] instanceof BlogPost); // true

  console.log(user); // full user document with retrieved address and posts subdocuments
});
```

We can specify a single field to populate:

```js
User.findById(userId, {populate: 'address'}, function(err, doc) {
  console.log(user instanceof User); // true
  console.log(user.address instanceof Address); // true
  console.log(user.posts[0] instanceof BlogPost); // false
  console.log(user.posts[0] instanceof String); // true - posts is an array of string keys
});
```

```js
User.findById(userId, {populate: 'posts'}, function(err, doc) {
  console.log(user instanceof User); // true
  console.log(user.address instanceof Address); // false
  console.log(user.posts[0] instanceof BlogPost); // true
});
```

We can explicitly specify array indexes to populate

```js
User.findById(userId, {populate: 'posts.1'}, function(err, doc) {
  console.log(user instanceof User); // true
  console.log(user.address instanceof Address); // false
  console.log(user.posts[0] instanceof BlogPost); // false
  console.log(user.posts[0] instanceof String); // true
  console.log(user.posts[1] instanceof BlogPost); // true - fully populated
});
```

Finally, `populate` can accept an array if fields to populate:

```js
User.findById(userId, {populate: ['address', 'posts.1']}, function(err, doc) {
  console.log(user instanceof User); // true
  console.log(user.address instanceof Address); // true - fully populated
  console.log(user.posts[0] instanceof BlogPost); // false
  console.log(user.posts[0] instanceof String); // true
  console.log(user.posts[1] instanceof BlogPost); // true - fully populated
});
```
