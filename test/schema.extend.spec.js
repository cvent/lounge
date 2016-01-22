var couchbase = require('couchbase');
var testUtil = require('./helpers/utils');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge2 = require('../lib');
var lounge;
var Schema = lounge2.Schema;

var bucket;

describe('Schema extend tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge2.Lounge(); // recreate it

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

  it('should extend schema and have base properties', function () {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    });

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    userSchema.extend(baseSchema);

    expect(userSchema.tree).to.be.ok;
    expect(userSchema.tree).to.be.an('object');
    expect(userSchema.tree.metadata).to.be.ok;
    expect(userSchema.tree.metadata.createdAt).to.be.ok;
    expect(userSchema.tree.metadata.updatedAt).to.be.ok;


    expect(userSchema.descriptor).to.be.ok;
    expect(userSchema.descriptor).to.be.an('object');
    expect(userSchema.descriptor.metadata).to.be.ok;
    expect(userSchema.descriptor.metadata.createdAt).to.be.ok;
    expect(userSchema.descriptor.metadata.updatedAt).to.be.ok;
  });

  it('should be able to create an object with extended schema properties', function () {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    });

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    userSchema.extend(baseSchema);

    var User = lounge.model('User', userSchema);

    var dob = new Date('March 3, 1990 03:30:00');
    var now = new Date();

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      dateOfBirth: dob,
      metadata: {
        createdAt: now
      }
    });

    expect(user).to.be.ok;
    expect(user).to.be.an.instanceof(User);
    expect(user).to.be.an.instanceof(lounge.Model);
    expect(user.id).to.be.ok;
    expect(user.id).to.be.a('string');

    expect(user.firstName).to.equal('Joe');
    expect(user.lastName).to.equal('Smith');
    expect(user.email).to.equal('joe@gmail.com');
    expect(user.dateOfBirth).to.be.ok;
    expect(user.dateOfBirth).to.be.an.instanceof(Date);
    expect(user.dateOfBirth.toISOString()).to.equal(dob.toISOString());
    expect(user.metadata).to.be.ok;
    expect(user.metadata).to.be.an('object');
    expect(user.metadata.createdAt).to.be.ok;
    expect(user.metadata.createdAt).to.be.an.instanceof(Date);
    expect(user.metadata.createdAt.toISOString()).to.equal(now.toISOString());
    expect(user.metadata.updatedAt).to.not.be.ok;
  });

  it('should be able to create an object with extended schema properties and respect base and our hooks', function (done) {
    var baseSchema = lounge.schema({
      metadata: {
        doc_type: String,
        createdAt: Date,
        updatedAt: Date
      }
    });

    baseSchema.pre('save', function (next) {
      if (!this.metadata) {
        this.metadata = {};
      }

      if (!this.metadata.createdAt) {
        this.metadata.createdAt = new Date();
      }

      this.metadata.updatedAt = new Date();
      this.metadata.doc_type = this.modelName.toLowerCase();

      next();
    });

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    userSchema.pre('save', function (next) {
      if (this.email) {
        this.email = this.email.toLowerCase();
      }

      next();
    });

    userSchema.extend(baseSchema);

    var User = lounge.model('User', userSchema);

    var dob = new Date('March 3, 1990 03:30:00');

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'JOE@Gmail.com',
      dateOfBirth: dob
    });

    user.save(function (err, savedUser) {
      expect(savedUser).to.be.ok;
      expect(savedUser).to.be.an.instanceof(User);
      expect(savedUser.id).to.be.ok;
      expect(savedUser.id).to.be.a('string');

      expect(savedUser.firstName).to.equal('Joe');
      expect(savedUser.lastName).to.equal('Smith');
      expect(savedUser.email).to.equal('joe@gmail.com');
      expect(savedUser.dateOfBirth).to.be.ok;
      expect(savedUser.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedUser.dateOfBirth.toISOString()).to.equal(dob.toISOString());
      expect(savedUser.metadata).to.be.ok;
      expect(savedUser.metadata).to.be.an('object');
      expect(savedUser.metadata.createdAt).to.be.ok;
      expect(savedUser.metadata.createdAt).to.be.an.instanceof(Date);
      expect(savedUser.metadata.updatedAt).to.be.ok;
      expect(savedUser.metadata.updatedAt).to.be.an.instanceof(Date);

      done();
    });
  });

  it('should be able to create an object with extended schema properties and respect static and methods', function (done) {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    });

    baseSchema.pre('save', function (next) {
      if (!this.metadata) {
        this.metadata = {};
      }

      var now = new Date();

      if (!this.metadata.createdAt) {
        this.metadata.createdAt = now;
      }

      this.metadata.updatedAt = now;

      next();
    });

    var datacheck = {};
    baseSchema.static('baseStatic', function () {
      datacheck.baseStatic = true;
    });

    baseSchema.static('fooStatic', function () {
      datacheck.baseFooStatic = true;
    });

    baseSchema.method('baseMethod', function () {
      datacheck.baseMethod = true;
    });

    baseSchema.method('foo', function () {
      datacheck.baseFoo = true;
    });

    baseSchema.virtual('isNew', {
      get: function () {
        if (this.metadata && this.metadata.createdAt && !this.metadata.updatedAt) {
          return true;
        }
        if (this.metadata && this.metadata.createdAt && this.metadata.updatedAt) {
          return this.metadata.createdAt.toISOString() === this.metadata.updatedAt.toISOString();
        }
        else {
          return false;
        }
      }
    });

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date,
      profile: {
        email: String,
        age: Number
      }
    });

    userSchema.pre('save', function (next) {
      if (this.email) {
        this.email = this.email.toLowerCase();
      }

      next();
    });

    userSchema.virtual('fullName', {
      get: function () {
        return this.firstName + ' ' + this.lastName;
      },
      set: function (v) {
        if (v !== undefined) {
          var parts = v.split(' ');
          this.firstName = parts[0];
          this.lastName = parts[1];
        }
      }
    });

    userSchema.static('userStatic', function () {
      datacheck.userStatic = true;
    });

    userSchema.static('fooStatic', function () {
      datacheck.userFooStatic = true;
    });

    userSchema.method('userMethod', function () {
      datacheck.userMethod = true;
    });

    userSchema.method('foo', function () {
      datacheck.userFoo = true;
    });

    userSchema.extend(baseSchema);

    var User = lounge.model('User', userSchema);

    var dob = new Date('March 3, 1990 03:30:00');

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'JOE@Gmail.com',
      dateOfBirth: dob
    });

    User.userStatic();
    User.baseStatic();
    User.fooStatic();

    user.baseMethod();
    user.userMethod();
    user.foo();

    expect(datacheck.baseStatic).to.equal(true);
    expect(datacheck.userStatic).to.equal(true);
    expect(datacheck.baseFooStatic).to.not.be.ok;
    expect(datacheck.userFooStatic).to.equal(true);
    expect(datacheck.baseFoo).to.not.be.ok;
    expect(datacheck.userFoo).to.equal(true);
    expect(datacheck.baseMethod).to.equal(true);
    expect(datacheck.userMethod).to.equal(true);

    user.save(function (err, savedUser) {
      expect(savedUser).to.be.ok;
      expect(savedUser).to.be.an.instanceof(User);
      expect(savedUser.id).to.be.ok;
      expect(savedUser.id).to.be.a('string');

      expect(user.isNew).to.equal(true);
      expect(user.fullName).to.equal('Joe Smith');

      expect(savedUser.firstName).to.equal('Joe');
      expect(savedUser.lastName).to.equal('Smith');
      expect(savedUser.email).to.equal('joe@gmail.com');
      expect(savedUser.dateOfBirth).to.be.ok;
      expect(savedUser.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedUser.dateOfBirth.toISOString()).to.equal(dob.toISOString());
      expect(savedUser.metadata).to.be.ok;
      expect(savedUser.metadata).to.be.an('object');
      expect(savedUser.metadata.createdAt).to.be.ok;
      expect(savedUser.metadata.createdAt).to.be.an.instanceof(Date);
      expect(savedUser.metadata.updatedAt).to.be.ok;
      expect(savedUser.metadata.updatedAt).to.be.an.instanceof(Date);

      user.isNew = 'asdf';
      user.fullName = 'Bob Jones';

      expect(user.isNew).to.equal(true);
      expect(user.firstName).to.equal('Bob');
      expect(user.lastName).to.equal('Jones');
      expect(user.fullName).to.equal('Bob Jones');

      done();
    });
  });
});