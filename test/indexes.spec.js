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

      expect(user.$_o.refValues).to.deep.equal(expected)
    });

    it('should create index values for array and automatically singularize', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{type: String, index: true}]
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

      expect(user.$_o.refValues).to.deep.equal(expected)
    });

    it('should create index values for array and  respect indexName', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{type: String, index: true, indexName: 'UN'}]
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByUN).to.be.ok;
      expect(User.findByUN).to.be.an.instanceof(Function);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        usernames: ['user1', 'user2']
      });

      var expected = {
        'UN': {
          path: 'usernames',
          value: ['user1', 'user2'],
          name: 'UN'
        }
      };

      expect(user.$_o.refValues).to.deep.equal(expected)
    });

    it('should not create index value for a ref field', function () {
      var fooSchema = lounge.schema({
        a: String,
        b: String
      });

      var Foo = lounge.model('Foo', fooSchema);

      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: {type: String, index: true},
        foo: {type: Foo}
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByEmail).to.be.ok;
      expect(User.findByEmail).to.be.an.instanceof(Function);
      expect(User.findByFoo).to.not.be.ok;
      expect(User.findByFoo).to.not.be.an.instanceof(Function);

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
        }
      };

      expect(user.$_o.refValues).to.deep.equal(expected)
    });

    it('should create index value for untruthy values', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: {type: String, index: true}
      });

      var User = lounge.model('User', userSchema);

      expect(User.findByEmail).to.be.ok;
      expect(User.findByEmail).to.be.an.instanceof(Function);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith'
      });

      var expected = {
        'email': {
          path: 'email',
          value: null,
          name: 'email'
        }
      };

      expect(user.$_o.refValues).to.deep.equal(expected)
    });
  });
});