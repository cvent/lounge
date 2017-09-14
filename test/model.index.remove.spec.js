/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
var couchbase = require('couchbase')
var testUtil = require('./helpers/utils')
var _ = require('lodash')
var expect = require('chai').expect

var lounge = require('../')

var bucket

describe('Model index on remove tests', function () {
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

  it('should remove index using simple reference document', function (done) {
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

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok
          expect(rdoc).to.be.ok
          expect(rdoc.id).to.be.ok

          bucket.get(rdoc.id, function (err, doc) {
            expect(doc).to.not.be.ok
            expect(err).to.be.ok
            expect(err.code).to.equal(couchbase.errors.keyNotFound)

            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              done()
            })
          })
        })
      })
    })
  })

  it('should remove index using simple reference document - promised', function (done) {
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

    var rdocId
    user.save().then(function (savedDoc) {
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('email', user.email)
      return lounge.get(k)
    }).then(function (indexRes) {
      expect(indexRes).to.be.ok
      expect(indexRes.value).to.be.ok
      expect(indexRes.value.key).to.be.ok
      expect(indexRes.value.key).to.equal(user.id)

      return user.remove()
    }).then(function (rdoc) {
      expect(rdoc).to.be.ok
      expect(rdoc.id).to.be.ok
      rdocId = rdoc.id
      return lounge.get(rdoc.id)
    }).then(function (doc) {
      expect(doc).to.not.be.ok
      var k = userSchema.getRefKey('email', user.email)
      return lounge.get(k)
    }).then(function (indexRes) {
      expect(indexRes).to.not.be.ok
    }).then(function () {
      // for sanity check with native bucket
      var k = userSchema.getRefKey('email', user.email)
      bucket.get(rdocId, function (err, doc) {
        expect(doc).to.not.be.ok
        expect(err).to.be.ok
        expect(err.code).to.equal(couchbase.errors.keyNotFound)

        bucket.get(k, function (err, indexRes) {
          expect(indexRes).to.not.be.ok
          expect(err).to.be.ok
          expect(err.code).to.equal(couchbase.errors.keyNotFound)

          done()
        })
      })
    }).catch(err => {
      expect(err).to.not.be.ok
    })
  })

  it('should remove index using simple reference document - change', function (done) {
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

        user.email = 'joe2@gmail.com'

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok
          expect(rdoc).to.be.ok
          expect(rdoc.id).to.be.ok

          bucket.get(rdoc.id, function (err, doc) {
            expect(doc).to.not.be.ok
            expect(err).to.be.ok
            expect(err.code).to.equal(couchbase.errors.keyNotFound)

            k = userSchema.getRefKey('email', 'joe2@gmail.com')
            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              k = userSchema.getRefKey('email', 'joe@gmail.com')
              bucket.get(k, function (err, indexRes) {
                expect(indexRes).to.not.be.ok
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should remove indexes using simple reference document using key options', function (done) {
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

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok

            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              bucket.get(user.email, function (err, indexRes) {
                expect(indexRes).to.not.be.ok
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should remove indexes using simple reference document using key options - change', function (done) {
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

          user.username = 'jsmith2'

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok

            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              bucket.get(user.email, function (err, indexRes) {
                expect(indexRes).to.not.be.ok
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should remove indexes for multiple simple reference documents', function (done) {
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

        k = userSchema.getRefKey('userName', user.username)
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok
          expect(indexRes).to.be.ok
          expect(indexRes.value).to.be.ok
          expect(indexRes.value.key).to.be.ok
          expect(indexRes.value.key).to.equal(user.id)

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok

            k = userSchema.getRefKey('email', user.email)
            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              k = userSchema.getRefKey('email', user.email)
              bucket.get(k, function (err, indexRes) {
                expect(indexRes).to.not.be.ok
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should remove indexes as array of reference documents', function (done) {
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

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok

          setTimeout(function () {
            bucket.getMulti(keys, function (num, indexRes) {
              expect(num).to.equal(3)
              _.each(indexRes, function (ik) {
                expect(ik.error).to.be.ok
                expect(ik.error.code).to.equal(couchbase.errors.keyNotFound)
              })

              done()
            })
          }, 100)
        })
      })
    })
  })

  it('should remove index using array of reference documents after change', function (done) {
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

      bucket.getMulti(keys, function (num, indexRes) {
        expect(num).to.equal(0)
        expect(indexRes).to.be.ok

        var resKeys = Object.keys(indexRes)

        _.each(resKeys, function (ik) {
          var v = indexRes[ik].value
          expect(v).to.be.ok
          expect(v.key).to.be.ok
          expect(v.key).to.equal(user.email)
        })

        user.usernames = ['jsnew1', 'js2', 'jsnew3']

        user.remove(function (err, savedDoc) {
          expect(err).to.not.be.ok
          expect(savedDoc).to.be.ok

          // check old ones
          keys = _.map(['js1', 'js3'], function (un) {
            return userSchema.getRefKey('username', un)
          })

          bucket.getMulti(keys, function (num, indexRes) {
            expect(num).to.equal(2)
            _.each(indexRes, function (ik) {
              expect(ik.error).to.be.ok
              expect(ik.error.code).to.equal(couchbase.errors.keyNotFound)
            })

            keys = _.map(user.usernames, function (un) {
              return userSchema.getRefKey('username', un)
            })

            bucket.getMulti(keys, function (num, indexRes) {
              expect(num).to.be.ok
              _.each(indexRes, function (ik) {
                expect(ik.error).to.be.ok
                expect(ik.error.code).to.equal(couchbase.errors.keyNotFound)
              })

              done()
            })
          })
        })
      })
    })
  })

  it('should remove embedded index using simple reference document', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: String,
      company: { type: Company, index: true }
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      company: company
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('company', company.id)
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok
        expect(indexRes.value).to.be.ok
        expect(indexRes.value.key).to.be.ok
        expect(indexRes.value.key).to.equal(user.id)

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok
          expect(rdoc).to.be.ok
          expect(rdoc.id).to.be.ok

          bucket.get(rdoc.id, function (err, doc) {
            expect(doc).to.not.be.ok
            expect(err).to.be.ok
            expect(err.code).to.equal(couchbase.errors.keyNotFound)

            bucket.get(company.id, function (err, cres) {
              expect(err).to.not.be.ok
              expect(cres).to.be.ok
              expect(cres.value).to.be.ok

              bucket.get(k, function (err, indexRes) {
                expect(indexRes).to.not.be.ok
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should remove embedded index using simple reference document - change', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: String,
      company: { type: Company, index: true }
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      company: company
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var k = userSchema.getRefKey('company', company.id)
      bucket.get(k, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok
        expect(indexRes.value).to.be.ok
        expect(indexRes.value.key).to.be.ok
        expect(indexRes.value.key).to.equal(user.id)

        user.company = 'company-id-2'

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok
          expect(rdoc).to.be.ok
          expect(rdoc.id).to.be.ok

          bucket.get(rdoc.id, function (err, doc) {
            expect(doc).to.not.be.ok
            expect(err).to.be.ok
            expect(err.code).to.equal(couchbase.errors.keyNotFound)

            k = userSchema.getRefKey('company', 'company-id-2')
            bucket.get(k, function (err, indexRes) {
              expect(indexRes).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              var k = userSchema.getRefKey('company', company.id)
              bucket.get(k, function (err, indexRes) {
                expect(indexRes).to.not.be.ok
                expect(err).to.be.ok
                expect(err.code).to.equal(couchbase.errors.keyNotFound)

                done()
              })
            })
          })
        })
      })
    })
  })

  it('should remove embedded indexes as array of reference documents', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: String,
      companies: [{ type: Company, index: true, indexName: 'company' }]
    }, {
      refIndexKeyPrefix: 'app::dev::ref::',
      delimiter: '::'
    })

    var User = lounge.model('User', userSchema)

    var company2 = new Company({
      name: 'Null inc.',
      website: 'www.null.com'
    })

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com'
    })

    user.companies.push(company2)

    user.save({ waitForIndex: true }, function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var keys = _.map(user.companies, function (un) {
        return userSchema.getRefKey('company', un.id)
      })

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok

        var resKeys = Object.keys(indexRes)

        _.each(resKeys, function (ik) {
          var v = indexRes[ik].value
          expect(v).to.be.ok
          expect(v.key).to.be.ok
          expect(v.key).to.equal(user.id)
        })

        user.remove(function (err, rdoc) {
          expect(err).to.not.be.ok

          setTimeout(function () {
            bucket.getMulti(keys, function (num, indexRes) {
              expect(num).to.be.ok
              _.each(indexRes, function (ik) {
                expect(ik.error).to.be.ok
                expect(ik.error.code).to.equal(couchbase.errors.keyNotFound)
              })

              done()
            })
          }, 100)
        })
      })
    })
  })

  it('should remove embedded document index using array of reference documents after change', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: String,
      companies: [{ type: Company, index: true, indexName: 'company' }]
    }, {
      refIndexKeyPrefix: 'app::dev::ref::',
      delimiter: '::'
    })

    var User = lounge.model('User', userSchema)

    var company2 = new Company({
      name: 'Null inc.',
      website: 'www.null.com'
    })

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com'
    })

    user.companies.push(company2)

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      var keys = _.map(user.companies, function (c) {
        return userSchema.getRefKey('company', c.id)
      })

      bucket.getMulti(keys, function (err, indexRes) {
        expect(err).to.not.be.ok
        expect(indexRes).to.be.ok

        var resKeys = Object.keys(indexRes)

        _.each(resKeys, function (ik) {
          var v = indexRes[ik].value
          expect(v).to.be.ok
          expect(v.key).to.be.ok
          expect(v.key).to.equal(user.id)
        })

        var company1 = new Company({
          name: 'DreamBig',
          website: 'www.dreambig.com'
        })

        var company2 = new Company({
          name: 'Lucki inc.',
          website: 'www.luckiing.com'
        })

        user.companies = [company1, company2]

        user.remove(function (err, savedDoc) {
          expect(err).to.not.be.ok
          expect(savedDoc).to.be.ok

          // check old ones
          keys = _.map([company1, company2], function (c) {
            return userSchema.getRefKey('company', c.id)
          })

          bucket.getMulti(keys, function (num, indexRes) {
            expect(num).to.be.ok
            _.each(indexRes, function (ik) {
              expect(ik.error).to.be.ok
              expect(ik.error.code).to.equal(couchbase.errors.keyNotFound)
            })

            keys = _.map(user.companies, function (un) {
              return userSchema.getRefKey('company', un.id)
            })

            bucket.getMulti(keys, function (num, indexRes) {
              expect(num).to.be.ok
              _.each(indexRes, function (ik) {
                expect(ik.error).to.be.ok
                expect(ik.error.code).to.equal(couchbase.errors.keyNotFound)
              })

              done()
            })
          })
        })
      })
    })
  })

  it('should remove array index using array reference document', function (done) {
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
      name: 'Joe Smith 2',
      email: 'joe@gmail.com'
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      user2.save({ waitForIndex: true }, function (err, savedDoc) {
        expect(err).to.not.be.ok
        expect(savedDoc).to.be.ok

        var k = userSchema.getRefKey('email', user.email)
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok
          expect(indexRes).to.be.ok
          expect(indexRes.value).to.be.ok
          expect(indexRes.value.keys).to.be.ok
          expect(indexRes.value.keys).to.be.an.instanceof(Array)
          expect(indexRes.value.keys.length).to.equal(2)

          var expectedUserIds = [user.id, user2.id].sort()
          var actualUserIds = indexRes.value.keys.sort()
          expect(actualUserIds).to.deep.equal(expectedUserIds)

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok
            expect(rdoc).to.be.ok
            expect(rdoc.id).to.be.ok

            bucket.get(rdoc.id, function (err, doc) {
              expect(doc).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              bucket.get(user2.id, function (err, doc) {
                expect(err).to.not.be.ok
                expect(rdoc).to.be.ok

                bucket.get(k, function (err, indexRes) {
                  expect(err).to.not.be.ok
                  expect(indexRes).to.be.ok
                  expect(indexRes.value).to.be.ok
                  expect(indexRes.value.keys).to.be.ok
                  expect(indexRes.value.keys).to.be.an.instanceof(Array)
                  expect(indexRes.value.keys.length).to.equal(1)

                  expect(indexRes.value.keys).to.deep.equal([user2.id])

                  user2.remove(function (err, rdoc) {
                    expect(err).to.not.be.ok
                    expect(rdoc).to.be.ok
                    expect(rdoc.id).to.be.ok

                    setTimeout(function () {
                      bucket.get(k, function (err, indexRes) {
                        expect(indexRes).to.not.be.ok
                        expect(err).to.be.ok
                        expect(err.code).to.equal(couchbase.errors.keyNotFound)
                        done()
                      })
                    }, 50)
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  it('should remove array index using array reference document in array definition', function (done) {
    var userSchema = lounge.schema({
      name: String,
      email: [{ type: String, index: true, indexType: 'array' }]
    })

    var User = lounge.model('User', userSchema)

    var user = new User({
      name: 'Joe Smith',
      email: ['joe1@gmail.com', 'joe2@gmail.com']
    })

    var user2 = new User({
      name: 'Joe Smith 2',
      email: ['joe2@gmail.com', 'joe3@gmail.com', 'joe4@gmail.com']
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      user2.save({ waitForIndex: true }, function (err, savedDoc) {
        expect(err).to.not.be.ok
        expect(savedDoc).to.be.ok

        var keys = _.map(user.email, function (e) {
          return userSchema.getRefKey('email', e)
        })

        bucket.getMulti(keys, function (err, getRes) {
          expect(err).to.not.be.ok
          var indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
            return ir.keys.length
          }).value()

          var expected = [{
            keys: [user.id]
          },
          {
            keys: [user.id, user2.id].sort()
          }
          ]

          expect(indexResults.length).to.equal(2)
          expect(indexResults[1]).to.be.ok
          expect(indexResults[1].keys).to.be.ok
          indexResults[1].keys.sort()
          expect(indexResults).to.deep.equal(expected)

          var keys2 = _.map(user2.email, function (e) {
            return userSchema.getRefKey('email', e)
          })

          bucket.getMulti(keys2, function (err, getRes) {
            expect(err).to.not.be.ok
            indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
              return ir.keys.length
            }).value()

            expected = [{
              keys: [user2.id]
            },
            {
              keys: [user2.id]
            },
            {
              keys: [user.id, user2.id].sort()
            }
            ]

            expect(indexResults.length).to.equal(3)
            expect(indexResults[2]).to.be.ok
            expect(indexResults[2].keys).to.be.ok
            indexResults[2].keys.sort()
            expect(indexResults).to.deep.equal(expected)

            user.remove(function (err, rdoc) {
              expect(err).to.not.be.ok
              setTimeout(function () {
                bucket.getMulti(keys, function (err, getRes) {
                  expect(err).to.equal(1)

                  var indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
                    if (ir && ir.keys) return ir.keys.length
                  }).compact().value()

                  var expected = [{
                    keys: [user2.id]
                  }]

                  expect(indexResults).to.deep.equal(expected)

                  user2.remove(function (err, rdoc) {
                    expect(err).to.not.be.ok
                    setTimeout(function () {
                      bucket.getMulti(keys2, function (err, getRes) {
                        expect(err).to.equal(3)
                        var indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
                          if (ir && ir.keys) return ir.keys.length
                        }).compact().value()

                        expect(indexResults).to.deep.equal([])
                        return done()
                      })
                    }, 50)
                  })
                })
              }, 50)
            })
          })
        })
      })
    })
  })

  it('should remove embedded array index using array reference document', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: 'false' },
      company: { type: Company, index: true, indexType: 'array' }
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      company: company
    })

    var user2 = new User({
      name: 'Bob Jones',
      email: 'bob@gmail.com',
      company: company
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      user2.save(function (err, savedDoc) {
        expect(err).to.not.be.ok
        expect(savedDoc).to.be.ok

        var k = userSchema.getRefKey('company', company.id)
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok
          expect(indexRes).to.be.ok
          expect(indexRes.value).to.be.ok
          expect(indexRes.value.keys).to.be.ok
          expect(indexRes.value.keys).to.be.an.instanceof(Array)
          expect(indexRes.value.keys.length).to.equal(2)

          var expectedUserIds = [user.email, user2.email].sort()
          var actualUserIds = indexRes.value.keys.sort()
          expect(actualUserIds).to.deep.equal(expectedUserIds)

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok
            expect(rdoc).to.be.ok

            bucket.get(rdoc.email, function (err, doc) {
              expect(doc).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              bucket.get(user2.email, function (err, doc) {
                expect(err).to.not.be.ok
                expect(rdoc).to.be.ok

                bucket.get(k, function (err, indexRes) {
                  expect(err).to.not.be.ok
                  expect(indexRes).to.be.ok
                  expect(indexRes.value).to.be.ok
                  expect(indexRes.value.keys).to.be.ok
                  expect(indexRes.value.keys).to.be.an.instanceof(Array)
                  expect(indexRes.value.keys.length).to.equal(1)

                  expect(indexRes.value.keys).to.deep.equal([user2.email])

                  user2.remove(function (err, rdoc) {
                    expect(err).to.not.be.ok
                    expect(rdoc).to.be.ok
                    expect(rdoc.email).to.be.ok

                    bucket.get(company.id, function (err, cres) {
                      expect(err).to.not.be.ok
                      expect(cres).to.be.ok
                      expect(cres.value).to.be.ok

                      setTimeout(function () {
                        bucket.get(k, function (err, indexRes) {
                          expect(indexRes).to.not.be.ok
                          expect(err).to.be.ok
                          expect(err.code).to.equal(couchbase.errors.keyNotFound)
                          done()
                        })
                      }, 20)
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  it('should remove embedded array index using array reference document after change', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      email: { type: String, key: true, generate: 'false' },
      company: { type: Company, index: true, indexType: 'array' }
    })

    var User = lounge.model('User', userSchema)

    var company = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var user = new User({
      name: 'Joe Smith',
      email: 'joe@gmail.com',
      company: company
    })

    var user2 = new User({
      name: 'Bob Jones',
      email: 'bob@gmail.com',
      company: company
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      user2.save({ waitForIndex: true }, function (err, savedDoc) {
        expect(err).to.not.be.ok
        expect(savedDoc).to.be.ok

        var k = userSchema.getRefKey('company', company.id)
        bucket.get(k, function (err, indexRes) {
          expect(err).to.not.be.ok
          expect(indexRes).to.be.ok
          expect(indexRes.value).to.be.ok
          expect(indexRes.value.keys).to.be.ok
          expect(indexRes.value.keys).to.be.an.instanceof(Array)
          expect(indexRes.value.keys.length).to.equal(2)

          var expectedUserIds = [user.email, user2.email].sort()
          var actualUserIds = indexRes.value.keys.sort()
          expect(actualUserIds).to.deep.equal(expectedUserIds)

          var company2 = new Company({
            name: 'DreamCo',
            website: 'www.dreamco.com'
          })

          user.company = company2

          user.remove(function (err, rdoc) {
            expect(err).to.not.be.ok
            expect(rdoc).to.be.ok

            bucket.get(rdoc.email, function (err, doc) {
              expect(doc).to.not.be.ok
              expect(err).to.be.ok
              expect(err.code).to.equal(couchbase.errors.keyNotFound)

              bucket.get(user2.email, function (err, doc) {
                expect(err).to.not.be.ok
                expect(rdoc).to.be.ok

                bucket.get(k, function (err, indexRes) {
                  expect(err).to.not.be.ok
                  expect(indexRes).to.be.ok
                  expect(indexRes.value).to.be.ok
                  expect(indexRes.value.keys).to.be.ok
                  expect(indexRes.value.keys).to.be.an.instanceof(Array)
                  expect(indexRes.value.keys.length).to.equal(1)

                  expect(indexRes.value.keys).to.deep.equal([user2.email])

                  user2.remove(function (err, rdoc) {
                    expect(err).to.not.be.ok
                    expect(rdoc).to.be.ok
                    expect(rdoc.email).to.be.ok

                    bucket.get(company.id, function (err, cres) {
                      expect(err).to.not.be.ok
                      expect(cres).to.be.ok
                      expect(cres.value).to.be.ok

                      setTimeout(function () {
                        bucket.get(k, function (err, indexRes) {
                          expect(indexRes).to.not.be.ok
                          expect(err).to.be.ok
                          expect(err.code).to.equal(couchbase.errors.keyNotFound)
                          done()
                        })
                      }, 20)
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  it('should remove embedded array indexes as array of reference documents in array definition', function (done) {
    var companySchema = {
      name: String,
      website: String
    }

    var Company = lounge.model('Company', companySchema)

    var userSchema = lounge.schema({
      name: String,
      companies: [{ type: Company, index: true, indexName: 'company', indexType: 'array' }]
    })

    var User = lounge.model('User', userSchema)

    var company1 = new Company({
      name: 'Acme',
      website: 'www.acme.com'
    })

    var company2 = new Company({
      name: 'Null inc.',
      website: 'www.null.com'
    })

    var company3 = new Company({
      name: 'DreamCo',
      website: 'www.dream.co'
    })

    var company4 = new Company({
      name: 'Blizzard',
      website: 'www.blizzard.co'
    })

    var user = new User({
      name: 'Joe Smith',
      companies: [company1]
    })

    user.companies.push(company2)

    var user2 = new User({
      name: 'Joe Smith',
      companies: [company2, company3, company4]
    })

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok
      expect(savedDoc).to.be.ok

      user2.save(function (err, savedDoc) {
        expect(err).to.not.be.ok
        expect(savedDoc).to.be.ok

        var keys = _.map(user.companies, function (c) {
          return userSchema.getRefKey('company', c.id)
        })

        bucket.getMulti(keys, function (err, getRes) {
          expect(err).to.not.be.ok
          var indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
            return ir.keys.length
          }).value()

          var expected = [{
            keys: [user.id]
          },
          {
            keys: [user.id, user2.id]
          }
          ]

          expect(indexResults).to.deep.equal(expected)

          var keys2 = _.map(user2.companies, function (c) {
            return userSchema.getRefKey('company', c.id)
          })

          bucket.getMulti(keys2, function (err, getRes) {
            expect(err).to.not.be.ok
            indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
              return ir.keys.length
            }).value()

            expected = [{
              keys: [user2.id]
            },
            {
              keys: [user2.id]
            },
            {
              keys: [user.id, user2.id]
            }
            ]

            expect(indexResults).to.deep.equal(expected)

            user.remove(function (err, rdoc) {
              expect(err).to.not.be.ok
              setTimeout(function () {
                bucket.getMulti(keys, function (err, getRes) {
                  expect(err).to.equal(1)

                  var indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
                    if (ir && ir.keys) return ir.keys.length
                  }).compact().value()

                  var expected = [{
                    keys: [user2.id]
                  }]

                  expect(indexResults).to.deep.equal(expected)

                  user2.remove(function (err, rdoc) {
                    expect(err).to.not.be.ok
                    setTimeout(function () {
                      bucket.getMulti(keys2, function (err, getRes) {
                        expect(err).to.equal(3)
                        var indexResults = _.chain(getRes).values().map('value').sortBy(function (ir) {
                          if (ir && ir.keys) return ir.keys.length
                        }).compact().value()

                        expect(indexResults).to.deep.equal([])
                        return done()
                      })
                    }, 50)
                  })
                })
              }, 50)
            })
          })
        })
      })
    })
  })
})
