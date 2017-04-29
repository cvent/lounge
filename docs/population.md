# Population <a id="population"></a>

`findById` comes with an options parameter that can have one property `populate` that can be used to dictate
if and how we want to get any embedded subdocuments from the database. If `populate` option is `true` all embedded
subdocuments are retrieved from the database.

From our "Embedded Documents" example, if we were to retrieve the user document created:

```js
User.findById(userId, {populate: true}, function(err, doc) {
  console.log(user instanceof User) // true
  console.log(user.address instanceof Address) // true
  console.log(user.posts[0] instanceof BlogPost) // true

  console.log(user) // full user document with retrieved address and posts subdocuments
})
```

We can specify a single field to populate:

```js
User.findById(userId, {populate: 'address'}, function(err, doc) {
  console.log(user instanceof User) // true
  console.log(user.address instanceof Address) // true
  console.log(user.posts[0] instanceof BlogPost) // false
  console.log(user.posts[0] instanceof String) // true - posts is an array of string keys
})
```

```js
User.findById(userId, {populate: 'posts'}, function(err, doc) {
  console.log(user instanceof User) // true
  console.log(user.address instanceof Address) // false
  console.log(user.posts[0] instanceof BlogPost) // true
})
```
Similarly this can also be accomplished by passing `{ populate: { path: 'address' } }` as options.
We can explicitly specify array indexes to populate

```js
User.findById(userId, {populate: 'posts.1'}, function(err, doc) {
  console.log(user instanceof User) // true
  console.log(user.address instanceof Address) // false
  console.log(user.posts[0] instanceof BlogPost) // false
  console.log(user.posts[0] instanceof String) // true
  console.log(user.posts[1] instanceof BlogPost) // true - fully populated
})
```

Additionally, `populate` can accept an array if fields to populate:

```js
User.findById(userId, {populate: ['address', 'posts.1']}, function(err, doc) {
  console.log(user instanceof User) // true
  console.log(user.address instanceof Address) // true - fully populated
  console.log(user.posts[0] instanceof BlogPost) // false
  console.log(user.posts[0] instanceof String) // true
  console.log(user.posts[1] instanceof BlogPost) // true - fully populated
})
```

A special use case might be that we want to populate path `foo` into a target field `bar`. This can be accomplished by
specifying a `target` populate option. For example if we have the following models:

```
var profileSchema = lounge.schema({
  firstName: String,
  lastName: String,
  email: String
})

Profile = lounge.model('Profile', profileSchema)

var ticketSchema = lounge.schema({
  confirmationCode: String,
  profileId: Profile,
  profile: Object
})

Ticket = lounge.model('Ticket', ticketSchema)
```

We can do:

```
Ticket.findById(ticketId, { populate: { path: 'profileId', target:'profile' } }, function(err, ticket) {
  console.log(ticket)
})
```

Sample output:

```
{ confirmationCode: 'ClqwgiWea',
  profileId: '366f4088-8dc6-4223-a418-495ad51d0436',
  profile:
   { firstName: 'Thomas',
     lastName: 'Kennedy',
     email: 'tkennedy1@walmart.com',
     id: '366f4088-8dc6-4223-a418-495ad51d0436' } }
```
