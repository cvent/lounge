var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;
var ts = require('./helpers/pop_setup');

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;
var User, Company, Post, Comment;

describe('Model remove tests', function () {
  before(function (done) {
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

        var userSchema = lounge.schema({
          firstName: String,
          lastName: String,
          email: {type: String, key: true, generate: false},
          dateOfBirth: Date,
          company: {type: String, ref: 'Company'}
        });

        User = lounge.model('User', userSchema);

        var companySchema = lounge.schema({
          id: {type: String, key: true, generate: true, prefix: 'company::'},
          name: String,
          streetAddress: String,
          city: String,
          country: String,
          state: String,
          postalCode: String,
          founded: Date
        });

        Company = lounge.model('Company', companySchema);

        var commentSchema = lounge.schema({
          body: String,
          user: {type: User, ref: 'User'}
        });

        Comment = lounge.model('Comment', commentSchema);

        var postSchema = lounge.schema({
          title: String,
          body: String,
          comments: [{type: Comment, ref: 'Comment'}]
        });

        Post = lounge.model('Post', postSchema);

        ts.setup(bucket, done);
      });
    });
  });

  it('should remove a simple document', function (done) {
    var user = new User(userData);
    var userData = ts.data.users[0];

    user.remove(function (err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');

      expect(rdoc.firstName).to.equal(userData.firstName);
      expect(rdoc.lastName).to.equal(userData.lastName);
      expect(rdoc.email).to.equal(userData.email);
      expect(rdoc.dateOfBirth).to.be.ok;
      expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

      bucket.get(rdoc.email, function(err, doc) {
        expect(doc).to.not.be.ok;
        expect(err).to.be.ok;
        expect(err.code).to.equal(couchbase.errors.keyNotFound);
        done();
      });
    });
  });
});