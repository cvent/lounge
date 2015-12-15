### TODO 

* Change from hooks to Kareem
* Add EventEmitter interface and events for documents and actions.
* Add init and `isNew`.
* Improve pre and post middleware so that at least with post 'remove' middleware we pass the doc, and no callback. Like Mongoose.
* Add indexing via ref documents
* Fix transforms for inline options.
* Add config option to specify `Date` format for saving.
* Add db cas support to save() somehow
* Add db cas support to remove() somehow
