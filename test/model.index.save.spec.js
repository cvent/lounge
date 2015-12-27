var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model index on save tests', function () {
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

  it('should index using simple reference document', function (done) {
    var userSchema = lounge.schema({
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

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('email', user.email);
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok;
        expect(indexRes).to.be.ok;
        expect(indexRes.value).to.be.ok;
        expect(indexRes.value.key).to.be.ok;
        expect(indexRes.value.key).to.equal(user.id);

        done();
      });
    });
  });

  it('should index using simple reference document using key options', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: {type: String, index: true},
      username: {type: String, key: true, generate: false}
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      username: 'jsmith'
    });

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('email', user.email);
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok;
        expect(indexRes).to.be.ok;
        expect(indexRes.value).to.be.ok;
        expect(indexRes.value.key).to.be.ok;
        expect(indexRes.value.key).to.equal(user.getDocumentKeyValue(true));

        bucket.get(indexRes.value.key, function (err, gd) {
          expect(err).to.not.be.ok;
          expect(gd).to.be.ok;
          expect(gd.value).to.be.ok;
          expect(gd.value.email).to.be.equal(user.email);
          expect(gd.value.username).to.be.equal(user.username);
          expect(gd.value.firstName).to.be.equal(user.firstName);
          expect(gd.value.lastName).to.be.equal(user.lastName);
          done();
        });
      });
    });
  });

  it('should index using multiple simple reference documents', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: {type: String, index: true},
      username: {type: String, index: true, indexName: 'userName'}
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      username: 'jsmith'
    });

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('email', user.email);
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok;
        expect(indexRes).to.be.ok;
        expect(indexRes.value).to.be.ok;
        expect(indexRes.value.key).to.be.ok;
        expect(indexRes.value.key).to.equal(user.id);

        var k = userSchema.getRefKey('userName', user.username);
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok;
          expect(indexRes).to.be.ok;
          expect(indexRes.value).to.be.ok;
          expect(indexRes.value.key).to.be.ok;
          expect(indexRes.value.key).to.equal(user.id);

          done();
        });
      });
    });
  });

  it('should index using array of reference documents', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: {type: String, key: true, generate: false},
      usernames: [{type: String, index: true, indexName: 'username'}]
    }, {
      refIndexKeyPrefix: 'app::dev::ref::',
      delimiter: '::'
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      usernames: ['js1', 'js2', 'js3']
    });

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var keys = _.map(user.usernames, function (un) {
        return userSchema.getRefKey('username', un);
      });

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok;
        expect(indexRes).to.be.ok;

        var resKeys = Object.keys(indexRes);

        _.each(resKeys, function (ik) {
          var v = indexRes[ik].value;
          expect(v).to.be.ok;
          expect(v.key).to.be.ok;
          expect(v.key).to.be.equal(user.email);
        });

        done();
      });
    });
  });

  it('should create index ref document for a ref field', function () {
    var fooSchema = lounge.schema({
      a: String,
      b: String
    });

    var Foo = lounge.model('Foo', fooSchema);

    var userSchema = lounge.schema({
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

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;


      var emailKey = userSchema.getRefKey('email', user.email);
      var fooKey = userSchema.getRefKey('foo', user.foo.id);

      bucket.get(emailKey, function (err, indexRes) {
        expect(err).to.not.be.ok;
        expect(indexRes).to.be.ok;

        var v = indexRes.value;
        expect(v).to.be.ok;
        expect(v.key).to.be.ok;
        expect(v.key).to.be.equal(user.id);

        bucket.get(fooKey, function (err, indexRes) {
          expect(err).to.not.be.ok;
          expect(indexRes).to.be.ok;

          var v = indexRes.value;
          expect(v).to.be.ok;
          expect(v.key).to.be.ok;
          expect(v.key).to.be.equal(user.id);

          done();
        });
      });
    });
  });

  it('should create index ref document for a ref field respecting key options', function () {
    var fooSchema = lounge.schema({
      a: String,
      b: String
    });

    var Foo = lounge.model('Foo', fooSchema);

    var userSchema = lounge.schema({
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
      a: {type: String, key: true, generate: false},
      b: 'b1'
    });

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      foo: foo
    });

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;


      var emailKey = userSchema.getRefKey('email', user.email);
      var fooKey = userSchema.getRefKey('foo', user.foo.a);

      bucket.get(emailKey, function (err, indexRes) {
        expect(err).to.not.be.ok;
        expect(indexRes).to.be.ok;

        var v = indexRes.value;
        expect(v).to.be.ok;
        expect(v.key).to.be.ok;
        expect(v.key).to.be.equal(user.id);

        bucket.get(fooKey, function (err, indexRes) {
          expect(err).to.not.be.ok;
          expect(indexRes).to.be.ok;

          var v = indexRes.value;
          expect(v).to.be.ok;
          expect(v.key).to.be.ok;
          expect(v.key).to.be.equal(user.id);

          done();
        });
      });
    });
  });

  it('should create index ref document for a ref field respecting key options 2', function () {
    var fooSchema = lounge.schema({
      a: String,
      b: String
    });

    var Foo = lounge.model('Foo', fooSchema);

    var userSchema = lounge.schema({
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
      a: {type: String, key: true, generate: false},
      b: 'b1'
    });

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      foo: foo.a
    });

    foo.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      user.save(function (err, savedDoc) {
        expect(err).to.not.be.ok;
        expect(savedDoc).to.be.ok;


        var emailKey = userSchema.getRefKey('email', user.email);
        var fooKey = userSchema.getRefKey('foo', foo.a);

        bucket.get(emailKey, function (err, indexRes) {
          expect(err).to.not.be.ok;
          expect(indexRes).to.be.ok;

          var v = indexRes.value;
          expect(v).to.be.ok;
          expect(v.key).to.be.ok;
          expect(v.key).to.be.equal(user.id);

          bucket.get(fooKey, function (err, indexRes) {
            expect(err).to.not.be.ok;
            expect(indexRes).to.be.ok;

            var v = indexRes.value;
            expect(v).to.be.ok;
            expect(v.key).to.be.ok;
            expect(v.key).to.be.equal(user.id);

            done();
          });
        });
      });
    });
  });
});