# Glossary

This is a glossary of the core terms within Lounge.

## Schema

A schema defines all the properties, methods and behavior of a model. Schemas can extend other schemas and inherit
properties, methods and middleware.

## Model

Models are generated from schemas and represent implementation for interacting with the database.

## Document Key

A document must have a primary key. It is used to look up the document within the database. If a key property
isn't specified within a model schema, Lounge automatically creates one named `id`.

## Middleware

Functions that happen before and after certain actions, for example before saving a document, or after removing
a document from a database.

## Index

A mechanism for looking up documents by means other than primary key / id. Currently Lounge itself only supports
automatic indexing and lookup using [reference lookup documents](http://docs.couchbase.com/developer/dev-guide-3.0/lookups.html).
Other indexing can be accomplished using [views](http://developer.couchbase.com/documentation/server/4.5/indexes/cb-view-api.html)
and [N1QL](http://developer.couchbase.com/documentation/server/4.5/indexes/n1ql-in-couchbase.html). These can be easily
added to models and lounge by using existing functionality and extending it.

## Reference documents

Index documents used to look up the a document by a property other than the document's primary key. For example
a document may have a key that is a `UUID` but it can also be unique via an `email` property. We can have a reference
document whose key is based on the email address and can be looked up using the email address but its contents only store
the actual documents real key / id. This way we get the actual document with 2 document lookups, rather than a view
or N1QL query.

## Embedded document

Model schemas can reference other models within them. In such scenario's only a reference to one document is
saved within the other. Then actual contents are two different documents, linked only by a reference using the document
key.

## Population

Lounge can automatically look up and populate embedded referenced documents so that they are populated within the parent
document.
