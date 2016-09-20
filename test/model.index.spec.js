var couchbase = require('couchbase');
var _ = require('lodash');
var testUtil = require('./helpers/utils');
var expect = require('chai').expect;

var lounge = require('../');

var bucket;

describe('Model index function tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge.Lounge(); // recreate it

    var cluster = testUtil.getCluser();
    bucket = cluster.openBucket('lounge_test', function (err) {
      if (err) {
        return done(err);
      }

      lounge.connect({
        bucket: bucket
      }, function () {
        bucket.manager().flush(done);
      });
    });
  });

  it('should index using simple reference document when we call the function', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true }
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

  it('should properly create index when defined separately', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String
    });

    userSchema.index('email');

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe3@gmail.com'
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
      expect(gd.value.email).to.equal(user.email);
      expect(gd.value.firstName).to.equal(user.firstName);
      expect(gd.value.lastName).to.equal(user.lastName);
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('email', user.email);
      bucket.get(k, function (err, indexRes) {
        checkIndexRes(err, indexRes);

        bucket.get(indexRes.value.key, function (err, gd) {
          checkGetRes(err, gd);

          done();
        });
      });
    });
  });


  it('should create a compound index', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      username: String,
    });

    userSchema.index(['email', 'username']);

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe3@gmail.com',
      username: 'jsmith'
    });

    var indexCalled = false;
    user.on('index', function (err) {
      indexCalled = true;
    });

    function checkIndexRes(err, indexRes) {
      console.dir(err);
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
      expect(gd.value.email).to.equal(user.email);
      expect(gd.value.firstName).to.equal(user.firstName);
      expect(gd.value.lastName).to.equal(user.lastName);
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('email_and_username', user.email + '_' + user.username);
      bucket.get(k, function (err, indexRes) {
        console.log('Err');
        console.dir(err);
        console.log('****');
        checkIndexRes(err, indexRes);

        bucket.get(indexRes.value.key, function (err, gd) {
          checkGetRes(err, gd);
          done();
        });
      });
    });
  });

  it('should index() using simple reference document using key options', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      username: { type: String, key: true, generate: false }
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
      expect(gd.value.email).to.equal(user.email);
      expect(gd.value.username).to.equal(user.username);
      expect(gd.value.firstName).to.equal(user.firstName);
      expect(gd.value.lastName).to.equal(user.lastName);
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
                expect(gd.value.username).to.equal('jsmith');

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
      email: { type: String, index: true },
      username: { type: String, index: true, indexName: 'userName' }
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

  it('should index() using multiple simple reference documents defined separately', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      username: String
    });

    userSchema.index('email');
    userSchema.index('username', { indexName: 'userName' });

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
      email: { type: String, key: true, generate: false },
      usernames: [{ type: String, index: true, indexName: 'username' }]
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
          expect(v.key).to.equal(user.email);
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
                expect(v.key).to.equal(user.email);
              });

              expect(indexCalled).to.equal(1);

              done();
            });
          });
        });
      });
    });
  });

  it('should index() using array of reference documents with a compound index', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, key: true, generate: false },
      usernames: [{ type: String, indexName: 'username' }]
    }, {
      refIndexKeyPrefix: 'app::dev::ref::',
      delimiter: '::'
    });

    userSchema.index(['email', 'usernames']);

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
        return userSchema.getRefKey('email_and_username', user.email + '_' + un);
      });

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok;
        expect(indexRes).to.be.ok;

        var resKeys = Object.keys(indexRes);

        _.each(resKeys, function (ik) {
          var v = indexRes[ik].value;
          expect(v).to.be.ok;
          expect(v.key).to.be.ok;
          expect(v.key).to.equal(user.email);
        });

        user.usernames = ['jsnew1', 'js2', 'jsnew3'];

        user.index(function (err) {
          expect(err).to.not.be.ok;

          // check old ones
          keys = _.map(['js1', 'js3'], function (un) {
            return userSchema.getRefKey('email_and_username', user.email + '_' + un);
          });

          bucket.getMulti(keys, function (err, indexRes) {

            expect(err).to.be.ok;
            expect(err).to.equal(2);

            keys = _.map(user.usernames, function (un) {
              return userSchema.getRefKey('email_and_username', user.email + '_' + un);
            });

            bucket.getMulti(keys, function (err, indexRes) {
              expect(err).to.not.be.ok;
              expect(indexRes).to.be.ok;

              var resKeys = Object.keys(indexRes);

              _.each(resKeys, function (ik) {
                var v = indexRes[ik].value;
                expect(v).to.be.ok;
                expect(v.key).to.be.ok;
                expect(v.key).to.equal(user.email);
              });

              expect(indexCalled).to.equal(1);

              done();
            });
          });
        });
      });
    });
  });

  it('should index using simple reference document for array index type', function (done) {
    var userSchema = lounge.schema({
      name: String,
      email: { type: String, index: true, indexType: 'array' }
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com'
    });

    var user2 = new User({
      name: 'Bob Jones',
      email: 'joe@gmail.com'
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes, expected) {

      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.keys).to.be.ok;
      expect(indexRes.value.keys).to.deep.equal(expected);
    }

    user.index(function (err, indexDoc) {
      expect(err).to.not.be.ok;

      user2.index(function (err, savedDoc) {

        var k = userSchema.getRefKey('email', user.email);
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok;
          checkRes(indexRes, [user.id, user2.id]);

          user.email = 'joe2@gmail.com';

          user.index(function (err, indexRes) {
            expect(err).to.not.be.ok;

            // old one
            k = userSchema.getRefKey('email', 'joe@gmail.com');
            bucket.get(k, function (err, indexRes) {
              expect(err).to.not.be.ok;
              checkRes(indexRes, [user2.id]);

              k = userSchema.getRefKey('email', user.email);
              bucket.get(k, function (err, indexRes) {
                checkRes(indexRes, [user.id]);

                expect(indexCalled).to.be.ok;

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should index using simple reference document for array index type with compound index', function (done) {
    var userSchema = lounge.schema({
      name: String,
      email: String,
      username: String
    });

    userSchema.index(['email', 'username'], { indexType: 'array' });

    var User = lounge.model('User', userSchema);

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      username: 'jsmith'
    });

    var user2 = new User({
      name: 'Bob Jones',
      email: 'joe@gmail.com',
      username: 'jsmith'
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes, expected) {

      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.keys).to.be.ok;
      expect(indexRes.value.keys).to.deep.equal(expected);
    }

    user.index(function (err, indexDoc) {
      expect(err).to.not.be.ok;

      user2.index(function (err, savedDoc) {

        var k = userSchema.getRefKey('email_and_username', user.email + '_' + user.username);
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok;
          checkRes(indexRes, [user.id, user2.id]);

          user.email = 'joe2@gmail.com';

          user.index(function (err, indexRes) {
            expect(err).to.not.be.ok;

            // old one
            k = userSchema.getRefKey('email_and_username', 'joe@gmail.com' + '_' + user.username);
            bucket.get(k, function (err, indexRes) {
              expect(err).to.not.be.ok;
              checkRes(indexRes, [user2.id]);

              k = userSchema.getRefKey('email_and_username', user.email + '_' + user.username);
              bucket.get(k, function (err, indexRes) {
                checkRes(indexRes, [user.id]);

                expect(indexCalled).to.be.ok;

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should index using simple reference document for array index type defined separately', function (done) {
    var userSchema = lounge.schema({
      name: String,
      email: String
    });

    userSchema.index('email', { indexType: 'array' });

    var User = lounge.model('User', userSchema);

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com'
    });

    var user2 = new User({
      name: 'Bob Jones',
      email: 'joe@gmail.com'
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes, expected) {

      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.keys).to.be.ok;
      expect(indexRes.value.keys).to.deep.equal(expected);
    }

    user.index(function (err, indexDoc) {
      expect(err).to.not.be.ok;

      user2.index(function (err, savedDoc) {

        var k = userSchema.getRefKey('email', user.email);
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok;
          checkRes(indexRes, [user.id, user2.id]);

          user.email = 'joe2@gmail.com';

          user.index(function (err, indexRes) {
            expect(err).to.not.be.ok;

            // old one
            k = userSchema.getRefKey('email', 'joe@gmail.com');
            bucket.get(k, function (err, indexRes) {
              expect(err).to.not.be.ok;
              checkRes(indexRes, [user2.id]);

              k = userSchema.getRefKey('email', user.email);
              bucket.get(k, function (err, indexRes) {
                checkRes(indexRes, [user.id]);

                expect(indexCalled).to.be.ok;

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should index using array reference document for array index type', function (done) {
    var userSchema = lounge.schema({
      name: String,
      email: [{ type: String, index: true, indexType: 'array' }]
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      name: 'Joe Smith',
      email: ['joe@gmail.com', 'joe2@gmail.com']
    });

    var user2 = new User({
      name: 'Joe Jones',
      email: ['joe2@gmail.com', 'joe3@gmail.com']
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes, exptected) {
      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.keys).to.be.ok;
      expect(indexRes.value.keys).to.deep.equal(exptected);
    }

    user.index(function (err, savedDoc) {
      expect(err).to.not.be.ok;

      user2.index(function (err, savedDoc) {
        expect(err).to.not.be.ok;

        var keys = _.map(['joe@gmail.com', 'joe2@gmail.com', 'joe3@gmail.com'], function (em) {
          return userSchema.getRefKey('email', em);
        });

        bucket.getMulti(keys, function (err, indexRes) {
          expect(err).to.not.be.ok;

          var ex = [
            [user.id],
            [user.id, user2.id],
            [user2.id]
          ];
          _.values(indexRes).forEach(function (ir, i) {
            checkRes(ir, ex[i]);
          });

          user.email = ['joe2@gmail.com', 'joe4@gmail.com'];

          user.index(function (err, indexRes) {
            expect(err).to.not.be.ok;

            // old one
            var k = userSchema.getRefKey('email', 'joe@gmail.com');
            bucket.get(k, function (err, indexRes) {
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              var keys = _.map(['joe2@gmail.com', 'joe3@gmail.com', 'joe4@gmail.com'], function (em) {
                return userSchema.getRefKey('email', em);
              });

              bucket.getMulti(keys, function (err, indexRes) {
                expect(err).to.not.be.ok;

                var ex = [
                  [user.id, user2.id],
                  [user2.id],
                  [user.id]
                ];
                _.values(indexRes).forEach(function (ir, i) {
                  checkRes(ir, ex[i]);
                });

                expect(indexCalled).to.be.ok;

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should index using simple embedded reference document', function (done) {
    var companySchema = {
      name: String,
      website: String
    };

    var Company = lounge.model('Company', companySchema);

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: 'false' },
      company: { type: Company, index: true }
    });

    var User = lounge.model('User', userSchema);

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    });

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      company: company
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes) {
      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.key).to.be.ok;
      expect(indexRes.value.key).to.equal(user.email);
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var k = userSchema.getRefKey('company', user.company.id);
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok;
        checkRes(indexRes);

        user.company = 'another-company-id';

        user.index(function (err, indexRes) {
          expect(err).to.not.be.ok;

          // old one
          k = userSchema.getRefKey('company', company.id);
          bucket.get(k, function (err, indexRes) {
            expect(err).to.be.ok;
            expect(err.code).to.equal(couchbase.errors.keyNotFound);

            k = userSchema.getRefKey('company', user.company);
            bucket.get(k, function (err, indexRes) {
              expect(err).to.not.be.ok;
              checkRes(indexRes);

              expect(indexCalled).to.be.ok;

              done();
            });
          });
        });
      });
    });
  });

  it('should index using an array of embedded reference document', function (done) {
    var companySchema = {
      name: String,
      website: String
    };

    var Company = lounge.model('Company', companySchema);

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: 'false' },
      company: [{ type: Company, index: true }]
    });

    var User = lounge.model('User', userSchema);

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    });

    var company2 = new Company({
      name: 'BCorp',
      website: 'www.bcorp.com'
    });

    var company3 = new Company({
      name: 'CTech',
      website: 'www.ctech.com'
    });

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      company: [company, company2]
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes) {
      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.key).to.be.ok;
      expect(indexRes.value.key).to.equal(user.email);
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;
      expect(savedDoc).to.be.ok;

      var keys = _.map(user.company, function (c) {
        return userSchema.getRefKey('company', c.id);
      });

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok;

        _.values(indexRes).forEach(checkRes);

        user.company = [company2, company3];

        user.index(function (err, indexRes) {
          expect(err).to.not.be.ok;

          // old one
          var k = userSchema.getRefKey('company', company.id);
          bucket.get(k, function (err, indexRes) {
            expect(err).to.be.ok;
            expect(err.code).to.equal(couchbase.errors.keyNotFound);

            keys = _.map(user.company, function (c) {
              return userSchema.getRefKey('company', c.id);
            });
            bucket.getMulti(keys, function (err, indexRes) {
              expect(err).to.not.be.ok;
              _.values(indexRes).forEach(checkRes);

              expect(indexCalled).to.be.ok;

              done();
            });
          });
        });
      });
    })
  });

  it('should index using embedded reference document of array indexType', function (done) {
    var companySchema = {
      name: String,
      website: String
    };

    var Company = lounge.model('Company', companySchema);

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: false },
      company: { type: Company, index: true, indexType: 'array' }
    });

    var User = lounge.model('User', userSchema);

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    });

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      company: company
    });

    var user2 = new User({
      name: 'Bob Jones',
      email: 'bob@gmail.com',
      company: company
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes, expected) {

      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.keys).to.be.ok;
      expect(indexRes.value.keys.sort()).to.deep.equal(expected.sort());
    }

    user.index(function (err, indexDoc) {
      expect(err).to.not.be.ok;

      user2.index(function (err, savedDoc) {
        expect(err).to.not.be.ok;

        var k = userSchema.getRefKey('company', user.company.id);
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok;
          checkRes(indexRes, [user.email, user2.email]);

          user.company = 'company-2-id';

          user.index(function (err, indexRes) {
            expect(err).to.not.be.ok;

            // old one
            k = userSchema.getRefKey('company', company.id);
            bucket.get(k, function (err, indexRes) {
              expect(err).to.not.be.ok;
              checkRes(indexRes, [user2.email]);

              k = userSchema.getRefKey('company', user.company);
              bucket.get(k, function (err, indexRes) {
                checkRes(indexRes, [user.email]);

                expect(indexCalled).to.be.ok;

                done();
              });
            });
          });
        });
      });
    });
  });

  it('should index using an array of embedded reference document of array indexType', function (done) {
    var companySchema = {
      name: String,
      website: String
    };

    var Company = lounge.model('Company', companySchema);

    var userSchema = lounge.schema({
      name: String,
      company: [{ type: Company, index: true, indexType: 'array' }]
    });

    var User = lounge.model('User', userSchema);

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    });

    var company2 = new Company({
      name: 'BCorp',
      website: 'www.bcorp.com'
    });

    var company3 = new Company({
      name: 'CTech',
      website: 'www.ctech.com'
    });

    var user = new User({
      name: 'Joe Smith',
      company: [company, company2]
    });

    var user2 = new User({
      name: 'Joe Jones',
      company: [company2, company3]
    });

    var indexCalled = false;
    user.on('index', function () {
      indexCalled = true;
    });

    function checkRes(indexRes, exptected) {
      expect(indexRes).to.be.ok;
      expect(indexRes.value).to.be.ok;
      expect(indexRes.value.keys).to.be.ok;
      expect(indexRes.value.keys).to.deep.equal(exptected);
    }

    user.index(function (err, savedDoc) {
      expect(err).to.not.be.ok;

      user2.index(function (err, savedDoc) {
        expect(err).to.not.be.ok;

        var keys = _.map([company.id, company2.id, company3.id], function (em) {
          return userSchema.getRefKey('company', em);
        });

        bucket.getMulti(keys, function (err, indexRes) {
          expect(err).to.not.be.ok;

          var ex = [
            [user.id],
            [user.id, user2.id],
            [user2.id]
          ];
          _.values(indexRes).forEach(function (ir, i) {
            checkRes(ir, ex[i]);
          });

          user.company = [company2, 'company4-id'];

          user.index(function (err, indexRes) {
            expect(err).to.not.be.ok;

            // old one
            var k = userSchema.getRefKey('company', company.id);
            bucket.get(k, function (err, indexRes) {
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);

              var keys = _.map([company2.id, company3.id, 'company4-id'], function (em) {
                return userSchema.getRefKey('company', em);
              });

              bucket.getMulti(keys, function (err, indexRes) {
                expect(err).to.not.be.ok;

                var ex = [
                  [user.id, user2.id],
                  [user2.id],
                  [user.id]
                ];
                _.values(indexRes).forEach(function (ir, i) {
                  checkRes(ir, ex[i]);
                });

                expect(indexCalled).to.be.ok;

                done();
              });
            });
          });
        });
      });
    });
  });
});
