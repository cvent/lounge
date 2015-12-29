var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model index function tests', function () {
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

  it('should index using simple reference document when we call the function', function (done) {
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

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(err, indexRes) {
      expect(err).to.not.be.ok;
      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.key).to.be.ok;
      expect(indexRes.value.key).to.equal(user.id);
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('email', user.email);
      bucket.get(k, function (err, indexRes) {
        checkRes(err, indexRes);

        user.email = 'joe2@gmail.com';

        user.index(function (err, indexRes) {
          expect(err).to.not.be.ok;

          // old one
          k = userSchema.getRefKey('email', 'joe@gmail.com');
          bucket.get(k, function (err, indexRes) {
            expect(err).to.be.ok;
            expect(err.code).to.equal(couchbase.errors.keyNotFound);

            k = userSchema.getRefKey('email', user.email);
            bucket.get(k, function (err, indexRes) {
              checkRes(err, indexRes);

              expect(indexCalled).to.be.ok;

              done();
            });
          });
        });
      });
    });
  });

  it('should index() using simple reference document using key options', function (done) {
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

    var indexCalled = false;
    user.on('index', function (err) {
      indexCalled = true;
    });

    function checkIndexRes(err, indexRes) {
      expect(err).to.not.be.ok;
      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.key).to.be.ok;
      expect(indexRes.value.key).to.equal(user.getDocumentKeyValue(true));
    }

    function checkGetRes(err, gd) {
      expect(err).to.not.be.ok;
      expect(gd).to.be.ok;
      expect(gd.value).to.be.ok;
      expect(gd.value.email).to.be.equal(user.email);
      expect(gd.value.username).to.be.equal(user.username);
      expect(gd.value.firstName).to.be.equal(user.firstName);
      expect(gd.value.lastName).to.be.equal(user.lastName);
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('email', user.email);
      bucket.get(k, function (err, indexRes) {
        checkIndexRes(err, indexRes);

        bucket.get(indexRes.value.key, function (err, gd) {
          checkGetRes(err, gd);

          user.username = 'jsmith2';

          user.index(function (err) {
            expect(err).to.not.be.ok;

            k = userSchema.getRefKey('email', user.email);
            bucket.get(k, function (err, indexRes) {
              checkIndexRes(err, indexRes);

              // old one still sticks around
              bucket.get('jsmith', function (err, gd) {
                expect(err).to.not.be.ok;
                expect(gd).to.be.ok;
                expect(gd.value).to.be.ok;
                expect(gd.value.username).to.be.equal('jsmith');

                expect(indexCalled).to.be.ok;

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should index() using multiple simple reference documents', function (done) {
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

    function checkRes(err, rdoc) {
      expect(err).to.not.be.ok;
      expect(rdoc).to.be.ok;
      expect(rdoc.value).to.be.ok;
      expect(rdoc.value.key).to.be.ok;
      expect(rdoc.value.key).to.equal(user.id);
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var indexCalled = 0;
      user.on('index', function (err) {
        indexCalled = indexCalled + 1;
      });

      var k = userSchema.getRefKey('email', user.email);
      bucket.get(k, function (err, indexRes) {
        checkRes(err, indexRes);

        k = userSchema.getRefKey('userName', user.username);
        bucket.get(k, function (err, indexRes) {
          checkRes(err, indexRes);

          user.email = 'joe2@gmail.com';
          user.username = 'jsmith2';

          user.index(function (err, savedDoc) {
            expect(err).to.not.be.ok;

            // old ones
            k = userSchema.getRefKey('email', 'joe@gmail.com');
            bucket.get(k, function (err, gdoc) {
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              k = userSchema.getRefKey('username', 'jsmith');
              bucket.get(k, function (err, gdoc) {
                expect(err).to.be.ok;
                expect(err.code).to.equal(couchbase.errors.keyNotFound);

                // new ones
                var k = userSchema.getRefKey('email', user.email);
                bucket.get(k, function (err, indexRes) {
                  checkRes(err, indexRes);
                  k = userSchema.getRefKey('userName', user.username);
                  bucket.get(k, function (err, indexRes) {
                    checkRes(err, indexRes);

                    expect(indexCalled).to.equal(1);

                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('should index() using array of reference documents', function (done) {
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

      var indexCalled = 0;
      user.on('index', function (err) {
        indexCalled = indexCalled + 1;
      });

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

        user.index(function (err) {
          expect(err).to.not.be.ok;

          // check old ones
          keys = _.map(['js1', 'js3'], function (un) {
            return userSchema.getRefKey('username', un);
          });

          bucket.getMulti(keys, function (err, indexRes) {

            expect(err).to.be.ok;
            expect(err).to.equal(2);

            keys = _.map(user.usernames, function (un) {
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

              expect(indexCalled).to.equal(1);

              done();
            });
          });
        });
      });
    });
  });
});