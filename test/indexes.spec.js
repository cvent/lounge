/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
var testUtil = require('./helpers/utils')
var expect = require('chai').expect

var lounge = require('../')
var couchUtil = require('../dist/cbdocument.utils')

var bucket

describe('Model index tests', function () {
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

  describe('initial ref value and function creation tests with single index', function () {
    it('should create index values for a simple document', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true }
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByEmail).to.be.ok
      expect(User.findByEmail).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com'
      }

      var expected = {
        email: {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email',
          indexType: 'single'
        }
      }

      // we have to generate this manually since we don't have access to object internals
      // this has to match how we would use it in CouchDocument, specifically constructor to build the initial list
      var actual = couchUtil.buildRefValues(userSchema.indexes, data)

      expect(actual).to.deep.equal(expected)
    })

    it('should create index values for array and automatically singularize', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{ type: String, index: true }]
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByUsername).to.be.ok
      expect(User.findByUsername).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        usernames: ['user1', 'user2']
      }

      var expected = {
        'username': {
          path: 'usernames',
          value: ['user1', 'user2'],
          name: 'username',
          indexType: 'single'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index values for array and respect indexName', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{ type: String, index: true, indexName: 'UN' }]
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByUN).to.be.ok
      expect(User.findByUN).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        usernames: ['user1', 'user2']
      }

      var expected = {
        'UN': {
          path: 'usernames',
          value: ['user1', 'user2'],
          name: 'UN',
          indexType: 'single'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should not create index value for a ref field if not specified', function () {
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

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        foo: foo
      }

      var expected = {
        'email': {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email',
          indexType: 'single'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index value for a ref field if specified', function () {
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

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        foo: foo
      }

      var expected = {
        'email': {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email',
          indexType: 'single'
        },
        'foo': {
          path: 'foo',
          value: foo.id,
          name: 'foo',
          indexType: 'single'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index value for untruthy values', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true }
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByEmail).to.be.ok
      expect(User.findByEmail).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith'
      }

      var expected = {
        'email': {
          path: 'email',
          value: null,
          name: 'email',
          indexType: 'single'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })
  })

  describe('initial ref value and function creation tests with array index', function () {
    it('should create index values for a simple document', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true, indexType: 'array' }
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByEmail).to.be.ok
      expect(User.findByEmail).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com'
      }

      var expected = {
        email: {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email',
          indexType: 'array'
        }
      }

      // we have to generate this manually since we don't have access to object internals
      // this has to match how we would use it in CouchDocument, specifically constructor to build the initial list
      var actual = couchUtil.buildRefValues(userSchema.indexes, data)

      expect(actual).to.deep.equal(expected)
    })

    it('should create index values for array and automatically singularize', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{ type: String, index: true, indexType: 'array' }]
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByUsername).to.be.ok
      expect(User.findByUsername).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        usernames: ['user1', 'user2']
      }

      var expected = {
        'username': {
          path: 'usernames',
          value: ['user1', 'user2'],
          name: 'username',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index values for array and respect indexName', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{ type: String, index: true, indexName: 'UN', indexType: 'array' }]
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByUN).to.be.ok
      expect(User.findByUN).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        usernames: ['user1', 'user2']
      }

      var expected = {
        'UN': {
          path: 'usernames',
          value: ['user1', 'user2'],
          name: 'UN',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index values for nested values', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: String,
        company: {
          name: {
            type: String,
            index: true,
            indexName: 'company',
            indexType: 'array'
          }
        }
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByCompany).to.be.ok
      expect(User.findByCompany).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'jsmith@acme.inc',
        company: { name: 'Acme Inc' }
      }

      var expected = {
        'company': {
          path: 'company.name',
          value: 'Acme Inc',
          name: 'company',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index values for nested values through index function', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: String,
        company: {
          name: {
            type: String
          }
        }
      })

      userSchema.index('company.name', {indexName: 'company', indexType: 'array'})

      var User = lounge.model('User', userSchema)

      expect(User.findByCompany).to.be.ok
      expect(User.findByCompany).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'jsmith@acme.inc',
        company: { name: 'Acme Inc' }

      }

      var expected = {
        'company': {
          path: 'company.name',
          value: 'Acme Inc',
          name: 'company',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create compound index values for nested values', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: String,
        company: {
          name: String
        }
      })

      userSchema.index(['email', 'company.name'], { indexName: 'company', indexType: 'array' })

      var User = lounge.model('User', userSchema)

      expect(User.findByCompany).to.be.ok
      expect(User.findByCompany).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'jsmith@acme.inc',
        company: { name: 'Acme Inc' }

      }

      var expected = {
        'company': {
          path: ['email', 'company.name'],
          value: 'jsmith@acme.inc_Acme Inc',
          name: 'company',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it.skip('should create index values for nested values within an array', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: String,
        companies: [{
          name: {
            type: String,
            index: true,
            indexName: 'company',
            indexType: 'array'
          }
        }]
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByCompany).to.be.ok
      expect(User.findByCompany).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        companies: [
          { name: 'Acme Inc' },
          { name: 'Test Co' }
        ]
      }

      var expected = {
        'company': {
          path: 'company.name',
          value: ['Acme Inc', 'Test Co'],
          name: 'company',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should not create index value for a ref field if not specified', function () {
      var fooSchema = lounge.schema({
        a: String,
        b: String
      })

      var Foo = lounge.model('Foo', fooSchema)

      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true, indexType: 'array' },
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

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        foo: foo
      }

      var expected = {
        'email': {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index value for a ref field if specified', function () {
      var fooSchema = lounge.schema({
        a: String,
        b: String
      })

      var Foo = lounge.model('Foo', fooSchema)

      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true },
        foo: { type: Foo, index: true, indexType: 'array' }
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

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        foo: foo
      }

      var expected = {
        'email': {
          path: 'email',
          value: 'joe@gmail.com',
          name: 'email',
          indexType: 'single'
        },
        'foo': {
          path: 'foo',
          value: foo.id,
          name: 'foo',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index value for untruthy values', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true, indexType: 'array' }
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByEmail).to.be.ok
      expect(User.findByEmail).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith'
      }

      var expected = {
        'email': {
          path: 'email',
          value: null,
          name: 'email',
          indexType: 'array'
        }
      }

      var actualRefs = couchUtil.buildRefValues(userSchema.indexes, data)
      expect(actualRefs).to.deep.equal(expected)
    })

    it('should create index values for subdocument values', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        profile: {
          email: { type: String, index: true },
          profileType: String
        }
      })

      var User = lounge.model('User', userSchema)

      expect(User.findByEmail).to.be.ok
      expect(User.findByEmail).to.be.an.instanceof(Function)

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        profile: {
          email: 'joe@gmail.com',
          profileType: 'admin'
        }
      }

      var expected = {
        email: {
          path: 'profile.email',
          value: 'joe@gmail.com',
          name: 'email',
          indexType: 'single'
        }
      }

      // we have to generate this manually since we don't have access to object internals
      // this has to match how we would use it in CouchDocument, specifically constructor to build the initial list
      var actual = couchUtil.buildRefValues(userSchema.indexes, data)

      expect(actual).to.deep.equal(expected)
    })
  })
})
