### TODO 

* README
* Break up docs into separate files / sections and provide deeper documentation and examples.
* Improve full API documentation.
* Improve comments and documentation.
* Improve `EventEmitter` utilization.
* Add `EventEmitter` interface to Model constructor to catch events on all instances. 
* Add `'error'` events.
* Add `debug()` logging and `debug` config option.
* Fix `Schema` constructor so that it picks up config values for the lounge object.
* Add config option to specify `Date` format for saving.
* More tests and improve coverage. 
  - getDocumentKeyValue and getRefKey tests with different configs and settings.
  - For example tests for different configs such as prefixes, array, minimize, strict, etc...
  - More fail tests.
* Optimize.
* Add `isNew`?
* Change from `hooks-fixed` to `Kareem` (Doesn't seem useful or practical)?
* Fix transforms for inline options (see skipped tests)?
* Add db cas support to save() somehow?
* Add db cas support to remove() somehow?
* Add sample Express API application.
* Add promises?
* Make model name case-insensitive?

