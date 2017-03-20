/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
var couchbase = require('couchbase')
var testUtil = require('./helpers/utils')
var _ = require('lodash')
var expect = require('chai').expect
var async = require('async')

var lounge = require('../')

var bucket

describe('Model index on save tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect()
    }

    lounge = new lounge.Lounge() // recreate it

    var cluster = testUtil.getCluser()
    bucket = cluster.openBucket('lounge_test', function (err) {
      if (err) {
        return done(err)
      }

      lounge.connect({
        bucket: bucket
      }, function () {
        bucket.manager().flush(done)
      })
    })
  })

  it('should index using simple reference document', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true }
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com'
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('email', user.email)
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok
        expect(indexRes.value).to.be.ok
        expect(indexRes.value.key).to.be.ok
        expect(indexRes.value.key).to.equal(user.id)

        done()
      })
    })
  })

  it('should index using simple reference document - change', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true }
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com'
    })

    function checkRes (err, indexRes) {
      expect(err).to.not.be.ok
      expect(indexRes).to.be.ok
      expect(indexRes.value).to.be.ok
      expect(indexRes.value.key).to.be.ok
      expect(indexRes.value.key).to.equal(user.id)
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('email', user.email)
      bucket.get(k, function (err, indexRes) {
        checkRes(err, indexRes)

        user.email = 'joe2@gmail.com'

        user.save(function (err, savedDoc) {
          expect(err).to.not.be.ok
          expect(savedDoc).to.be.ok

          // old one
          k = userSchema.getRefKey('email', 'joe@gmail.com')
          bucket.get(k, function (err, indexRes) {
            expect(err).to.be.ok
            expect(err.code).to.equal(couchbase.errors.keyNotFound)

            k = userSchema.getRefKey('email', user.email)
            bucket.get(k, function (err, indexRes) {
              checkRes(err, indexRes)
              done()
            })
          })
        })
      })
    })
  })

  it('should index using simple reference document using key options', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      username: { type: String, key: true, generate: false }
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      username: 'jsmith'
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('email', user.email)
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok
        expect(indexRes.value).to.be.ok
        expect(indexRes.value.key).to.be.ok
        expect(indexRes.value.key).to.equal(user.getDocumentKeyValue(true))

        bucket.get(indexRes.value.key, function (err, gd) {
          expect(err).to.not.be.ok
          expect(gd).to.be.ok
          expect(gd.value).to.be.ok
          expect(gd.value.email).to.equal(user.email)
          expect(gd.value.username).to.equal(user.username)
          expect(gd.value.firstName).to.equal(user.firstName)
          expect(gd.value.lastName).to.equal(user.lastName)
          done()
        })
      })
    })
  })

  it('should index using simple reference document using key options - change', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      username: { type: String, key: true, generate: false }
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      username: 'jsmith'
    })

    function checkIndexRes (err, indexRes) {
      expect(err).to.not.be.ok
      expect(indexRes).to.be.ok
      expect(indexRes.value).to.be.ok
      expect(indexRes.value.key).to.be.ok
      expect(indexRes.value.key).to.equal(user.getDocumentKeyValue(true))
    }

    function checkGetRes (err, gd) {
      expect(err).to.not.be.ok
      expect(gd).to.be.ok
      expect(gd.value).to.be.ok
      expect(gd.value.email).to.equal(user.email)
      expect(gd.value.username).to.equal(user.username)
      expect(gd.value.firstName).to.equal(user.firstName)
      expect(gd.value.lastName).to.equal(user.lastName)
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('email', user.email)
      bucket.get(k, function (err, indexRes) {
        checkIndexRes(err, indexRes)

        bucket.get(indexRes.value.key, function (err, gd) {
          checkGetRes(err, gd)

          user.username = 'jsmith2'

          user.save(function (err, savedDoc) {
            expect(err).to.not.be.ok
            expect(savedDoc).to.be.ok

            k = userSchema.getRefKey('email', user.email)
            bucket.get(k, function (err, indexRes) {
              checkIndexRes(err, indexRes)

              bucket.get(indexRes.value.key, function (err, gd) {
                checkGetRes(err, gd)

                // old one still sticks around
                bucket.get('jsmith', function (err, gd) {
                  expect(err).to.not.be.ok
                  expect(gd).to.be.ok
                  expect(gd.value).to.be.ok
                  expect(gd.value.username).to.equal('jsmith')

                  done()
                })
              })
            })
          })
        })
      })
    })
  })

  it('should index using multiple simple reference documents', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      username: { type: String, index: true, indexName: 'userName' }
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      username: 'jsmith'
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('email', user.email)
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok
        expect(indexRes.value).to.be.ok
        expect(indexRes.value.key).to.be.ok
        expect(indexRes.value.key).to.equal(user.id)

        var k = userSchema.getRefKey('userName', user.username)
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok
          expect(indexRes).to.be.ok
          expect(indexRes.value).to.be.ok
          expect(indexRes.value.key).to.be.ok
          expect(indexRes.value.key).to.equal(user.id)

          done()
        })
      })
    })
  })

  it('should index using multiple simple reference documents - change', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      username: { type: String, index: true, indexName: 'userName' }
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      username: 'jsmith'
    })

    function checkRes (err, rdoc) {
      expect(err).to.not.be.ok
      expect(rdoc).to.be.ok
      expect(rdoc.value).to.be.ok
      expect(rdoc.value.key).to.be.ok
      expect(rdoc.value.key).to.equal(user.id)
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('email', user.email)
      bucket.get(k, function (err, indexRes) {
        checkRes(err, indexRes)

        k = userSchema.getRefKey('userName', user.username)
        bucket.get(k, function (err, indexRes) {
          checkRes(err, indexRes)

          user.email = 'joe2@gmail.com'
          user.username = 'jsmith2'

          user.save(function (err, savedDoc) {
            expect(err).to.not.be.ok
            expect(savedDoc).to.be.ok

            // old ones
            k = userSchema.getRefKey('email', 'joe@gmail.com')
            bucket.get(k, function (err, gdoc) {
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              k = userSchema.getRefKey('username', 'jsmith')
              bucket.get(k, function (err, gdoc) {
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                // new ones
                var k = userSchema.getRefKey('email', user.email)
                bucket.get(k, function (err, indexRes) {
                  checkRes(err, indexRes)
                  k = userSchema.getRefKey('userName', user.username)
                  bucket.get(k, function (err, indexRes) {
                    checkRes(err, indexRes)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  it('should index using array of reference documents', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, key: true, generate: false },
      usernames: [{ type: String, index: true, indexName: 'username' }]
    }, {
      refIndexKeyPrefix: 'app::dev::ref::',
      delimiter: '::'
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      usernames: ['js1', 'js2', 'js3']
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var keys = _.map(user.usernames, function (un) {
        return userSchema.getRefKey('username', un)
      })

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok

        var resKeys = Object.keys(indexRes)

        _.each(resKeys, function (ik) {
          var v = indexRes[ik].value
          expect(v).to.be.ok
          expect(v.key).to.be.ok
          expect(v.key).to.equal(user.email)
        })

        done()
      })
    })
  })

  it('should index using array of reference documents - change', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, key: true, generate: false },
      usernames: [{ type: String, index: true, indexName: 'username' }]
    }, {
      refIndexKeyPrefix: 'app::dev::ref::',
      delimiter: '::'
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      usernames: ['js1', 'js2', 'js3']
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var keys = _.map(user.usernames, function (un) {
        return userSchema.getRefKey('username', un)
      })

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok

        var resKeys = Object.keys(indexRes)

        _.each(resKeys, function (ik) {
          var v = indexRes[ik].value
          expect(v).to.be.ok
          expect(v.key).to.be.ok
          expect(v.key).to.equal(user.email)
        })

        user.usernames = ['jsnew1', 'js2', 'jsnew3']

        user.save(function (err, savedDoc) {
          expect(err).to.not.be.ok
          expect(savedDoc).to.be.ok

          // check old ones
          keys = _.map(['js1', 'js3'], function (un) {
            return userSchema.getRefKey('username', un)
          })

          bucket.getMulti(keys, function (err, indexRes) {
            expect(err).to.be.ok
            expect(err).to.equal(2)

            keys = _.map(user.usernames, function (un) {
              return userSchema.getRefKey('username', un)
            })

            bucket.getMulti(keys, function (err, indexRes) {
              expect(err).to.not.be.ok
              expect(indexRes).to.be.ok

              var resKeys = Object.keys(indexRes)

              _.each(resKeys, function (ik) {
                var v = indexRes[ik].value
                expect(v).to.be.ok
                expect(v.key).to.be.ok
                expect(v.key).to.equal(user.email)
              })

              done()
            })
          })
        })
      })
    })
  })

  it('should not create index ref document for an embedded field if index not specified', function (done) {
    var fooSchema = lounge.schema({
      a: String,
      b: String
    })

    var Foo = lounge.model('Foo', fooSchema)

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      foo: { type: Foo }
    })

    var User = lounge.model('User', userSchema)

    expect(User.findByEmail).to.be.ok
    expect(User.findByEmail).to.be.an.instanceof(Function)
    expect(User.findByFoo).to.not.be.ok
    expect(User.findByFoo).to.not.be.an.instanceof(Function)

    var foo = new Foo({
      a: 'a1',
      b: 'b1'
    })

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      foo: foo
    })

    function checkRes (err, indexRes) {
      expect(err).to.not.be.ok
      expect(indexRes).to.be.ok
      var v = indexRes.value
      expect(v).to.be.ok
      expect(v.key).to.be.ok
      expect(v.key).to.equal(user.id)
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var emailKey = userSchema.getRefKey('email', user.email)
      var fooKey = userSchema.getRefKey('foo', user.foo.id)

      bucket.get(emailKey, function (err, indexRes) {
        checkRes(err, indexRes)

        bucket.get(fooKey, function (err, indexRes) {
          expect(err).to.be.ok
          expect(err.code).to.equal(couchbase.errors.keyNotFound)

          done()
        })
      })
    })
  })

  it('should create index ref document for an embedded field if specified', function (done) {
    var fooSchema = lounge.schema({
      a: String,
      b: String
    })

    var Foo = lounge.model('Foo', fooSchema)

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      foo: { type: Foo, index: true }
    })

    var User = lounge.model('User', userSchema)

    expect(User.findByEmail).to.be.ok
    expect(User.findByEmail).to.be.an.instanceof(Function)
    expect(User.findByFoo).to.be.ok
    expect(User.findByFoo).to.be.an.instanceof(Function)

    var foo = new Foo({
      a: 'a1',
      b: 'b1'
    })

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      foo: foo
    })

    function checkRes (err, indexRes) {
      expect(err).to.not.be.ok
      expect(indexRes).to.be.ok
      var v = indexRes.value
      expect(v).to.be.ok
      expect(v.key).to.be.ok
      expect(v.key).to.equal(user.id)
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var emailKey = userSchema.getRefKey('email', user.email)
      var fooKey = userSchema.getRefKey('foo', user.foo.id)

      bucket.get(emailKey, function (err, indexRes) {
        checkRes(err, indexRes)

        bucket.get(fooKey, function (err, indexRes) {
          expect(err).to.not.be.ok
          checkRes(err, indexRes)

          done()
        })
      })
    })
  })

  it('should create index ref documents for an array of an embedded field', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      company: [{ type: Company, index: true }]
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var company2 = new Company({
      name: 'BCorp',
      website: 'www.bcorp.com'
    })

    var user = new User({
      name: 'Bob Smith',
      company: [company, company2]
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var keys = _.map(user.company, function (c) {
        return userSchema.getRefKey('company', c.id)
      })

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok

        _.values(indexRes).forEach(function (ir) {
          expect(ir).to.be.ok
          expect(ir.value).to.be.ok
          expect(ir.value.key).to.be.ok
          expect(ir.value.key).to.equal(user.id)
        })

        done()
      })
    })
  })

  it('should create index ref document for a field of array index type', function (done) {
    var userSchema = lounge.schema({
      name: String,
      email: { type: String, index: true, indexType: 'array' }
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com'
    })

    var user2 = new User({
      name: 'Bob Jones',
      email: 'joe@gmail.com'
    })

    function checkRes (indexRes, expected) {
      expect(indexRes).to.be.ok
      expect(indexRes.value).to.be.ok
      expect(indexRes.value.keys).to.be.ok
      expect(indexRes.value.keys.sort()).to.deep.equal(expected)
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok

      user2.save(function (err, savedDoc) {
        var k = userSchema.getRefKey('email', user.email)
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok
          checkRes(indexRes, [user.id, user2.id].sort())

          user.email = 'joe2@gmail.com'

          user.save(function (err, indexRes) {
            expect(err).to.not.be.ok

            // old one
            k = userSchema.getRefKey('email', 'joe@gmail.com')
            bucket.get(k, function (err, indexRes) {
              expect(err).to.not.be.ok
              checkRes(indexRes, [user2.id])

              k = userSchema.getRefKey('email', user.email)
              bucket.get(k, function (err, indexRes) {
                checkRes(indexRes, [user.id])

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should create index ref documents for array index type', function (done) {
    var userSchema = lounge.schema({
      name: String,
      email: [{ type: String, index: true, indexType: 'array' }]
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      name: 'Joe Smith',
      email: ['joe@gmail.com', 'joe2@gmail.com']
    })

    var user2 = new User({
      name: 'Joe Jones',
      email: ['joe2@gmail.com', 'joe3@gmail.com']
    })

    function checkRes (indexRes, exptected) {
      expect(indexRes).to.be.ok
      expect(indexRes.value).to.be.ok
      expect(indexRes.value.keys).to.be.ok
      expect(indexRes.value.keys.sort()).to.deep.equal(exptected)
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok

      user2.save(function (err, savedDoc) {
        expect(err).to.not.be.ok

        var keys = _.map(['joe@gmail.com', 'joe2@gmail.com', 'joe3@gmail.com'], function (em) {
          return userSchema.getRefKey('email', em)
        })

        bucket.getMulti(keys, function (err, indexRes) {
          expect(err).to.not.be.ok

          var ex = [
            [user.id],
            [user.id, user2.id],
            [user2.id]
          ]
          _.values(indexRes).forEach(function (ir, i) {
            checkRes(ir, ex[i].sort())
          })

          user.email = ['joe2@gmail.com', 'joe4@gmail.com']

          user.save(function (err, indexRes) {
            expect(err).to.not.be.ok

            // old one
            var k = userSchema.getRefKey('email', 'joe@gmail.com')
            setTimeout(function () {
              bucket.get(k, function (err, indexRes) {
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                var keys = _.map(['joe2@gmail.com', 'joe3@gmail.com', 'joe4@gmail.com'], function (em) {
                  return userSchema.getRefKey('email', em)
                })

                bucket.getMulti(keys, function (err, indexRes) {
                  expect(err).to.not.be.ok

                  var ex = [
                    [user.id, user2.id],
                    [user2.id],
                    [user.id]
                  ]
                  _.values(indexRes).forEach(function (ir, i) {
                    checkRes(ir, ex[i].sort())
                  })

                  done()
                })
              })
            }, 20)
          })
        })
      })
    })
  })

  it('should create index ref document for an embedded field of array index type', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      company: { type: Company, index: true, indexType: 'array' }
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var user = new User({
      name: 'Bob Smith',
      company: company
    })

    var user2 = new User({
      name: 'Joe Jones',
      company: company
    })

    function checkRes (actual, expected) {
      expect(actual).to.be.ok
      expect(actual.value).to.be.ok
      expect(actual.value.keys).to.be.ok
      expect(actual.value.keys.sort()).to.deep.equal(expected.sort())
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var key = userSchema.getRefKey('company', company.id)

      bucket.get(key, function (err, indexRes) {
        expect(err).to.not.be.ok
        checkRes(indexRes, [user.id])

        user2.save(function (err, savedDoc) {
          expect(err).to.not.be.ok
          expect(savedDoc).to.be.ok

          bucket.get(key, function (err, indexRes) {
            expect(err).to.not.be.ok
            checkRes(indexRes, [user.id, user2.id])
            done()
          })
        })
      })
    })
  })

  it('should create index ref documents for an array of embedded field of array index type', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: false },
      company: [{ type: Company, index: true, indexType: 'array' }]
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var company2 = new Company({
      name: 'BCorp',
      website: 'www.bcorp.com'
    })

    var company3 = new Company({
      name: 'SeeInc',
      website: 'www.seeinc.com'
    })

    var user = new User({
      name: 'Bob Smith',
      email: 'bob@gmail.com',
      company: [company, company2]
    })

    var user2 = new User({
      name: 'Joe Jones',
      email: 'joe@gmail.com',
      company: [company2, company3]
    })

    function checkRes (actual, expected) {
      expect(actual).to.be.ok
      expect(actual.value).to.be.ok
      expect(actual.value.keys).to.be.ok
      expect(actual.value.keys.sort()).to.deep.equal(expected.sort())
    }

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var keys = _.map(user.company, function (c) {
        return userSchema.getRefKey('company', c.id)
      })

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok

        var expected = [
          [user.email],
          [user.email]
        ]

        _.values(indexRes).forEach(function (ir, i) {
          checkRes(ir, expected[i].sort())
        })

        user2.save(function (err, savedDoc) {
          expect(err).to.not.be.ok
          expect(savedDoc).to.be.ok

          keys = _.map([company, company2, company3], function (c) {
            return userSchema.getRefKey('company', c.id)
          })

          bucket.getMulti(keys, function (err, indexRes) {
            expect(err).to.not.be.ok

            expected = [
              [user.email],
              [user.email, user2.email],
              [user2.email]
            ]

            _.values(indexRes).forEach(function (ir, i) {
              checkRes(ir, expected[i].sort())
            })

            done()
          })
        })
      })
    })
  })

  it('should properly save the reference document for parallel requests referencing the same reference', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: false },
      company: { type: Company, index: true, indexType: 'array' }
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var user = new User({
      name: 'Bob Smith',
      email: 'bob@gmail.com',
      company: company.id
    })

    var user2 = new User({
      name: 'Joe Jones',
      email: 'joe@gmail.com',
      company: company.id
    })

    async.parallel([
      function (pcb) {
        user.save(pcb)
      },
      function (pcb) {
        user2.save(pcb)
      }
    ], function (err, res) {
      expect(err).to.not.be.ok
      setTimeout(function () {
        var refKey = userSchema.getRefKey('company', company.id)
        bucket.get(refKey, function (err, indexRes) {
          expect(err).to.not.be.ok
          expect(indexRes).to.be.ok
          expect(indexRes.value).to.be.ok
          expect(Array.isArray(indexRes.value.keys)).to.be.ok
          var expected = [user.email, user2.email]
          expect(indexRes.value.keys.sort()).to.deep.equal(expected.sort())
          done()
        })
      }, 50)
    })
  })

  it('should properly save the reference document for parallel requests referencing the same reference with wait for index', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: false },
      company: { type: Company, index: true, indexType: 'array' }
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var user = new User({
      name: 'Bob Smith',
      email: 'bob@gmail.com',
      company: company.id
    })

    var user2 = new User({
      name: 'Joe Jones',
      email: 'joe@gmail.com',
      company: company.id
    })

    async.parallel([
      function (pcb) {
        user.save({ waitForIndex: true }, pcb)
      },
      function (pcb) {
        user2.save({ waitForIndex: true }, pcb)
      }
    ], function (err, res) {
      expect(err).to.not.be.ok
      var refKey = userSchema.getRefKey('company', company.id)
      bucket.get(refKey, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok
        expect(indexRes.value).to.be.ok
        expect(Array.isArray(indexRes.value.keys)).to.be.ok
        var expected = [user.email, user2.email]
        expect(indexRes.value.keys.sort()).to.deep.equal(expected.sort())
        done()
      })
    })
  })
})
