/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
var _ = require('lodash')
var testUtil = require('./helpers/utils')
var expect = require('chai').expect
var ts = require('./helpers/findbyid_setup')

var lounge = require('../')

var bucket
var User1, User2, User3, Company

describe('Model findById tests', function () {
  before(function (done) {
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
      }, function (err) {
        if (err) {
          return done(err)
        }

        bucket.manager().flush(function (err) {
          if (err) {
            return done(err)
          }
          ts.setup(bucket, done)
        })
      })
    })
  })

  describe('with normal self generated ids', function () {
    before(function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      })

      User1 = lounge.model('User', userSchema)
    })

    it('should find a simple document', function (done) {
      var userId = ts.data.users[0].id
      var userData = ts.data.users[0]

      User1.findById(userId, function (err, rdoc) {
        expect(err).to.not.be.ok

        expect(rdoc).to.be.ok
        expect(rdoc).to.be.an('object')
        expect(rdoc).to.be.an.instanceof(User1)
        expect(rdoc.id).to.be.ok
        expect(rdoc.id).to.be.a('string')

        expect(rdoc.id).to.equal(userData.id)
        expect(rdoc.firstName).to.equal(userData.firstName)
        expect(rdoc.lastName).to.equal(userData.lastName)
        expect(rdoc.email).to.equal(userData.email)
        expect(rdoc.dateOfBirth).to.be.ok
        expect(rdoc.dateOfBirth).to.be.an.instanceof(Date)

        // check CAS this is first time where we would get it
        var cas1 = rdoc.getCAS()
        expect(cas1).to.be.a('string')

        var cas2 = rdoc.getCAS(true)
        expect(cas2).to.be.instanceof(Object)

        var cas3 = rdoc.cas
        expect(cas3).to.be.a('string')

        done()
      })
    })

    it('should find a simple document - promised', function (done) {
      var userId = ts.data.users[0].id
      var userData = ts.data.users[0]

      User1.findById(userId).then(function (rdoc) {
        expect(rdoc).to.be.ok
        expect(rdoc).to.be.an('object')
        expect(rdoc).to.be.an.instanceof(User1)
        expect(rdoc.id).to.be.ok
        expect(rdoc.id).to.be.a('string')

        expect(rdoc.id).to.equal(userData.id)
        expect(rdoc.firstName).to.equal(userData.firstName)
        expect(rdoc.lastName).to.equal(userData.lastName)
        expect(rdoc.email).to.equal(userData.email)
        expect(rdoc.dateOfBirth).to.be.ok
        expect(rdoc.dateOfBirth).to.be.an.instanceof(Date)

        // check CAS this is first time where we would get it
        var cas1 = rdoc.getCAS()
        expect(cas1).to.be.a('string')

        var cas2 = rdoc.getCAS(true)
        expect(cas2).to.be.instanceof(Object)

        var cas3 = rdoc.cas
        expect(cas3).to.be.a('string')

        done()
      })
    })

    it('should find an array of documents', function (done) {
      var userIds = _.map(ts.data.users, 'id')
      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          expect(missing).to.deep.equal([])

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents - promised', function (done) {
      var userIds = _.map(ts.data.users, 'id')
      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds).then(function (docs) {
        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents and also return missing keys', function (done) {
      var userIds = _.map(ts.data.users, 'id')
      var missingId = 'd2bed65a-1910-4730-b032-0c4ea0f831dd'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          expect(missing).to.deep.equal([missingId])

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents and also return missing keys - promised', function (done) {
      var userIds = _.map(ts.data.users, 'id')
      var missingId = 'd2bed65a-1910-4730-b032-0c4ea0f831dd'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds).then(function (docs) {
        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })
  })

  describe('with generated id with prefix', function () {
    before(function () {
      var companySchema = lounge.schema({
        id: { type: String, key: true, generate: true, prefix: 'company::' },
        name: String,
        streetAddress: String,
        city: String,
        country: String,
        state: String,
        postalCode: String,
        founded: Date
      })

      Company = lounge.model('Company', companySchema)
    })

    it('should find a simple document', function (done) {
      var docId = ts.data.companies[0].id.replace(/company::/i, '')
      var expectedData = ts.data.companies[0]

      Company.findById(docId, function (err, rdoc) {
        expect(err).to.not.be.ok

        expect(rdoc).to.be.ok
        expect(rdoc).to.be.an('object')
        expect(rdoc).to.be.an.instanceof(Company)
        expect(rdoc.id).to.be.ok
        expect(rdoc.id).to.be.a('string')

        expect(rdoc.id).to.equal(expectedData.id)
        expect(rdoc.name).to.equal(expectedData.name)
        expect(rdoc.streetAddress).to.equal(expectedData.streetAddress)
        expect(rdoc.city).to.equal(expectedData.city)
        expect(rdoc.country).to.equal(expectedData.country)
        expect(rdoc.state).to.equal(expectedData.state)
        expect(rdoc.founded).to.be.ok
        expect(rdoc.founded).to.be.an.instanceof(Date)

        var cas1 = rdoc.getCAS()
        expect(cas1).to.be.a('string')

        var cas2 = rdoc.getCAS(true)
        expect(cas2).to.be.instanceof(Object)

        var cas3 = rdoc.cas
        expect(cas3).to.be.a('string')

        done()
      })
    })

    it('should find an array of documents', function (done) {
      var docIds = _.map(ts.data.companies, 'id')
      docIds = _.map(docIds, function (docid) {
        return docid.replace(/company::/i, '')
      })

      var expectedDocs = _.sortBy(ts.data.companies, 'id')

      Company.findById(docIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.companies.length)

        var actualDocs = _.sortBy(docs, 'id')

        actualDocs.forEach(function (rdoc, index) {
          var expectedData = expectedDocs[index]

          expect(rdoc).to.be.ok
          expect(rdoc).to.be.an('object')
          expect(rdoc).to.be.an.instanceof(Company)
          expect(rdoc.id).to.be.ok
          expect(rdoc.id).to.be.a('string')

          expect(rdoc.id).to.equal(expectedData.id)
          expect(rdoc.name).to.equal(expectedData.name)
          expect(rdoc.streetAddress).to.equal(expectedData.streetAddress)
          expect(rdoc.city).to.equal(expectedData.city)
          expect(rdoc.country).to.equal(expectedData.country)
          expect(rdoc.state).to.equal(expectedData.state)
          expect(rdoc.founded).to.be.ok
          expect(rdoc.founded).to.be.an.instanceof(Date)

          expect(missing).to.deep.equal([])

          // check CAS this is first time where we would get it
          var cas1 = rdoc.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = rdoc.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = rdoc.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents and also return missing keys', function (done) {
      var docIds = _.map(ts.data.companies, 'id')
      docIds = _.map(docIds, function (docid) {
        return docid.replace(/company::/i, '')
      })

      var expectedDocs = _.sortBy(ts.data.companies, 'id')

      var missingId1 = 'd2bed65a-1910-4730-b032-0c4ea0f831dd'
      var missingId2 = ts.data.users[0].id
      docIds.splice(2, 0, missingId1)
      docIds.splice(4, 0, missingId2)

      var expectedMissing = ['company::' + missingId1, 'company::' + missingId2].sort()

      Company.findById(docIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        var actualDocs = _.sortBy(docs, 'id')

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.companies.length)

        actualDocs.forEach(function (rdoc, index) {
          var expectedData = expectedDocs[index]

          expect(rdoc).to.be.ok
          expect(rdoc).to.be.an('object')
          expect(rdoc).to.be.an.instanceof(Company)
          expect(rdoc.id).to.be.ok
          expect(rdoc.id).to.be.a('string')

          expect(rdoc.id).to.equal(expectedData.id)
          expect(rdoc.name).to.equal(expectedData.name)
          expect(rdoc.streetAddress).to.equal(expectedData.streetAddress)
          expect(rdoc.city).to.equal(expectedData.city)
          expect(rdoc.country).to.equal(expectedData.country)
          expect(rdoc.state).to.equal(expectedData.state)
          expect(rdoc.founded).to.be.ok
          expect(rdoc.founded).to.be.an.instanceof(Date)

          expect(missing).to.deep.equal(expectedMissing)

          // check CAS this is first time where we would get it
          var cas1 = rdoc.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = rdoc.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = rdoc.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })
  })

  describe('with supplied id', function () {
    before(function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: { type: String, key: true, generate: false },
        password: String
      })

      User2 = lounge.model('User2', userSchema)
    })

    it('should find a simple document', function (done) {
      var userId = ts.data.users2[0].email
      var userData = ts.data.users2[0]

      User2.findById(userId, function (err, rdoc) {
        expect(err).to.not.be.ok

        expect(rdoc).to.be.ok
        expect(rdoc).to.be.an('object')
        expect(rdoc).to.be.an.instanceof(User2)
        expect(rdoc.id).to.not.be.ok

        expect(rdoc.firstName).to.equal(userData.firstName)
        expect(rdoc.lastName).to.equal(userData.lastName)
        expect(rdoc.email).to.equal(userData.email)
        expect(rdoc.password).to.equal(userData.password)

        done()
      })
    })

    it('should find an array of documents', function (done) {
      var userIds = _.map(ts.data.users2, 'email')
      var expectedUsers = _.sortBy(ts.data.users2, 'email')

      User2.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users2.length)

        var actualUsers = _.sortBy(docs, 'email')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User2)
          expect(au.id).to.not.be.ok

          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.password).to.equal(userData.password)

          expect(missing).to.deep.equal([])
        })

        done()
      })
    })

    it('should find an array of documents and also return missing keys', function (done) {
      var userIds = _.map(ts.data.users2, 'email')

      var missingId = 'test@gmail.com'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users2, 'email')

      User2.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users2.length)

        var actualUsers = _.sortBy(docs, 'email')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User2)
          expect(au.id).to.not.be.ok

          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.password).to.equal(userData.password)

          expect(missing).to.deep.equal([missingId])
        })

        done()
      })
    })
  })

  describe('with supplied id with prefix', function () {
    before(function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        username: { type: String, key: true, generate: false, prefix: 'user::' },
        password: String
      })

      User3 = lounge.model('User3', userSchema)
    })

    it('should find a simple document', function (done) {
      var userId = ts.data.users3[0].username.replace(/user::/i, '')
      var userData = ts.data.users3[0]

      User3.findById(userId, function (err, rdoc) {
        expect(err).to.not.be.ok

        expect(rdoc).to.be.ok
        expect(rdoc).to.be.an('object')
        expect(rdoc).to.be.an.instanceof(User3)
        expect(rdoc.id).to.not.be.ok

        expect(rdoc.firstName).to.equal(userData.firstName)
        expect(rdoc.lastName).to.equal(userData.lastName)
        expect(rdoc.email).to.equal(userData.email)
        expect(rdoc.password).to.equal(userData.password)
        expect(rdoc.username).to.equal(userData.username)

        done()
      })
    })

    it('should find an array of documents', function (done) {
      var userIds = _.map(ts.data.users3, 'username')
      userIds = _.map(userIds, function (cid) {
        return cid.replace(/user::/i, '')
      })

      var expectedUsers = _.sortBy(ts.data.users3, 'username')

      User3.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users3.length)

        var actualUsers = _.sortBy(docs, 'username')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User3)
          expect(au.id).to.not.be.ok

          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.password).to.equal(userData.password)
          expect(au.username).to.equal(userData.username)

          expect(missing).to.deep.equal([])
        })

        done()
      })
    })

    it('should find an array of documents and also return missing keys', function (done) {
      var userIds = _.map(ts.data.users3, 'username')

      userIds = _.map(userIds, function (cid) {
        return cid.replace(/user::/i, '')
      })

      var missingId = 'asdfuser'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users3, 'email')

      User3.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users3.length)

        var actualUsers = _.sortBy(docs, 'email')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User3)
          expect(au.id).to.not.be.ok

          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.password).to.equal(userData.password)

          expect(missing).to.deep.equal(['user::' + missingId])
        })

        done()
      })
    })

    it('should find an array of documents and keep the order', function (done) {
      var userIds = _.map(ts.data.users3, 'username')

      userIds = _.map(userIds, function (cid) {
        return cid.replace(/user::/i, '')
      })

      userIds = _.reverse(userIds.sort())

      User3.findById(userIds, { keepSortOrder: true }, function (err, docs, missing) {
        expect(err).to.not.be.ok
        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users3.length)

        var actualUserIds = []
        docs.forEach(function (d) {
          actualUserIds.push(d.username.replace(/user::/i, ''))
        })

        expect(actualUserIds).to.deep.equal(userIds)
        done()
      })
    })
  })

  describe('with missing config option', function () {
    before(function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      })

      User1 = lounge.model('User', userSchema)
    })

    it('should find a simple document and not return any missing', function (done) {
      lounge.setOption('missing', false)

      var userId = ts.data.users[0].id
      var userData = ts.data.users[0]

      User1.findById(userId, function (err, rdoc, missing) {
        expect(err).to.not.be.ok
        expect(missing).to.not.be.ok

        expect(rdoc).to.be.ok
        expect(rdoc).to.be.an('object')
        expect(rdoc).to.be.an.instanceof(User1)
        expect(rdoc.id).to.be.ok
        expect(rdoc.id).to.be.a('string')

        expect(rdoc.id).to.equal(userData.id)
        expect(rdoc.firstName).to.equal(userData.firstName)
        expect(rdoc.lastName).to.equal(userData.lastName)
        expect(rdoc.email).to.equal(userData.email)
        expect(rdoc.dateOfBirth).to.be.ok
        expect(rdoc.dateOfBirth).to.be.an.instanceof(Date)

        // check CAS this is first time where we would get it
        var cas1 = rdoc.getCAS()
        expect(cas1).to.be.a('string')

        var cas2 = rdoc.getCAS(true)
        expect(cas2).to.be.instanceof(Object)

        var cas3 = rdoc.cas
        expect(cas3).to.be.a('string')

        done()
      })
    })

    it('should find an array of documents and not return any missing', function (done) {
      lounge.setOption('missing', false)
      var userIds = _.map(ts.data.users, 'id')
      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          expect(missing).to.not.be.ok

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents and also NOT return missing keys', function (done) {
      lounge.setOption('missing', false)
      var userIds = _.map(ts.data.users, 'id')
      var missingId = 'd2bed65a-1910-4730-b032-0c4ea0f831dd'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          expect(missing).to.not.be.ok

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })
  })

  describe('with missing option', function () {
    before(function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      })

      User1 = lounge.model('User', userSchema)
    })

    it('should find a simple document and return undefined missing', function (done) {
      var userId = ts.data.users[0].id
      var userData = ts.data.users[0]

      User1.findById(userId, { missing: false }, function (err, rdoc, missing) {
        expect(err).to.not.be.ok
        expect(missing).to.not.be.ok

        expect(rdoc).to.be.ok
        expect(rdoc).to.be.an('object')
        expect(rdoc).to.be.an.instanceof(User1)
        expect(rdoc.id).to.be.ok
        expect(rdoc.id).to.be.a('string')

        expect(rdoc.id).to.equal(userData.id)
        expect(rdoc.firstName).to.equal(userData.firstName)
        expect(rdoc.lastName).to.equal(userData.lastName)
        expect(rdoc.email).to.equal(userData.email)
        expect(rdoc.dateOfBirth).to.be.ok
        expect(rdoc.dateOfBirth).to.be.an.instanceof(Date)

        // check CAS this is first time where we would get it
        var cas1 = rdoc.getCAS()
        expect(cas1).to.be.a('string')

        var cas2 = rdoc.getCAS(true)
        expect(cas2).to.be.instanceof(Object)

        var cas3 = rdoc.cas
        expect(cas3).to.be.a('string')

        done()
      })
    })

    it('should find an array of documents and return undefined missing', function (done) {
      var userIds = _.map(ts.data.users, 'id')
      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, { missing: false }, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          expect(missing).to.not.be.ok

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents and return undefined missing', function (done) {
      var userIds = _.map(ts.data.users, 'id')
      var missingId = 'd2bed65a-1910-4730-b032-0c4ea0f831dd'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, { missing: false }, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          expect(missing).to.not.be.ok

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents and also return missing keys because of missing option', function (done) {
      lounge.setOption('missing', false)
      var userIds = _.map(ts.data.users, 'id')
      var missingId = 'd2bed65a-1910-4730-b032-0c4ea0f831dd'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, { missing: true }, function (err, docs, missing) {
        expect(err).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          expect(missing).to.deep.equal([missingId])

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })

    it('should find an array of documents and also return undefined missing because of missing option', function (done) {
      lounge.setOption('missing', true)
      var userIds = _.map(ts.data.users, 'id')
      var missingId = 'd2bed65a-1910-4730-b032-0c4ea0f831dd'
      userIds.splice(2, 0, missingId)

      var expectedUsers = _.sortBy(ts.data.users, 'id')

      User1.findById(userIds, { missing: false }, function (err, docs, missing) {
        expect(err).to.not.be.ok
        expect(missing).to.not.be.ok

        expect(docs).to.be.an.instanceof(Array)
        expect(docs.length).to.equal(ts.data.users.length)

        var actualUsers = _.sortBy(docs, 'id')

        actualUsers.forEach(function (au, index) {
          var userData = expectedUsers[index]

          expect(au).to.be.ok
          expect(au).to.be.an('object')
          expect(au).to.be.an.instanceof(User1)
          expect(au.id).to.be.ok
          expect(au.id).to.be.a('string')

          expect(au.id).to.equal(userData.id)
          expect(au.firstName).to.equal(userData.firstName)
          expect(au.lastName).to.equal(userData.lastName)
          expect(au.email).to.equal(userData.email)
          expect(au.dateOfBirth).to.be.ok
          expect(au.dateOfBirth).to.be.an.instanceof(Date)

          var cas1 = au.getCAS()
          expect(cas1).to.be.a('string')

          var cas2 = au.getCAS(true)
          expect(cas2).to.be.instanceof(Object)

          var cas3 = au.cas
          expect(cas3).to.be.a('string')
        })

        done()
      })
    })
  })
})
