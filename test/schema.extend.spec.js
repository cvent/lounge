/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
var testUtil = require('./helpers/utils')
var expect = require('chai').expect

var lounge2 = require('../')
var lounge

var bucket

describe('Schema extend tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect()
    }

    lounge = new lounge2.Lounge() // recreate it

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

  it('should extend schema and have base properties', function () {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    })

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    })

    userSchema.extend(baseSchema)

    expect(userSchema.descriptor).to.be.ok
    expect(userSchema.descriptor).to.be.an('object')
    expect(userSchema.descriptor.metadata).to.be.ok
    expect(userSchema.descriptor.metadata.objectType).to.be.ok
    expect(userSchema.descriptor.metadata.objectType.schema).to.be.ok
    expect(userSchema.descriptor.metadata.objectType.schema.descriptor).to.be.ok
    expect(userSchema.descriptor.metadata.objectType.schema.descriptor.createdAt).to.be.ok
    expect(userSchema.descriptor.metadata.objectType.schema.descriptor.updatedAt).to.be.ok
  })

  it('should be able to create an object with extended schema properties', function () {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    })

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    })

    userSchema.extend(baseSchema)

    var User = lounge.model('User', userSchema)

    var dob = new Date('March 3, 1990 03:30:00')
    var now = new Date()

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      dateOfBirth: dob,
      metadata: {
        createdAt: now
      }
    })

    expect(user).to.be.ok
    expect(user).to.be.an.instanceof(User)
    expect(user).to.be.an.instanceof(lounge.Model)
    expect(user.id).to.be.ok
    expect(user.id).to.be.a('string')

    expect(user.firstName).to.equal('Joe')
    expect(user.lastName).to.equal('Smith')
    expect(user.email).to.equal('joe@gmail.com')
    expect(user.dateOfBirth).to.be.ok
    expect(user.dateOfBirth).to.be.an.instanceof(Date)
    expect(user.dateOfBirth.toISOString()).to.equal(dob.toISOString())
    expect(user.metadata).to.be.ok
    expect(user.metadata).to.be.an('object')
    expect(user.metadata.createdAt).to.be.ok
    expect(user.metadata.createdAt).to.be.an.instanceof(Date)
    expect(user.metadata.createdAt.toISOString()).to.equal(now.toISOString())
    expect(user.metadata.updatedAt).to.not.be.ok
  })

  it('should be able to create an object with extended schema properties and respect base and our hooks', function (done) {
    var baseSchema = lounge.schema({
      metadata: {
        doc_type: String,
        createdAt: Date,
        updatedAt: Date
      }
    })

    baseSchema.pre('save', function (next) {
      if (!this.metadata) {
        this.metadata = {}
      }

      if (!this.metadata.createdAt) {
        this.metadata.createdAt = new Date()
      }

      this.metadata.updatedAt = new Date()
      this.metadata.doc_type = this.modelName.toLowerCase()

      next()
    })

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    })

    userSchema.pre('save', function (next) {
      if (this.email) {
        this.email = this.email.toLowerCase()
      }

      next()
    })

    userSchema.extend(baseSchema)

    var User = lounge.model('User', userSchema)

    var dob = new Date('March 3, 1990 03:30:00')

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'JOE@Gmail.com',
      dateOfBirth: dob
    })

    user.save(function (err, savedUser) {
      expect(err).to.not.be.ok
      expect(savedUser).to.be.ok
      expect(savedUser).to.be.an.instanceof(User)
      expect(savedUser.id).to.be.ok
      expect(savedUser.id).to.be.a('string')

      expect(savedUser.firstName).to.equal('Joe')
      expect(savedUser.lastName).to.equal('Smith')
      expect(savedUser.email).to.equal('joe@gmail.com')
      expect(savedUser.dateOfBirth).to.be.ok
      expect(savedUser.dateOfBirth).to.be.an.instanceof(Date)
      expect(savedUser.dateOfBirth.toISOString()).to.equal(dob.toISOString())
      expect(savedUser.metadata).to.be.ok
      expect(savedUser.metadata).to.be.an('object')
      expect(savedUser.metadata.createdAt).to.be.ok
      expect(savedUser.metadata.createdAt).to.be.an.instanceof(Date)
      expect(savedUser.metadata.updatedAt).to.be.ok
      expect(savedUser.metadata.updatedAt).to.be.an.instanceof(Date)

      done()
    })
  })

  it('should be able to create an object with extended schema properties and respect static and methods', function (done) {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    })

    baseSchema.pre('save', function (next) {
      if (!this.metadata) {
        this.metadata = {}
      }

      var now = new Date()

      if (!this.metadata.createdAt) {
        this.metadata.createdAt = now
      }

      this.metadata.updatedAt = now

      next()
    })

    var datacheck = {}
    baseSchema.static('baseStatic', function () {
      datacheck.baseStatic = true
    })

    baseSchema.static('fooStatic', function () {
      datacheck.baseFooStatic = true
    })

    baseSchema.method('baseMethod', function () {
      datacheck.baseMethod = true
    })

    baseSchema.method('foo', function () {
      datacheck.baseFoo = true
    })

    baseSchema.virtual('isNew', {
      get: function () {
        if (this.metadata && this.metadata.createdAt && !this.metadata.updatedAt) {
          return true
        }
        if (this.metadata && this.metadata.createdAt && this.metadata.updatedAt) {
          return this.metadata.createdAt.toISOString() === this.metadata.updatedAt.toISOString()
        } else {
          return false
        }
      }
    })

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date,
      profile: {
        email: String,
        age: Number
      }
    })

    userSchema.pre('save', function (next) {
      if (this.email) {
        this.email = this.email.toLowerCase()
      }

      next()
    })

    userSchema.virtual('fullName', {
      get: function () {
        return this.firstName + ' ' + this.lastName
      },
      set: function (v) {
        if (v !== undefined) {
          var parts = v.split(' ')
          this.firstName = parts[0]
          this.lastName = parts[1]
        }
      }
    })

    userSchema.static('userStatic', function () {
      datacheck.userStatic = true
    })

    userSchema.static('fooStatic', function () {
      datacheck.userFooStatic = true
    })

    userSchema.method('userMethod', function () {
      datacheck.userMethod = true
    })

    userSchema.method('foo', function () {
      datacheck.userFoo = true
    })

    userSchema.extend(baseSchema)

    var User = lounge.model('User', userSchema)

    var dob = new Date('March 3, 1990 03:30:00')

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'JOE@Gmail.com',
      dateOfBirth: dob
    })

    User.userStatic()
    User.baseStatic()
    User.fooStatic()

    user.baseMethod()
    user.userMethod()
    user.foo()

    expect(datacheck.baseStatic).to.equal(true)
    expect(datacheck.userStatic).to.equal(true)
    expect(datacheck.baseFooStatic).to.not.be.ok
    expect(datacheck.userFooStatic).to.equal(true)
    expect(datacheck.baseFoo).to.not.be.ok
    expect(datacheck.userFoo).to.equal(true)
    expect(datacheck.baseMethod).to.equal(true)
    expect(datacheck.userMethod).to.equal(true)

    user.save(function (err, savedUser) {
      expect(err).to.not.be.ok
      expect(savedUser).to.be.ok
      expect(savedUser).to.be.an.instanceof(User)
      expect(savedUser.id).to.be.ok
      expect(savedUser.id).to.be.a('string')

      expect(user.isNew).to.equal(true)
      expect(user.fullName).to.equal('Joe Smith')

      expect(savedUser.firstName).to.equal('Joe')
      expect(savedUser.lastName).to.equal('Smith')
      expect(savedUser.email).to.equal('joe@gmail.com')
      expect(savedUser.dateOfBirth).to.be.ok
      expect(savedUser.dateOfBirth).to.be.an.instanceof(Date)
      expect(savedUser.dateOfBirth.toISOString()).to.equal(dob.toISOString())
      expect(savedUser.metadata).to.be.ok
      expect(savedUser.metadata).to.be.an('object')
      expect(savedUser.metadata.createdAt).to.be.ok
      expect(savedUser.metadata.createdAt).to.be.an.instanceof(Date)
      expect(savedUser.metadata.updatedAt).to.be.ok
      expect(savedUser.metadata.updatedAt).to.be.an.instanceof(Date)

      user.isNew = 'asdf'
      user.fullName = 'Bob Jones'

      expect(user.isNew).to.equal(true)
      expect(user.firstName).to.equal('Bob')
      expect(user.lastName).to.equal('Jones')
      expect(user.fullName).to.equal('Bob Jones')

      done()
    })
  })

  it('should be able to create an object with extended schema properties and respect base and our hooks - extend called first', function (done) {
    var baseSchema = lounge.schema({
      metadata: {
        doc_type: String,
        createdAt: Date,
        updatedAt: Date
      }
    })

    baseSchema.pre('save', function (next) {
      if (!this.metadata) {
        this.metadata = {}
      }

      if (!this.metadata.createdAt) {
        this.metadata.createdAt = new Date()
      }

      this.metadata.updatedAt = new Date()
      this.metadata.doc_type = this.modelName.toLowerCase()

      next()
    })

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    })

    userSchema.extend(baseSchema)

    userSchema.pre('save', function (next) {
      if (this.email) {
        this.email = this.email.toLowerCase()
      }

      next()
    })

    var User = lounge.model('User', userSchema)

    var dob = new Date('March 3, 1990 03:30:00')

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'JOE@Gmail.com',
      dateOfBirth: dob
    })

    user.save(function (err, savedUser) {
      expect(err).to.not.be.ok
      expect(savedUser).to.be.ok
      expect(savedUser).to.be.an.instanceof(User)
      expect(savedUser.id).to.be.ok
      expect(savedUser.id).to.be.a('string')

      expect(savedUser.firstName).to.equal('Joe')
      expect(savedUser.lastName).to.equal('Smith')
      expect(savedUser.email).to.equal('joe@gmail.com')
      expect(savedUser.dateOfBirth).to.be.ok
      expect(savedUser.dateOfBirth).to.be.an.instanceof(Date)
      expect(savedUser.dateOfBirth.toISOString()).to.equal(dob.toISOString())
      expect(savedUser.metadata).to.be.ok
      expect(savedUser.metadata).to.be.an('object')
      expect(savedUser.metadata.createdAt).to.be.ok
      expect(savedUser.metadata.createdAt).to.be.an.instanceof(Date)
      expect(savedUser.metadata.updatedAt).to.be.ok
      expect(savedUser.metadata.updatedAt).to.be.an.instanceof(Date)

      done()
    })
  })

  it('should be able to create an object with extended schema properties and respect static and methods - extend called first', function (done) {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    })

    baseSchema.pre('save', function (next) {
      if (!this.metadata) {
        this.metadata = {}
      }

      var now = new Date()

      if (!this.metadata.createdAt) {
        this.metadata.createdAt = now
      }

      this.metadata.updatedAt = now

      next()
    })

    var datacheck = {}
    baseSchema.static('baseStatic', function () {
      datacheck.baseStatic = true
    })

    baseSchema.static('fooStatic', function () {
      datacheck.baseFooStatic = true
    })

    baseSchema.method('baseMethod', function () {
      datacheck.baseMethod = true
    })

    baseSchema.method('foo', function () {
      datacheck.baseFoo = true
    })

    baseSchema.virtual('isNew', {
      get: function () {
        if (this.metadata && this.metadata.createdAt && !this.metadata.updatedAt) {
          return true
        }
        if (this.metadata && this.metadata.createdAt && this.metadata.updatedAt) {
          return this.metadata.createdAt.toISOString() === this.metadata.updatedAt.toISOString()
        } else {
          return false
        }
      }
    })

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date,
      profile: {
        email: String,
        age: Number
      }
    })

    userSchema.extend(baseSchema)

    userSchema.pre('save', function (next) {
      if (this.email) {
        this.email = this.email.toLowerCase()
      }

      next()
    })

    userSchema.virtual('fullName', {
      get: function () {
        return this.firstName + ' ' + this.lastName
      },
      set: function (v) {
        if (v !== undefined) {
          var parts = v.split(' ')
          this.firstName = parts[0]
          this.lastName = parts[1]
        }
      }
    })

    userSchema.static('userStatic', function () {
      datacheck.userStatic = true
    })

    userSchema.static('fooStatic', function () {
      datacheck.userFooStatic = true
    })

    userSchema.method('userMethod', function () {
      datacheck.userMethod = true
    })

    userSchema.method('foo', function () {
      datacheck.userFoo = true
    })

    var User = lounge.model('User', userSchema)

    var dob = new Date('March 3, 1990 03:30:00')

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'JOE@Gmail.com',
      dateOfBirth: dob
    })

    User.userStatic()
    User.baseStatic()
    User.fooStatic()

    user.baseMethod()
    user.userMethod()
    user.foo()

    expect(datacheck.baseStatic).to.equal(true)
    expect(datacheck.userStatic).to.equal(true)
    expect(datacheck.baseFooStatic).to.not.be.ok
    expect(datacheck.userFooStatic).to.equal(true)
    expect(datacheck.baseFoo).to.not.be.ok
    expect(datacheck.userFoo).to.equal(true)
    expect(datacheck.baseMethod).to.equal(true)
    expect(datacheck.userMethod).to.equal(true)

    user.save(function (err, savedUser) {
      expect(err).to.not.be.ok
      expect(savedUser).to.be.ok
      expect(savedUser).to.be.an.instanceof(User)
      expect(savedUser.id).to.be.ok
      expect(savedUser.id).to.be.a('string')

      expect(user.isNew).to.equal(true)
      expect(user.fullName).to.equal('Joe Smith')

      expect(savedUser.firstName).to.equal('Joe')
      expect(savedUser.lastName).to.equal('Smith')
      expect(savedUser.email).to.equal('joe@gmail.com')
      expect(savedUser.dateOfBirth).to.be.ok
      expect(savedUser.dateOfBirth).to.be.an.instanceof(Date)
      expect(savedUser.dateOfBirth.toISOString()).to.equal(dob.toISOString())
      expect(savedUser.metadata).to.be.ok
      expect(savedUser.metadata).to.be.an('object')
      expect(savedUser.metadata.createdAt).to.be.ok
      expect(savedUser.metadata.createdAt).to.be.an.instanceof(Date)
      expect(savedUser.metadata.updatedAt).to.be.ok
      expect(savedUser.metadata.updatedAt).to.be.an.instanceof(Date)

      user.isNew = 'asdf'
      user.fullName = 'Bob Jones'

      expect(user.isNew).to.equal(true)
      expect(user.firstName).to.equal('Bob')
      expect(user.lastName).to.equal('Jones')
      expect(user.fullName).to.equal('Bob Jones')

      done()
    })
  })

  it('should inherit base init function', function () {
    var base = lounge.schema({
      createdAt: Date
    })

    base.method('init', function () {
      this.createdAt = new Date()
    })

    var userSchema = lounge.schema({
      name: String,
      email: String
    })

    userSchema.extend(base)

    var User = lounge.model('User', userSchema)

    var user = new User({
      name: 'Joe',
      email: 'joe@gmail.com'
    })

    var obj = user.toObject()

    expect(obj.id).to.be.ok
    expect(obj.id).to.be.a('string')
    expect(obj.createdAt).to.be.an.instanceof(Date)
  })

  it('should inherit base toObject options', function () {
    var base = lounge.schema({
      createdAt: Date
    })

    var xform = function (doc, ret, options) {
      delete ret.createdAt
      return ret
    }

    base.set('toObject', { transform: xform })

    base.method('init', function () {
      this.createdAt = new Date()
    })

    var userSchema = lounge.schema({
      name: String,
      email: String
    })

    userSchema.extend(base)

    var User = lounge.model('User', userSchema)

    var user = new User({
      name: 'Joe',
      email: 'joe@gmail.com'
    })

    var obj = user.toObject()

    var expected = {
      name: 'Joe',
      email: 'joe@gmail.com'
    }

    expect(obj.id).to.be.ok
    expect(obj.id).to.be.a('string')

    delete obj.id

    expect(obj).to.deep.equal(expected)
  })

  it('should inherit base toJSON options', function () {
    var base = lounge.schema({
      createdAt: Date
    })

    var xform = function (doc, ret, options) {
      delete ret.createdAt
      return ret
    }

    base.set('toJSON', { transform: xform })

    base.method('init', function () {
      this.createdAt = new Date()
    })

    var userSchema = lounge.schema({
      name: String,
      email: String
    })

    userSchema.extend(base)

    var User = lounge.model('User', userSchema)

    var user = new User({
      name: 'Joe',
      email: 'joe@gmail.com'
    })

    var obj = user.toJSON()

    var expected = {
      name: 'Joe',
      email: 'joe@gmail.com'
    }

    expect(obj.id).to.be.ok
    expect(obj.id).to.be.a('string')

    delete obj.id

    expect(obj).to.deep.equal(expected)
  })

  it('should inherit base clear options', function () {
    var base = lounge.schema({
      doc_type: String
    })

    base.set('clear', function () {
      var props = Object.getOwnPropertyNames(this)
      var self = this
      props.forEach(function (k) {
        if (k !== 'doc_type' && k !== 'id') {
          delete self[k]
        }
      })
    })

    base.method('init', function () {
      this.doc_type = 'base'
    })

    var userSchema = lounge.schema({
      name: String,
      email: String
    })

    base.method('init', function () {
      this.doc_type = 'user'
    })

    userSchema.extend(base)

    var User = lounge.model('User', userSchema)

    var user = new User({
      name: 'Joe',
      email: 'joe@gmail.com'
    })

    expect(user.id).to.be.ok
    expect(user.id).to.be.a('string')
    expect(user.name).to.equal('Joe')
    expect(user.email).to.equal('joe@gmail.com')
    expect(user.doc_type).to.equal('user')

    user.clear()

    expect(user.id).to.be.ok
    expect(user.id).to.be.a('string')
    expect(user.name).to.not.be.ok
    expect(user.email).to.not.be.ok
    expect(user.doc_type).to.equal('user')
  })
})
