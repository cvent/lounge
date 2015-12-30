var couchbase = require('couchbase');
var testUtil = require('./helpers/utils');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model index on remove tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge.Lounge(); // recreate it

    var cluster = testUtil.getCluser();
    bucket = cluster.openBucket('lounge_test', function (err) {
      lounge.connect({
        bucket: bucket
      }, function () {
        bucket.manager().flush(done);
      });
    });
  });

  it('should remove index using simple reference document', function (done) {
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

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok;
          expect(rdoc).to.be.ok;
          expect(rdoc.id).to.be.ok;

          bucket.get(rdoc.id, function (err, doc) {
            expect(doc).to.not.be.ok;
            expect(err).to.be.ok;
            expect(err.code).to.equal(couchbase.errors.keyNotFound);

            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok;
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              done();
            });
          });
        });
      });
    });
  });

  it('should remove index using simple reference document - change', function (done) {
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

        user.email = 'joe2@gmail.com';

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok;
          expect(rdoc).to.be.ok;
          expect(rdoc.id).to.be.ok;

          bucket.get(rdoc.id, function (err, doc) {
            expect(doc).to.not.be.ok;
            expect(err).to.be.ok;
            expect(err.code).to.equal(couchbase.errors.keyNotFound);

            k = userSchema.getRefKey('email', 'joe2@gmail.com');
            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok;
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              k = userSchema.getRefKey('email', 'joe@gmail.com');
              bucket.get(k, function (err, indexRes) {
                expect(indexRes).to.not.be.ok;
                expect(err).to.be.ok;
                expect(err.code).to.equal(couchbase.errors.keyNotFound);

                done();
              });

            });
          });
        });
      });
    });
  });

  it('should remove indexes using simple reference document using key options', function (done) {
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

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok;

            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok;
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              bucket.get(user.email, function (err, indexRes) {
                expect(indexRes).to.not.be.ok;
                expect(err).to.be.ok;
                expect(err.code).to.equal(couchbase.errors.keyNotFound);

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should remove indexes using simple reference document using key options - change', function (done) {
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

          user.username = 'jsmith2';

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok;

            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok;
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              bucket.get(user.email, function (err, indexRes) {
                expect(indexRes).to.not.be.ok;
                expect(err).to.be.ok;
                expect(err.code).to.equal(couchbase.errors.keyNotFound);

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should remove indexes for multiple simple reference documents', function (done) {
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

        k = userSchema.getRefKey('userName', user.username);
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok;
          expect(indexRes).to.be.ok;
          expect(indexRes.value).to.be.ok;
          expect(indexRes.value.key).to.be.ok;
          expect(indexRes.value.key).to.equal(user.id);

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok;

            k = userSchema.getRefKey('email', user.email);
            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok;
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              k = userSchema.getRefKey('email', user.email);
              bucket.get(k, function (err, indexRes) {
                expect(indexRes).to.not.be.ok;
                expect(err).to.be.ok;
                expect(err.code).to.equal(couchbase.errors.keyNotFound);

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should remove indexes as array of reference documents', function (done) {
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

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok;

          setTimeout(function () {

            bucket.getMulti(keys, function (err, indexRes) {

              _.each(indexRes, function (ik) {
                expect(ik.error).to.be.ok;
                expect(ik.error.code).to.equal(couchbase.errors.keyNotFound);
              });

              done();
            });
          }, 100);
        });
      });
    });
  });

  it('should remove index using array of reference documents after change', function (done) {
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

        user.usernames = ['jsnew1', 'js2', 'jsnew3'];

        user.remove(function (err, savedDoc) {
          expect(err).to.not.be.ok;
          expect(savedDoc).to.be.ok;

          // check old ones
          keys = _.map(['js1', 'js3'], function (un) {
            return userSchema.getRefKey('username', un);
          });

          bucket.getMulti(keys, function (err, indexRes) {

            _.each(indexRes, function (ik) {
              expect(ik.error).to.be.ok;
              expect(ik.error.code).to.equal(couchbase.errors.keyNotFound);
            });

            keys = _.map(user.usernames, function (un) {
              return userSchema.getRefKey('username', un);
            });

            bucket.getMulti(keys, function (err, indexRes) {

              _.each(indexRes, function (ik) {
                expect(ik.error).to.be.ok;
                expect(ik.error.code).to.equal(couchbase.errors.keyNotFound);
              });

              done();
            });
          });
        });
      });
    });
  });
});