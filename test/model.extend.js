var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge2 = require('../lib');
var lounge;
var Schema = lounge2.Schema;

var bucket;

describe.skip('Model inheritance tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge2.Lounge(); // recreate it

    var cluster = new couchbase.Mock.Cluster('couchbase://127.0.0.1');
    bucket = cluster.openBucket('lounge_test', function (err) {
      lounge.connect({
        bucket: bucket
      }, done);
    });
  });

  it('should be able to create an object with extended schema properties', function () {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    });

    var BaseModel = lounge.model('BaseModel', baseSchema);

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema, BaseModel);

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
    expect(user).to.be.an.instanceof(BaseModel);
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

  it('should be able to create an object with extended schema properties and respect base hooks', function (done) {
    var baseSchema = lounge.schema({
      metadata: {
        createdAt: Date,
        updatedAt: Date
      }
    });

    baseSchema.pre('save', function basePre (next) {
      if (!this.metadata) {
        this.metadata = {};
      }

      if (!this.metadata.createdAt) {
        this.metadata.createdAt = new Date();
      }

      this.metadata.updatedAt = new Date();

      next();
    });

    var BaseModel = lounge.model('BaseModel', baseSchema);

    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    userSchema.pre('save', function userPre(next) {
      if (this.email) {
        this.email = this.email.toLowerCase();
      }

      next();
    });

    var User = lounge.model('User', userSchema, BaseModel);

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
  })
});