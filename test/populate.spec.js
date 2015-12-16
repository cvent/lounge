var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;
var ts = require('./helpers/pop_setup');

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model populate tests', function () {
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

        ts.setup(bucket, done);
      });
    });
  });

  describe('with simple ref and boolean populate option', function () {
    var User, Company, Post, Comment;

    before(function () {
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
    });

    it('should get a document and not populate anything with no option', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, function (err, rdoc) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(User);
        expect(rdoc.id).to.not.be.ok;

        expect(rdoc.firstName).to.equal(userData.firstName);
        expect(rdoc.lastName).to.equal(userData.lastName);
        expect(rdoc.email).to.equal(userData.email);
        expect(rdoc.company).to.equal(userData.company);
        expect(rdoc.dateOfBirth).to.be.ok;
        expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

        var cas3 = rdoc.cas;
        expect(cas3).to.be.a('string');

        done();
      });
    });

    it('should get a document and populate refs with populate option = true', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: true}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(User);
        expect(rdoc.id).to.not.be.ok;

        expect(rdoc.firstName).to.equal(userData.firstName);
        expect(rdoc.lastName).to.equal(userData.lastName);
        expect(rdoc.email).to.equal(userData.email);
        expect(rdoc.dateOfBirth).to.be.ok;
        expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

        var cas = rdoc.cas;
        expect(cas).to.be.a('string');

        expect(rdoc.company).to.be.ok;
        expect(rdoc.company).to.be.an('object');
        expect(rdoc.company).to.be.an.instanceof(Company);

        var companyData = ts.data.companies[0];

        expect(rdoc.company.id).to.equal(companyData.id);
        expect(rdoc.company.name).to.equal(companyData.name);
        expect(rdoc.company.streetAddress).to.equal(companyData.streetAddress);
        expect(rdoc.company.city).to.equal(companyData.city);
        expect(rdoc.company.country).to.equal(companyData.country);
        expect(rdoc.company.state).to.equal(companyData.state);
        expect(rdoc.company.postalCode).to.equal(companyData.postalCode);
        expect(rdoc.company.founded).to.be.ok;
        expect(rdoc.company.founded).to.be.an.instanceof(Date);

        var cas2 = rdoc.company.cas;
        expect(cas2).to.be.a('string');

        expect(cas).to.not.equal(cas2);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        done();
      });
    });

    it('should get a document and populate refs with full reference id and populate option = true', function (done) {
      var userId = ts.data.users[1].email;
      var userData = ts.data.users[1];

      User.findById(userId, {populate: true}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(User);
        expect(rdoc.id).to.not.be.ok;

        expect(rdoc.firstName).to.equal(userData.firstName);
        expect(rdoc.lastName).to.equal(userData.lastName);
        expect(rdoc.email).to.equal(userData.email);
        expect(rdoc.dateOfBirth).to.be.ok;
        expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

        var cas = rdoc.cas;
        expect(cas).to.be.a('string');

        expect(rdoc.company).to.be.ok;
        expect(rdoc.company).to.be.an('object');
        expect(rdoc.company).to.be.an.instanceof(Company);

        var companyData = ts.data.companies[1];

        expect(rdoc.company.id).to.equal(companyData.id);
        expect(rdoc.company.name).to.equal(companyData.name);
        expect(rdoc.company.streetAddress).to.equal(companyData.streetAddress);
        expect(rdoc.company.city).to.equal(companyData.city);
        expect(rdoc.company.country).to.equal(companyData.country);
        expect(rdoc.company.state).to.equal(companyData.state);
        expect(rdoc.company.postalCode).to.equal(companyData.postalCode);
        expect(rdoc.company.founded).to.be.ok;
        expect(rdoc.company.founded).to.be.an.instanceof(Date);

        var cas2 = rdoc.company.cas;
        expect(cas2).to.be.a('string');

        expect(cas).to.not.equal(cas2);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        done();
      });
    });

    it('should work with arrays in findById', function (done) {
      var userIds = _.pluck(ts.data.users, 'email');

      User.findById(userIds, {populate: true}, function (err, rdocs, missed) {
        expect(err).to.not.be.ok;

        expect(rdocs).to.be.ok;
        expect(rdocs).to.be.an.instanceof(Array);
        expect(rdocs.length).to.equal(ts.data.users.length);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        rdocs = _.sortBy(rdocs, 'email');

        var expectedUsers = _.cloneDeep(_.sortBy(ts.data.users, 'email'));

        rdocs.forEach(function (rdoc, index) {

          var userData = expectedUsers[index];

          var companyData;

          if (userData.email === 'bjordan0@apple.com') {
            companyData = ts.data.companies[0];
          }
          else if (userData.email === 'rporter1@ning.com') {
            companyData = ts.data.companies[1];
          }
          else if (userData.email === 'joliver2@imgur.com') {
            companyData = ts.data.companies[2];
          }

          expect(rdoc).to.be.ok;
          expect(rdoc).to.be.an('object');
          expect(rdoc).to.be.an.instanceof(User);
          expect(rdoc.id).to.not.be.ok;

          expect(rdoc.firstName).to.equal(userData.firstName);
          expect(rdoc.lastName).to.equal(userData.lastName);
          expect(rdoc.email).to.equal(userData.email);
          expect(rdoc.dateOfBirth).to.be.ok;
          expect(rdoc.dateOfBirth).to.be.an.instanceof(Date);

          var cas = rdoc.cas;
          expect(cas).to.be.a('string');

          if (companyData) {
            expect(rdoc.company).to.be.ok;
            expect(rdoc.company).to.be.an('object');
            expect(rdoc.company).to.be.an.instanceof(Company);

            expect(rdoc.company.id).to.equal(companyData.id);
            expect(rdoc.company.name).to.equal(companyData.name);
            expect(rdoc.company.streetAddress).to.equal(companyData.streetAddress);
            expect(rdoc.company.city).to.equal(companyData.city);
            expect(rdoc.company.country).to.equal(companyData.country);
            expect(rdoc.company.state).to.equal(companyData.state);
            expect(rdoc.company.postalCode).to.equal(companyData.postalCode);
            expect(rdoc.company.founded).to.be.ok;
            expect(rdoc.company.founded).to.be.an.instanceof(Date);

            var cas2 = rdoc.company.cas;
            expect(cas2).to.be.a('string');

            expect(cas).to.not.equal(cas2);
          }
          else {
            expect(rdoc.company).to.not.be.ok;
          }
        });

        done();
      });
    });

    it('should work with array refs', function (done) {
      var postId = ts.data.posts[0].id;
      var expectedData = ts.data.posts[0];

      Post.findById(postId, {populate: true}, function (err, rdoc, missed) {
        //console.log(rdoc);
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[0]], 'id');
        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function(ac, i) {
          var expectedComment = expectedComments[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
        });

        done();
      });
    });
  });
});