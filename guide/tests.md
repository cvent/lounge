## Tests

Module automated tests can be run using `npm test` command. The tests are executed using [Couchbase mocking](https://github.com/couchbase/couchnode#mock-testing).
To run tests against an actual local database create a bucket `lounge_test` and remove `LOUNGE_COUCHBASE_MOCK=true` from
`test` script property in `package.json`.

## Credits

Lots of code and design inspired by [Mongoose](http://mongoosejs.com/).
Uses modified code from [node-schema-object](https://github.com/scotthovestadt/node-schema-object) for modeling
available as a separate module [Plaster](https://github.com/bojand/plaster).
Website design based on [koajs.com](http://koajs.com/) design.
