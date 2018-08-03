# Removing Documents

Removing documents is done using `remove` function that every model instance has. This will execute all pre
'remove' middleware and then perform Couchbase `remove` operation. It will also perform lookup document updates
and finally execute any post hook middleware. By default this function **does not** remove embedded documents. To do
this set `removeRefs` options to `true`.

```js
user.remove(function(err, doc) {
  if(err) console.log(err)
})
```

If we want all subdocuments to be removed:

```js
user.remove(function(err, {removeRefs: true}, doc) {
  if(err) console.log(err)
})
```

This will execute removal, hooks and indexing operations for all documents and subdocuments.

Models have static `remove` function that can be used to perform document removal. 

```js
User.remove('user123', function(err, doc) {
  if(err) console.log(err)
})
```
