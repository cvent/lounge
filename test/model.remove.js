var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;
var rs = require('./helpers/remove_setup');

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model remove tests', function () {
  beforeEach(function (done) {
    if(lounge) {
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

        rs.setup(bucket, done);
      });
    });
  });

  it('should remove a simple document', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema);

    var userData = rs.data.users[0];

    var user = new User(userData);

    user.remove(function(err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');
      expect(rdoc.id).to.be.ok;
      expect(rdoc.id).to.be.a('string');

      expect(rdoc.firstName).to.equal(userData.firstName);
      expect(rdoc.lastName).to.equal(userData.lastName);
      expect(rdoc.email).to.equal(userData.email);
      expect(rdoc.dateOfBirth).to.be.ok;
      expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

      done();
    });
  });
});