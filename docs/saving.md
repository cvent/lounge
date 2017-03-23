# Saving Documents <a id="saving"></a>

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
