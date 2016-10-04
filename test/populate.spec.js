var couchbase = require('couchbase');
var testUtil = require('./helpers/utils');
var _ = require('lodash');
var expect = require('chai').expect;
var ts = require('./helpers/pop_setup');

var lounge = require('../');

var bucket;
var User, Company, Post, Comment, Ticket, Profile, Event;

describe('Model populate tests', function () {

  beforeEach(function (done) {
    var t = process.env.LOUNGE_COUCHBASE_MOCK ? 10 : 100;
    setTimeout(done, t);
  });

  before(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge.Lounge(); // recreate it

    var cluster = testUtil.getCluser();
    bucket = cluster.openBucket('lounge_test', function (err) {
      if (err) {
        return done(err);
      }

      lounge.connect({
        bucket: bucket
      }, function (err) {
        if (err) {
          return done(err);
        }


        bucket.manager().flush(function(err) {
          if (err) {
            return done(err);
          }

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

          var countrySchema = lounge.schema({
            code: {type: String, key: true, generate: false},
            name: String
          });

          Country = lounge.model('Country', countrySchema);

          var userSchema = lounge.schema({
            firstName: String,
            lastName: String,
            email: {type: String, key: true, generate: false},
            dateOfBirth: Date,
            company: Company,
            location: {
              city: String,
              countryCode: Country,
              country: Object
            }
          });

          User = lounge.model('User', userSchema);

          var commentSchema = lounge.schema({
            body: String,
            user: User
          });

          Comment = lounge.model('Comment', commentSchema);

          var postSchema = lounge.schema({
            title: String,
            body: String,
            comments: [Comment]
          });

          Post = lounge.model('Post', postSchema);

          var profileSchema = lounge.schema({
            firstName: String,
            lastName: String,
            email: String
          });

          Profile = lounge.model('Profile', profileSchema);

          var ticketSchema = lounge.schema({
            confirmationCode: String,
            profileId: Profile,
            profile: Object
          });

          Ticket = lounge.model('Ticket', ticketSchema);

          var eventSchema = lounge.schema({
            name: String,
            ticketIds: [Ticket],
            tickets: [Object]
          });

          Event = lounge.model('Event', eventSchema);

          ts.setup(bucket, done);
        });
      });
    });
  });

  describe('with boolean populate option', function () {
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

        var countryData = ts.data.countries[0];

        expect(rdoc.location).to.be.ok;
        expect(rdoc.location.countryCode).to.be.ok;
        expect(rdoc.location.countryCode).to.be.an('object');
        expect(rdoc.location.countryCode.code).to.equal(countryData.code);
        expect(rdoc.location.countryCode.name).to.equal(countryData.name);

        var cas2 = rdoc.company.cas;
        expect(cas2).to.be.a('string');

        expect(cas).to.not.equal(cas2);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        done();
      });
    });

    it('should get a document and populate refs with populate option = true - promised', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: true}).then(function (rdoc) {
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
      var userIds = _.map(ts.data.users, 'email');

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
            expect(cas2).to.be.ok;
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

    it('should work with arrays in findById - promised', function (done) {
      var userIds = _.map(ts.data.users, 'email');

      User.findById(userIds, {populate: true}).then(function (rdocs) {
        expect(rdocs).to.be.ok;
        expect(rdocs).to.be.an.instanceof(Array);
        expect(rdocs.length).to.equal(ts.data.users.length);

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
            expect(cas2).to.be.ok;
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

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
        });

        done();
      });
    });

    it('should work with array refs where length > 1 and have nested subdocuments', function (done) {
      var postId = ts.data.posts[1].id;
      var expectedData = ts.data.posts[1];

      Post.findById(postId, {populate: true}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[1], ts.data.comments[2]], 'id');
        var expectedUsers = [ts.data.users[1], ts.data.users[4]];
        var expectedCompany = ts.data.companies[1];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
          expect(ac.user).to.be.ok;
          expect(ac.user).to.be.an('object');
          expect(ac.user).to.be.an.instanceof(User);
          expect(ac.user.firstName.id).to.be.not.ok;
          expect(ac.user.firstName).to.equal(expectedUser.firstName);
          expect(ac.user.lastName).to.equal(expectedUser.lastName);
          expect(ac.user.email).to.equal(expectedUser.email);
          expect(ac.user.dateOfBirth).to.be.ok;
          expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
          if (expectedUser.company && ac.user.company) {
            expect(ac.user.company).to.be.ok;
            expect(ac.user.company).to.be.an('object');
            expect(ac.user.company).to.be.an.instanceof(Company);
            expect(ac.user.company.name).to.equal(expectedCompany.name);
            expect(ac.user.company.streetAddress).to.equal(expectedCompany.streetAddress);
            expect(ac.user.company.city).to.equal(expectedCompany.city);
            expect(ac.user.company.country).to.equal(expectedCompany.country);
            expect(ac.user.company.postalCode).to.equal(expectedCompany.postalCode);
            expect(ac.user.company.state).to.equal(expectedCompany.state);
            expect(ac.user.company.founded).to.be.ok;
            expect(ac.user.company.founded).to.be.an.instanceof(Date);
          }
        });

        done();
      });
    });

    it('should work with array refs multiple nested subdocuments', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: true}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[3], ts.data.comments[4], ts.data.comments[5]], 'id');
        var expectedUsers = [ts.data.users[2], ts.data.users[0], ts.data.users[2]];
        var expectedCompanies = [ts.data.companies[2], ts.data.companies[0], ts.data.companies[2]];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);

          if (expectedUser) {
            expect(ac.user).to.be.ok;
            expect(ac.user).to.be.an('object');
            expect(ac.user).to.be.an.instanceof(User);
            expect(ac.user.firstName.id).to.be.not.ok;
            expect(ac.user.firstName).to.equal(expectedUser.firstName);
            expect(ac.user.lastName).to.equal(expectedUser.lastName);
            expect(ac.user.email).to.equal(expectedUser.email);
            expect(ac.user.dateOfBirth).to.be.ok;
            expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            if (expectedUser.company) {
              var expectedCompany = expectedCompanies[i];

              expect(ac.user.company).to.be.ok;
              expect(ac.user.company).to.be.an('object');
              expect(ac.user.company).to.be.an.instanceof(Company);
              expect(ac.user.company.name).to.equal(expectedCompany.name);
              expect(ac.user.company.streetAddress).to.equal(expectedCompany.streetAddress);
              expect(ac.user.company.city).to.equal(expectedCompany.city);
              expect(ac.user.company.country).to.equal(expectedCompany.country);
              expect(ac.user.company.postalCode).to.equal(expectedCompany.postalCode);
              expect(ac.user.company.state).to.equal(expectedCompany.state);
              expect(ac.user.company.founded).to.be.ok;
              expect(ac.user.company.founded).to.be.an.instanceof(Date);
            }
            else {
              expect(ac.user.company).to.not.be.ok;
            }
          }
          else {
            expect(ac.user).to.not.be.ok;
          }
        });

        done();
      });
    });

    it('should work with no array refs', function (done) {
      var postId = ts.data.posts[3].id;
      var expectedData = ts.data.posts[3];

      Post.findById(postId, {populate: true}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);
        expect(rdoc.comments.toArray()).to.deep.equal([]);

        done();
      });
    });

    it('should work with empty array refs', function (done) {
      var postId = ts.data.posts[4].id;
      var expectedData = ts.data.posts[4];

      Post.findById(postId, {populate: true}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);
        expect(rdoc.comments.toArray()).to.deep.equal([]);

        done();
      });
    });
  });

  describe('with string populate option', function () {
    it('should get a document and populate refs with populate option as a string', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: 'company'}, function (err, rdoc, missed) {
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

    it('should get a document and skip unknown refs', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: 'foo'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

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

        var cas = rdoc.cas;
        expect(cas).to.be.a('string');

        done();
      });
    });

    it('should get a document and populate refs with full reference id and populate option as a string', function (done) {
      var userId = ts.data.users[1].email;
      var userData = ts.data.users[1];

      User.findById(userId, {populate: 'company'}, function (err, rdoc, missed) {
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
      var userIds = _.map(ts.data.users, 'email');

      User.findById(userIds, {populate: 'company'}, function (err, rdocs, missed) {
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

      Post.findById(postId, {populate: 'comments'}, function (err, rdoc, missed) {
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

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
        });

        done();
      });
    });

    it('should work with array refs where length > 1 and have nested subdocuments', function (done) {
      var postId = ts.data.posts[1].id;
      var expectedData = ts.data.posts[1];

      Post.findById(postId, {populate: 'comments'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[1], ts.data.comments[2]], 'id');
        var expectedUsers = [ts.data.users[1], ts.data.users[4]];
        var expectedCompany = ts.data.companies[1];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
          expect(ac.user).to.equal(expectedComment.user);
        });

        done();
      });
    });

    it('should work with array refs multiple nested subdocuments', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[3], ts.data.comments[4], ts.data.comments[5]], 'id');
        var expectedUsers = [ts.data.users[2], ts.data.users[0], ts.data.users[2]];
        var expectedCompanies = [ts.data.companies[2], ts.data.companies[0], ts.data.companies[2]];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
          expect(ac.user).to.equal(expectedComment.user);
        });

        done();
      });
    });

    it('should work with no array refs', function (done) {
      var postId = ts.data.posts[3].id;
      var expectedData = ts.data.posts[3];

      Post.findById(postId, {populate: 'comments'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);
        expect(rdoc.comments.toArray()).to.deep.equal([]);

        done();
      });
    });

    it('should work with empty array refs', function (done) {
      var postId = ts.data.posts[4].id;
      var expectedData = ts.data.posts[4];

      Post.findById(postId, {populate: 'comments'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);
        expect(rdoc.comments.toArray()).to.deep.equal([]);

        done();
      });
    });

    it('should work with nested populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.user'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[3], ts.data.comments[4], ts.data.comments[5]], 'id');
        var expectedUsers = [ts.data.users[2], ts.data.users[0], ts.data.users[2]];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);

          if (expectedUser) {
            expect(ac.user).to.be.ok;
            expect(ac.user).to.be.an('object');
            expect(ac.user).to.be.an.instanceof(User);
            expect(ac.user.firstName.id).to.be.not.ok;
            expect(ac.user.firstName).to.equal(expectedUser.firstName);
            expect(ac.user.lastName).to.equal(expectedUser.lastName);
            expect(ac.user.email).to.equal(expectedUser.email);
            expect(ac.user.company).to.equal(expectedUser.company);
            expect(ac.user.dateOfBirth).to.be.ok;
            expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
          }
          else {
            expect(ac.user).to.not.be.ok;
          }
        });

        done();
      });
    });

    it('should work with very nested populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.user.company'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[3], ts.data.comments[4], ts.data.comments[5]], 'id');
        var expectedUsers = [ts.data.users[2], ts.data.users[0], ts.data.users[2]];
        var expectedCompanies = [ts.data.companies[2], ts.data.companies[0], ts.data.companies[2]];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);

          if (expectedUser) {
            expect(ac.user).to.be.ok;
            expect(ac.user).to.be.an('object');
            expect(ac.user).to.be.an.instanceof(User);
            expect(ac.user.firstName.id).to.be.not.ok;
            expect(ac.user.firstName).to.equal(expectedUser.firstName);
            expect(ac.user.lastName).to.equal(expectedUser.lastName);
            expect(ac.user.email).to.equal(expectedUser.email);
            expect(ac.user.dateOfBirth).to.be.ok;
            expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            if (expectedUser.company) {
              var expectedCompany = expectedCompanies[i];

              expect(ac.user.company).to.be.ok;
              expect(ac.user.company).to.be.an('object');
              expect(ac.user.company).to.be.an.instanceof(Company);
              expect(ac.user.company.name).to.equal(expectedCompany.name);
              expect(ac.user.company.streetAddress).to.equal(expectedCompany.streetAddress);
              expect(ac.user.company.city).to.equal(expectedCompany.city);
              expect(ac.user.company.country).to.equal(expectedCompany.country);
              expect(ac.user.company.postalCode).to.equal(expectedCompany.postalCode);
              expect(ac.user.company.state).to.equal(expectedCompany.state);
              expect(ac.user.company.founded).to.be.ok;
              expect(ac.user.company.founded).to.be.an.instanceof(Date);
            }
            else {
              expect(ac.user.company).to.not.be.ok;
            }
          }
          else {
            expect(ac.user).to.not.be.ok;
          }
        });

        done();
      });
    });

    it('should work with array index specified as populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.1'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);
            expect(ac.user).to.equal(expectedComment.user);
          }
        });

        done();
      });
    });

    it('should work with array index specified as populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.1.user'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.company).to.equal(expectedUser.company);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should get and index specified and nested properties as populate string option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.1.user.company'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];
        var expectedCompany = ts.data.companies[2];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
              expect(ac.user.company).to.be.ok;
              expect(ac.user.company).to.be.an('object');
              expect(ac.user.company).to.be.an.instanceof(Company);
              expect(ac.user.company.name).to.equal(expectedCompany.name);
              expect(ac.user.company.streetAddress).to.equal(expectedCompany.streetAddress);
              expect(ac.user.company.city).to.equal(expectedCompany.city);
              expect(ac.user.company.country).to.equal(expectedCompany.country);
              expect(ac.user.company.postalCode).to.equal(expectedCompany.postalCode);
              expect(ac.user.company.state).to.equal(expectedCompany.state);
              expect(ac.user.company.founded).to.be.ok;
              expect(ac.user.company.founded).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should get and index specified and nested property and ignore unknown property as populate string option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.1.user.foo'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.company).to.equal(expectedUser.company);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should get and index specified and nested property and ignore unknown property as populate string option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.1.foo'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);
            expect(ac.user).to.equal(expectedComment.user);
          }
        });

        done();
      });
    });

    it('should work with invalid array index in populate string', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: 'comments.5.user.company'}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4].id, ts.data.comments[5].id];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          expect(ac).to.equal(expectedComment);
        });

        done();
      });
    });
  });

  describe('with object populate option', function () {
    it('should get a document and populate refs with populate option as an object', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: { path: 'company' } }, function (err, rdoc, missed) {
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

    it('should get a document and populate refs with populate option as an object and target option', function (done) {
      var ticketId = ts.data.tickets[0].id;
      var ticketData = ts.data.tickets[0];
      var profileData = ts.data.profiles[0];

      Ticket.findById(ticketId, {populate: { path: 'profileId', target: 'profile' } }, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;
        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Ticket);
        expect(rdoc.id).to.to.equal(ticketData.id);
        expect(rdoc.confirmationCode).to.equal(ticketData.confirmationCode);
        expect(rdoc.profileId).to.be.ok;
        expect(rdoc.profileId).to.be.equal(ticketData.profileId)

        var cas = rdoc.cas;
        expect(cas).to.be.a('string');

        expect(rdoc.profile).to.be.ok;
        expect(rdoc.profile).to.be.an('object');
        expect(rdoc.profile).to.be.an.instanceof(Profile);
        expect(rdoc.profile.id).to.equal(profileData.id);
        expect(rdoc.profile.firstName).to.equal(profileData.firstName);
        expect(rdoc.profile.lastName).to.equal(profileData.lastName);
        expect(rdoc.profile.email).to.equal(profileData.email);

        var cas2 = rdoc.profile.cas;
        expect(cas2).to.be.a('string');

        expect(cas).to.not.equal(cas2);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        done();
      });
    });

    it('should get a document and populate nested refs with populate option as an object and target option', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, { populate: { path: 'location.countryCode', target: 'location.country' } }, function (err, rdoc, missed) {
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

        var countryData = ts.data.countries[0];

        expect(rdoc.location).to.be.ok;
        expect(rdoc.location.country).to.be.ok;
        expect(rdoc.location.country).to.be.an('object');
        expect(rdoc.location.country.code).to.equal(countryData.code);
        expect(rdoc.location.country.name).to.equal(countryData.name);

        var cas2 = rdoc.company.cas;
        expect(cas2).to.be.a('string');

        expect(cas).to.not.equal(cas2);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        done();
      });
    });

    it('should work with arrays in findById and object in populate option', function (done) {
      var ticketIds = [ts.data.tickets[0].id, ts.data.tickets[1].id, ts.data.tickets[2].id, ts.data.tickets[3].id];

      Ticket.findById(ticketIds, {populate: { path: 'profileId', target: 'profile' } }, function (err, rdocs, missed) {
        expect(err).to.not.be.ok;

        expect(rdocs).to.be.ok;
        expect(rdocs).to.be.an.instanceof(Array);
        expect(rdocs.length).to.equal(4);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        rdocs = _.sortBy(rdocs, 'id');

        var expectedProfiles = _.cloneDeep([ts.data.profiles[0], undefined, ts.data.profiles[1], ts.data.profiles[2]]);

        rdocs.forEach(function (rdoc, index) {
          var ticketData = ts.data.tickets[index];

          expect(rdoc).to.be.ok;
          expect(rdoc).to.be.an('object');
          expect(rdoc).to.be.an.instanceof(Ticket);
          expect(rdoc.id).to.to.equal(ticketData.id);
          expect(rdoc.confirmationCode).to.equal(ticketData.confirmationCode);
          expect(rdoc.profileId).to.be.equal(ticketData.profileId)

          var cas = rdoc.cas;
          expect(cas).to.be.a('string');

          var profileData = expectedProfiles[index];

          if (profileData) {
            expect(rdoc.profile).to.be.ok;
            expect(rdoc.profile).to.be.an('object');
            expect(rdoc.profile).to.be.an.instanceof(Profile);
            expect(rdoc.profile.id).to.equal(profileData.id);
            expect(rdoc.profile.firstName).to.equal(profileData.firstName);
            expect(rdoc.profile.lastName).to.equal(profileData.lastName);
            expect(rdoc.profile.email).to.equal(profileData.email);

            var cas2 = rdoc.profile.cas;
            expect(cas2).to.be.a('string');

            expect(cas).to.not.equal(cas2);
          }
          else {
            expect(rdoc.profile).to.not.be.ok;
          }
        });

        done();
      });
    });

    it('should work with array in field and target populate object options', function(done) {
      var eventId = ts.data.events[0].id;
      var ticketIds = [ts.data.tickets[0].id, ts.data.tickets[1].id, ts.data.tickets[2].id];

      Event.findById(eventId, { populate: { path: 'ticketIds.1', target: 'tickets.1' } }, function(err, rdoc, missed) {
        expect(err).to.not.be.ok;
        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Event);
        expect(rdoc.id).to.to.equal(ts.data.events[0].id);
        expect(rdoc.name).to.to.equal(ts.data.events[0].name);
        expect(rdoc.ticketIds).to.be.an.instanceof(Array);
        expect(rdoc.ticketIds.length).to.equal(3);

        var tickets = rdoc.ticketIds.toArray().sort();
        expect(tickets).to.deep.equal(ticketIds);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.tickets).to.be.ok;
        expect(rdoc.tickets).to.be.an.instanceof(Array);

        var expectedTickets = [ts.data.tickets[0].id, ts.data.tickets[1], ts.data.tickets[2].id].sort();
        var actual = rdoc.tickets.toArray().sort();
        expect(actual).to.deep.equal(expectedTickets);
        done();
      });
    });

    it('should work with array in field and target populate object options with ensted populate', function(done) {
      var eventId = ts.data.events[0].id;
      var ticketIds = [ts.data.tickets[0].id, ts.data.tickets[1].id, ts.data.tickets[2].id];

      Event.findById(eventId, { populate: { path: 'ticketIds.2.profileId', target: 'tickets.2.profile'} }, function(err, rdoc, missed) {
        expect(err).to.not.be.ok;
        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Event);
        expect(rdoc.id).to.to.equal(ts.data.events[0].id);
        expect(rdoc.name).to.to.equal(ts.data.events[0].name);
        expect(rdoc.ticketIds).to.be.an.instanceof(Array);
        expect(rdoc.ticketIds.length).to.equal(3);

        var tickets = rdoc.ticketIds.toArray().sort();
        expect(tickets).to.deep.equal(ticketIds);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.tickets).to.be.ok;
        expect(rdoc.tickets).to.be.an.instanceof(Array);

        var ticket2 = _.cloneDeep(ts.data.tickets[2]);
        ticket2.profile = ts.data.profiles[1];
        var expectedTicetkets = [ts.data.tickets[0].id, ts.data.tickets[1].id, ticket2].sort();
        var actual = rdoc.tickets.toArray().sort();
        expect(actual).to.deep.equal(expectedTicetkets);
        done();
      });
    });
  });

  describe('with array populate option', function () {
    it('should get a document and populate refs with populate option as a array', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: ['company']}, function (err, rdoc, missed) {
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

    it('should get a document and skip unknown refs', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: ['foo']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

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

        var cas = rdoc.cas;
        expect(cas).to.be.a('string');

        done();
      });
    });

    it('should get a document and populate refs with populate option as a array with unknown property in array', function (done) {
      var userId = ts.data.users[0].email;
      var userData = ts.data.users[0];

      User.findById(userId, {populate: ['company', 'foo']}, function (err, rdoc, missed) {
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

    it('should get a document and populate refs with full reference id and populate option as a string', function (done) {
      var userId = ts.data.users[1].email;
      var userData = ts.data.users[1];

      User.findById(userId, {populate: ['company']}, function (err, rdoc, missed) {
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
      var userIds = _.map(ts.data.users, 'email');

      User.findById(userIds, {populate: ['company']}, function (err, rdocs, missed) {
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

      Post.findById(postId, {populate: ['comments']}, function (err, rdoc, missed) {
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

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
        });

        done();
      });
    });

    it('should work with array refs where length > 1 and have nested subdocuments', function (done) {
      var postId = ts.data.posts[1].id;
      var expectedData = ts.data.posts[1];

      Post.findById(postId, {populate: ['comments']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[1], ts.data.comments[2]], 'id');
        var expectedUsers = [ts.data.users[1], ts.data.users[4]];
        var expectedCompany = ts.data.companies[1];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
          expect(ac.user).to.equal(expectedComment.user);
        });

        done();
      });
    });

    it('should work with array refs multiple nested subdocuments', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[3], ts.data.comments[4], ts.data.comments[5]], 'id');
        var expectedUsers = [ts.data.users[2], ts.data.users[0], ts.data.users[2]];
        var expectedCompanies = [ts.data.companies[2], ts.data.companies[0], ts.data.companies[2]];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);
          expect(ac.user).to.equal(expectedComment.user);
        });

        done();
      });
    });

    it('should work with no array refs', function (done) {
      var postId = ts.data.posts[3].id;
      var expectedData = ts.data.posts[3];

      Post.findById(postId, {populate: ['comments']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);
        expect(rdoc.comments.toArray()).to.deep.equal([]);

        done();
      });
    });

    it('should work with empty array refs', function (done) {
      var postId = ts.data.posts[4].id;
      var expectedData = ts.data.posts[4];

      Post.findById(postId, {populate: ['comments']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);
        expect(rdoc.comments.toArray()).to.deep.equal([]);

        done();
      });
    });

    it('should work with nested populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.user']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[3], ts.data.comments[4], ts.data.comments[5]], 'id');
        var expectedUsers = [ts.data.users[2], ts.data.users[0], ts.data.users[2]];
        var expectedCompanies = [ts.data.companies[2], ts.data.companies[0], ts.data.companies[2]];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);

          if (expectedUser) {
            expect(ac.user).to.be.ok;
            expect(ac.user).to.be.an('object');
            expect(ac.user).to.be.an.instanceof(User);
            expect(ac.user.firstName.id).to.be.not.ok;
            expect(ac.user.firstName).to.equal(expectedUser.firstName);
            expect(ac.user.lastName).to.equal(expectedUser.lastName);
            expect(ac.user.email).to.equal(expectedUser.email);
            expect(ac.user.company).to.equal(expectedUser.company);
            expect(ac.user.dateOfBirth).to.be.ok;
            expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
          }
          else {
            expect(ac.user).to.not.be.ok;
          }
        });

        done();
      });
    });

    it('should work with very nested populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.user.company']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var expectedComments = _.sortBy([ts.data.comments[3], ts.data.comments[4], ts.data.comments[5]], 'id');
        var expectedUsers = [ts.data.users[2], ts.data.users[0], ts.data.users[2]];
        var expectedCompanies = [ts.data.companies[2], ts.data.companies[0], ts.data.companies[2]];

        expect(rdoc.comments).to.be.an.instanceof(Array);

        var actualComments = _.sortBy(rdoc.comments, 'id');

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          expect(ac.id).to.equal(expectedComment.id);
          expect(ac.title).to.equal(expectedComment.title);
          expect(ac.body).to.equal(expectedComment.body);

          if (expectedUser) {
            expect(ac.user).to.be.ok;
            expect(ac.user).to.be.an('object');
            expect(ac.user).to.be.an.instanceof(User);
            expect(ac.user.firstName.id).to.be.not.ok;
            expect(ac.user.firstName).to.equal(expectedUser.firstName);
            expect(ac.user.lastName).to.equal(expectedUser.lastName);
            expect(ac.user.email).to.equal(expectedUser.email);
            expect(ac.user.dateOfBirth).to.be.ok;
            expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            if (expectedUser.company) {
              var expectedCompany = expectedCompanies[i];

              expect(ac.user.company).to.be.ok;
              expect(ac.user.company).to.be.an('object');
              expect(ac.user.company).to.be.an.instanceof(Company);
              expect(ac.user.company.name).to.equal(expectedCompany.name);
              expect(ac.user.company.streetAddress).to.equal(expectedCompany.streetAddress);
              expect(ac.user.company.city).to.equal(expectedCompany.city);
              expect(ac.user.company.country).to.equal(expectedCompany.country);
              expect(ac.user.company.postalCode).to.equal(expectedCompany.postalCode);
              expect(ac.user.company.state).to.equal(expectedCompany.state);
              expect(ac.user.company.founded).to.be.ok;
              expect(ac.user.company.founded).to.be.an.instanceof(Date);
            }
            else {
              expect(ac.user.company).to.not.be.ok;
            }
          }
          else {
            expect(ac.user).to.not.be.ok;
          }
        });

        done();
      });
    });

    it('should work with array index specified as populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.1']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);
            expect(ac.user).to.equal(expectedComment.user);
          }
        });

        done();
      });
    });

    it('should work with multiple array index specified as populate option in array', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.1', 'comments.2']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5]];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);
            expect(ac.user).to.equal(expectedComment.user);
          }
        });

        done();
      });
    });

    it('should work with array index and nested array index as populate option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.1.user', 'comments.2']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5]];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.company).to.equal(expectedUser.company);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should work with array index and nested array index as populate option where one index is invalid', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.1.user', 'comments.5']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.company).to.equal(expectedUser.company);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should work with array index and nested array index as populate option where nested index is invalid', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.5.user', 'comments.2']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4].id, ts.data.comments[5]];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.company).to.equal(expectedUser.company);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should work with nested array index as populate option where nested index is invalid', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.5.user', 'comments.2.user']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4].id, ts.data.comments[5]];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0]];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.company).to.equal(expectedUser.company);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should get and index specified and nested properties as populate array option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.1.user.company']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];
        var expectedCompany = ts.data.companies[2];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
              expect(ac.user.company).to.be.ok;
              expect(ac.user.company).to.be.an('object');
              expect(ac.user.company).to.be.an.instanceof(Company);
              expect(ac.user.company.name).to.equal(expectedCompany.name);
              expect(ac.user.company.streetAddress).to.equal(expectedCompany.streetAddress);
              expect(ac.user.company.city).to.equal(expectedCompany.city);
              expect(ac.user.company.country).to.equal(expectedCompany.country);
              expect(ac.user.company.postalCode).to.equal(expectedCompany.postalCode);
              expect(ac.user.company.state).to.equal(expectedCompany.state);
              expect(ac.user.company.founded).to.be.ok;
              expect(ac.user.company.founded).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should get and index specified and nested property and ignore unknown property as populate array option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.1.user.foo']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];
        var expectedUsers = [ts.data.users[2].email, ts.data.users[2], ts.data.users[0].email];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          var expectedUser = expectedUsers[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);

            if (typeof expectedUser === 'string') {
              expect(ac.user).to.equal(expectedComment.user);
            }
            else {
              expect(ac.user).to.be.ok;
              expect(ac.user).to.be.an('object');
              expect(ac.user).to.be.an.instanceof(User);
              expect(ac.user.firstName.id).to.be.not.ok;
              expect(ac.user.firstName).to.equal(expectedUser.firstName);
              expect(ac.user.lastName).to.equal(expectedUser.lastName);
              expect(ac.user.email).to.equal(expectedUser.email);
              expect(ac.user.company).to.equal(expectedUser.company);
              expect(ac.user.dateOfBirth).to.be.ok;
              expect(ac.user.dateOfBirth).to.be.an.instanceof(Date);
            }
          }
        });

        done();
      });
    });

    it('should get and index specified and nested property and ignore unknown property as populate array option', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.1.foo']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4], ts.data.comments[5].id];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];

          if (typeof expectedComment === 'string') {
            expect(ac).to.equal(expectedComment);
          }
          else {
            expect(ac.id).to.equal(expectedComment.id);
            expect(ac.title).to.equal(expectedComment.title);
            expect(ac.body).to.equal(expectedComment.body);
            expect(ac.user).to.equal(expectedComment.user);
          }
        });

        done();
      });
    });

    it('should work with invalid array index in populate array', function (done) {
      var postId = ts.data.posts[2].id;
      var expectedData = ts.data.posts[2];

      Post.findById(postId, {populate: ['comments.5.user.company']}, function (err, rdoc, missed) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(Post);

        expect(missed).to.be.an.instanceof(Array);
        expect(missed.length).to.equal(0);

        expect(rdoc.id).to.equal(expectedData.id);
        expect(rdoc.title).to.equal(expectedData.title);
        expect(rdoc.body).to.equal(expectedData.body);

        var actualComments = rdoc.comments;
        var expectedComments = [ts.data.comments[3].id, ts.data.comments[4].id, ts.data.comments[5].id];

        actualComments.forEach(function (ac, i) {
          var expectedComment = expectedComments[i];
          expect(ac).to.equal(expectedComment);
        });

        done();
      });
    });
  });
});
