## API Documentation

#### [Document](document.js.html)

Base `Document` class. Represents an instance of a model. Handles all generic model functionality.

#### [CouchbaseDocument](couchdoc.js.html)

`CouchbaseDocument` class inherits from Document and handles all the database related functionality of a Model.

#### [Model](model.js.html)

`Model` inherits from `CouchbaseDocument` and is the base of all Models created using Lounge. 
This also has the Model creation functions.

#### [Schema](schema.js.html)

`Schema` class.

#### [Driver](driver.js.html)

Internal database driver utility that wraps Couchbase `Bucket` class and overrides some database functions.

#### [Lounge](index.js.html)

Lounge class is the main class of the module.

#### [Tree](tree.js.html)

Represent Tree structure of a `Schema`.

#### [Type](type.js.html)

Type class representation of a type within a schema definition.

#### [Utils](utils.js.html)

Utility functions.