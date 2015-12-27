var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe.only('Model index tests', function () {
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

  describe('initial ref value and function creation tests', function () {
    it('should create index values for a simple document', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: {type: String, index: true}
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByEmail).to.be.ok;
      expect(User.findByEmail).to.be.an.instanceof(Function);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com'
      });

      var expected = {
        email: {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email'
        }
      };

      expect(user.$_refValues).to.deep.equal(expected)
    });

    it('should create index values for array', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{type: String, index: true, indexName: 'username'}]
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByUsername).to.be.ok;
      expect(User.findByUsername).to.be.an.instanceof(Function);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        usernames: ['user1', 'user2']
      });

      var expected = {
        'username': {
          path: 'usernames',
          value: ['user1', 'user2'],
          name: 'username'
        }
      };

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
        foo: {type: Foo, index: true, ref: 'Foo'}
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByEmail).to.be.ok;
      expect(User.findByEmail).to.be.an.instanceof(Function);
      expect(User.findByFoo).to.be.ok;
      expect(User.findByFoo).to.be.an.instanceof(Function);

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

      var expected = {
        'email': {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email'
        },
        'foo': {
          path: 'foo',
          value: foo.id,
          name: 'foo'
        }
      };

      expect(user.$_refValues).to.deep.equal(expected)
    });

    it('should create index value for a ref field respecting key config', function () {
      var fooSchema = new lounge.Schema({
        a: {type: String, key: true, generate: false},
        b: String
      });

      var Foo = lounge.model('Foo', fooSchema);

      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: {type: String, index: true},
        foo: {type: String, index: true, ref: 'Foo'}
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByEmail).to.be.ok;
      expect(User.findByEmail).to.be.an.instanceof(Function);
      expect(User.findByFoo).to.be.ok;
      expect(User.findByFoo).to.be.an.instanceof(Function);

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

      var expected = {
        'email': {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email'
        },
        'foo': {
          path: 'foo',
          value: foo.a,
          name: 'foo'
        }
      };

      expect(user.$_refValues).to.deep.equal(expected)
    });

    it('should create index value for untruthy values', function () {
      var fooSchema = new lounge.Schema({
        a: {type: String, key: true, generate: false},
        b: String
      });

      var Foo = lounge.model('Foo', fooSchema);

      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: {type: String, index: true},
        foo: {type: Foo, index: true, ref: 'Foo'}
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByEmail).to.be.ok;
      expect(User.findByEmail).to.be.an.instanceof(Function);
      expect(User.findByFoo).to.be.ok;
      expect(User.findByFoo).to.be.an.instanceof(Function);

      var foo = new Foo({
        a: 'a1',
        b: 'b1'
      });

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        foo: foo
      });

      var expected = {
        'email': {
          path: 'email',
          value: null,
          name: 'email'
        },
        'foo': {
          path: 'foo',
          value: foo.a,
          name: 'foo'
        }
      };

      expect(user.$_refValues).to.deep.equal(expected)
    });
  });
});