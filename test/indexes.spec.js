var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model index tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge.Lounge(); // recreate it

    var cluster = new couchbase.Mock.Cluster('couchbase://127.0.0.1');
    bucket = cluster.openBucket('lounge_test', function (err) {
      lounge.connect({
        bucket: bucket
      }, done);
    });
  });

  it('should create index values for a simple document', function () {
    var userSchema = new lounge.Schema({
      firstName: String,
      lastName: String,
      email: {type: String, index: true}
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com'
    });

    var expected = [{
      path: 'email',
      value: 'joe@gmail.com',
      name: 'email'
    }];

    expect(user.$_refValues).to.deep.equal(expected)
  });

  it('should create index values for array', function () {
    var userSchema = new lounge.Schema({
      firstName: String,
      lastName: String,
      usernames: [{type: String, index: true, indexName: 'username'}]
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      usernames: ['user1', 'user2']
    });

    var expected = [{
      path: 'usernames',
      value: 'user1',
      name: 'username'
    }, {
      path: 'usernames',
      value: 'user2',
      name: 'username'
    }];

    expect(user.$_refValues).to.deep.equal(expected)
  });

  it('should create index value for a ref field', function () {
    var fooSchema = new lounge.Schema({
      a: String,
      b: String
    });

    var Foo = lounge.model('Foo', fooSchema);

    var userSchema = new lounge.Schema({
      firstName: String,
      lastName: String,
      email: {type: String, index: true},
      foo: {type: Foo, index: true}
    });

    var User = lounge.model('User', userSchema);

    var foo = new Foo({
      a: 'a1',
      b: 'b1'
    });

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      foo: foo
    });

    var expected = _.sortBy([
      {
        path: 'email',
        value: 'joe@gmail.com',
        name: 'email'
      },
      {
        path: 'foo',
        value: foo.id,
        name: 'foo'
      }
    ], 'path');

    var actual = _.sortBy(user.$_refValues, 'path');

    expect(actual).to.deep.equal(expected)
  });

  it('should create index value for a ref field respecing key config', function () {
    var fooSchema = new lounge.Schema({
      a: {type: String, key: true, generate: false},
      b: String
    });

    var Foo = lounge.model('Foo', fooSchema);

    var userSchema = new lounge.Schema({
      firstName: String,
      lastName: String,
      email: {type: String, index: true},
      foo: {type: Foo, index: true}
    });

    var User = lounge.model('User', userSchema);

    var foo = new Foo({
      a: 'a1',
      b: 'b1'
    });

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      foo: foo
    });

    var expected = _.sortBy([
      {
        path: 'email',
        value: 'joe@gmail.com',
        name: 'email'
      },
      {
        path: 'foo',
        value: foo.a,
        name: 'foo'
      }
    ], 'path');

    var actual = _.sortBy(user.$_refValues, 'path');

    expect(actual).to.deep.equal(expected)
  });
});