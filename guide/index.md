### Setup <a id="lounge"></a>

```js
var lounge = require('lounge');
```

Module exports an instance of `Lounge` class.

#### Lounge(options)

Creates a new instance of `Lounge` class. You rarely have to do this.

```js
var lounge = require('lounge');
var l = new lounge.Lounge();
```

**Options**

* `keyPrefix` - key prefix for all keys. No default. Generally useful if you wish to namespace documents. 
Example: `app::env::`.
* `storeFullReferenceId` - whether to store embedded document keys as fully expanded keys 
(with prefix and suffix applied) or just the minimized version. default: `false`. 
* `storeFullKey` - Similarly, to store the fully expanded document key inside the key property. default: `false`
* `alwaysReturnArrays` - set to true to force `findyById` to always return an array of documents even if only
a single key is passed in. Default: `false`
* `refIndexKeyPrefix` - reference lookup index document key prefix. The name of the index is appended to this.
Default: `'$_ref_by_'`
* `delimiter` - delimiter string used for concatenation in reference document key expansion / generation. default: `'_'` 
This is prepended to the reference document key.
* `waitForIndex` - When documents are saved, indexes are updated. We can wait for this operation to finish before 
returning from `save()`. Default: `false`
* `minimize` - "minimize" schemas by removing empty objects. Default: `true`

Any of these options, or additional variables can be manipulated using the `setOption` and `getOption` methods.
  
```js
var lounge = require('lounge');
lounge.setOption('alwaysReturnArrays', true);
console.log(lounge.getOption('alwaysReturnArrays');
```

#### Lounge.connect(options, fn, mock)

Connects to the database cluster based on `options`. When completed calls `fn` callback. Set `mock` to `true` to use
[Couchbase mocking](https://github.com/couchbase/couchnode#mock-testing). Alternatively you can set
`LOUNGE_COUCHBASE_MOCK` environment variable. Returns an instance of Couchbase `bucket`.

**Options**

* `connectionString` - connection string for the cluster. See [Cluster documentation](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html).
* `bucket` - name of the bucket to be used for [`openBucket`](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html#openBucket)
or the actual, already connected, Couchbase `bucket` instance.
* `password` - password for [`openBucket`](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html#openBucket)
* `certpath` - certpath for [cluster constructor](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Cluster.html).

```js
var lounge = require('lounge');
var bucket = lounge.connect({ 
  connectionString: 'couchbase://127.0.0.1',
  bucket: 'lounge_test'
}, function(err, bucket) {
  // ... connected
});
```

#### Lounge.disconnect()

Disconnect from the bucket. Deletes all defined models.

#### Lounge.schema(descriptor, options)

Creates a new `Schema` based on `descriptor` and `options`. Prefer this over the actual `Schema` constructor as this
will pass lounge config variables to the `Schema` constructor automatically. 

Schema construction options:

* `keyPrefix` - key prefix for all keys. No default. Generally useful if you wish to namespace documents. Example: `app::env::`.
* `keySuffix` - Similar as prefix but used as a suffix
* `refIndexKeyPrefix` - reference lookup index document key prefix. The name of the index is appended. Default: '$_ref_by_'
Reference / lookup document keys are also treated using `keyPrefix` and `keySuffix` settings.  
* `delimiter` - delimiter string used for concatenation in reference document key expansion / generation.
Default: '_'. This is prepended to the reference document key.
* `minimize` - "minimize" schemas by removing empty objects. Default: `true`
* `toObject` - toObject method options: `transform`, `virtuals` and `minimize`
* `toJSON` - toJSON method options, similar to above
* `strict` - ensures that value passed in ot assigned that were not specified in our schema do not get saved. Default: `true`

#### Lounge.model(name, schema, options)

Defines a Model based on case sensitive model `name` and created `schema`, with given options. From there we can create
instances of the Model;

**Options**

* `freeze` - to freeze the model. See `Object.freeze`. Default: `true`

```js
var userSchema = lounge.schema({
  firstName: String,
  lastName: String,
  email: String,
  dateOfBirth: Date,
});

User = lounge.model('User', userSchema);
var user = new User({
  firstName: 'Joe',
  lastName: 'Smith',
  email: 'joe@gmail.com',
  dateOfBirth: new Date()
});

console.log(user instanceof User) // true
```

#### Lounge.modelNames()

Returns and array of all defined model names.

#### Bucket functions

Lounge instance also inherits all public [`Bucket`](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.2/Bucket.html)
 functions and properties.
 
```js
lounge.get('mydocumentkey', function(err, res) {
  // .. save as if we did normal bucket.get()
});
```

#### Lounge.Schema

Exported `Schema` constructor. You can use this as well as `lounge.schema()`, which is preferred.

```js
var userSchema = new lounge.Schema({ name: String });
```

#### Lounge.Model

Exported `Model` constructor. You should never have to manually create a Model.

#### Lounge.Document

Exported  internal `Document` constructor. You should never have to manually create a Document.
 
```js
// already defined User model
var user = new User({name: 'Bob'});
console.log(user instanceof User) // true
console.log(user instanceof lounge.Model) // true
console.log(user instanceof lounge.Document) // true
```