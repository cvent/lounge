var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;
var ts = require('./helpers/findbyid_setup');

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model findById tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge.Lounge(); // recreate it

    var cluster = new couchbase.Mock.Cluster('couchbase://127.0.0.1');
    bucket = cluster.openBucket('lounge_test', function (err) {
      lounge.connect({
        bucket: bucket
      }, function (err) {
        if (err) {
          return done(err);
        }

        ts.setup(bucket, done);
      });
    });
  });

  it('should find a simple document', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema);

    var userId = ts.data.users[0].id;
    var userData = ts.data.users[0];

    User.findById(userId, function (err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');
      expect(rdoc).to.be.an.instanceof(User);
      expect(rdoc.id).to.be.ok;
      expect(rdoc.id).to.be.a('string');

      expect(rdoc.firstName).to.equal(userData.firstName);
      expect(rdoc.lastName).to.equal(userData.lastName);
      expect(rdoc.email).to.equal(userData.email);
      expect(rdoc.dateOfBirth).to.be.ok;
      expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

      // check CAS this is first time where we would get it
      var cas1 = rdoc.getCAS();
      expect(cas1).to.be.a('string');

      var cas2 = rdoc.getCAS(true);
      expect(cas2).to.be.an('object');

      var cas3 = rdoc.cas;
      expect(cas3).to.be.a('string');

      done();
    });
  });
});