var couchbase = require('couchbase');
var _ = require('lodash');
var async = require('async');
var expect = require('chai').expect;
var ts = require('./helpers/pop_setup');

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;
var User, Company, Post, Comment;

describe('Model remove tests', function () {

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
    var userData = ts.data.users[0];
    var user = new User(userData);

    user.remove(function (err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');
      expect(rdoc).to.be.an.instanceof(User);
      expect(rdoc.firstName).to.equal(userData.firstName);
      expect(rdoc.lastName).to.equal(userData.lastName);
      expect(rdoc.email).to.equal(userData.email);
      expect(rdoc.company).to.equal(userData.company);
      expect(rdoc.dateOfBirth).to.be.ok;
      expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

      bucket.get(rdoc.email, function (err, doc) {
        expect(doc).to.not.be.ok;
        expect(err).to.be.ok;
        expect(err.code).to.equal(couchbase.errors.keyNotFound);
        done();
      });
    });
  });

  it('should not remove refs if option not specified', function (done) {
    var userData = ts.data.users[0];
    var companyData = ts.data.companies[0];
    var user = new User(userData);

    user.remove(function (err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');
      expect(rdoc).to.be.an.instanceof(User);
      expect(rdoc.firstName).to.equal(userData.firstName);
      expect(rdoc.lastName).to.equal(userData.lastName);
      expect(rdoc.email).to.equal(userData.email);
      expect(rdoc.company).to.equal(userData.company);
      expect(rdoc.dateOfBirth).to.be.ok;
      expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

      bucket.get(rdoc.email, function (err, doc) {
        expect(doc).to.not.be.ok;
        expect(err).to.be.ok;
        expect(err.code).to.equal(couchbase.errors.keyNotFound);

        var companyKey = Company.getDocumentKeyValue(rdoc.company, true);

        bucket.get(companyKey, function (err, doc) {
          expect(err).to.be.not.ok;

          expect(doc).to.be.ok;
          expect(doc).to.be.an('object');
          expect(doc.value).to.be.ok;
          expect(doc.value).to.be.an('object');
          expect(doc.value.id).to.equal(companyData.id);
          expect(doc.value.name).to.equal(companyData.name);
          expect(doc.value.streetAddress).to.equal(companyData.streetAddress);
          expect(doc.value.city).to.equal(companyData.city);
          expect(doc.value.state).to.equal(companyData.state);
          expect(doc.value.postalCode).to.equal(companyData.postalCode);
          expect(doc.value.founded).to.be.ok;

          done();
        });
      });
    });
  });

  it('should remove refs if option is specified', function (done) {
    var userData = ts.data.users[1];
    var user = new User(userData);

    user.remove({removeRefs: true}, function (err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');

      expect(rdoc.firstName).to.equal(userData.firstName);
      expect(rdoc.lastName).to.equal(userData.lastName);
      expect(rdoc.email).to.equal(userData.email);
      expect(rdoc.company).to.equal(userData.company);
      expect(rdoc.dateOfBirth).to.be.ok;
      expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

      bucket.get(rdoc.email, function (err, doc) {
        expect(doc).to.not.be.ok;
        expect(err).to.be.ok;
        expect(err.code).to.equal(couchbase.errors.keyNotFound);

        var companyKey = Company.getDocumentKeyValue(rdoc.company, true);

        bucket.get(companyKey, function (err, doc) {
          expect(doc).to.not.be.ok;
          expect(err).to.be.ok;
          expect(err.code).to.equal(couchbase.errors.keyNotFound);

          done();
        });
      });
    });
  });

  it('should remove array refs if option is specified', function (done) {
    var postData = ts.data.posts[0];
    var post = new Post(postData);

    post.remove({removeRefs: true}, function (err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');
      expect(rdoc).to.be.an.instanceof(Post);
      expect(rdoc.id).to.equal(postData.id);
      expect(rdoc.title).to.equal(postData.title);
      expect(rdoc.body).to.equal(postData.body);
      expect(rdoc.comments).to.deep.equal(postData.comments);

      var docKey = Post.getDocumentKeyValue(rdoc.id, true);
      bucket.get(docKey, function (err, doc) {
        expect(doc).to.not.be.ok;
        expect(err).to.be.ok;
        expect(err.code).to.equal(couchbase.errors.keyNotFound);

        async.eachLimit(rdoc.comments, 10, function (cid, eaCb) {
          var key = Comment.getDocumentKeyValue(cid, true);

          bucket.get(key, function (err, doc) {
            expect(doc).to.not.be.ok;
            expect(err).to.be.ok;
            expect(err.code).to.equal(couchbase.errors.keyNotFound);
            eaCb();
          });
        }, done);
      });
    });
  });

  it('should remove nested array refs if option is specified', function (done) {
    var postData = ts.data.posts[2];
    var post = new Post(postData);

    post.remove({removeRefs: true}, function (err, rdoc) {
      expect(err).to.not.be.ok;

      expect(rdoc).to.be.ok;
      expect(rdoc).to.be.an('object');
      expect(rdoc).to.be.an.instanceof(Post);
      expect(rdoc.id).to.equal(postData.id);
      expect(rdoc.title).to.equal(postData.title);
      expect(rdoc.body).to.equal(postData.body);
      expect(rdoc.comments).to.deep.equal(postData.comments);

      var docKey = Post.getDocumentKeyValue(rdoc.id, true);
      bucket.get(docKey, function (err, doc) {
        expect(doc).to.not.be.ok;
        expect(err).to.be.ok;
        expect(err.code).to.equal(couchbase.errors.keyNotFound);

        async.eachLimit(rdoc.comments, 10, function (cid, eaCb) {
          var key = Comment.getDocumentKeyValue(cid, true);

          bucket.get(key, function (err, doc) {
            expect(doc).to.not.be.ok;
            expect(err).to.be.ok;
            expect(err.code).to.equal(couchbase.errors.keyNotFound);
            eaCb();
          });
        }, function () {
          var users = _.uniq([ts.data.comments[3].user, ts.data.comments[4].user, ts.data.comments[5].user]);
          async.eachLimit(users, 10, function (uid, eaCb) {
            var key = User.getDocumentKeyValue(uid, true);

            bucket.get(key, function (err, doc) {
              expect(doc).to.not.be.ok;
              expect(err).to.be.ok;
              expect(err.code).to.equal(couchbase.errors.keyNotFound);
              eaCb();
            });
          }, function () {
            var companies = [ts.data.companies[0].id, ts.data.companies[2].id];

            async.eachLimit(companies, 10, function (cid, eaCb) {
              var key = Company.getDocumentKeyValue(cid, true);

              bucket.get(key, function (err, doc) {
                expect(doc).to.not.be.ok;
                expect(err).to.be.ok;
                expect(err.code).to.equal(couchbase.errors.keyNotFound);
                eaCb();
              });
            }, done);
          });
        });
      });
    });
  });
});