var couchbase = require('couchbase');
var _ = require('lodash');
var async = require('async');
var testUtil = require('./helpers/utils');
var expect = require('chai').expect;

var lounge = require('../');

var bucket;

describe('Model index query tests', function () {

  describe('index query tests without populate', function () {
    beforeEach(function (done) {
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
        }, function () {
          bucket.manager().flush(done);
        });
      });
    });

    it('should query using simple reference document', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: {type: String, index: true}
      });

      var User = lounge.model('User', userSchema);

      var userData = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com'
      };

      var user = new User(userData);

      user.save(function (err, savedDoc) {
        expect(err).to.not.be.ok;
        expect(savedDoc).to.be.ok;


        User.findByEmail(user.email, function (err, rdoc) {
          expect(err).to.not.be.ok;

          expect(rdoc).to.be.ok;
          expect(rdoc).to.be.an('object');
          expect(rdoc).to.be.an.instanceof(User);
          expect(rdoc.id).to.be.ok;
          expect(rdoc.id).to.be.a('string');

          expect(rdoc.id).to.equal(user.id);
          expect(rdoc.firstName).to.equal(userData.firstName);
          expect(rdoc.lastName).to.equal(userData.lastName);
          expect(rdoc.email).to.equal(userData.email);

          done();
        });
      });
    });

    it('should query using simple reference document respecting key options', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: {type: String, index: true},
        username: {type: String, key: true, generate: false}
      });

      var User = lounge.model('User', userSchema);

      var userData = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        username: 'jsmith'
      };

      var user = new User(userData);

      user.save(function (err, savedDoc) {
        expect(err).to.not.be.ok;
        expect(savedDoc).to.be.ok;

        User.findByEmail(user.email, function (err, rdoc) {
          expect(err).to.not.be.ok;

          expect(rdoc).to.be.ok;
          expect(rdoc).to.be.an('object');
          expect(rdoc).to.be.an.instanceof(User);

          expect(rdoc.username).to.equal(user.username);
          expect(rdoc.firstName).to.equal(userData.firstName);
          expect(rdoc.lastName).to.equal(userData.lastName);
          expect(rdoc.email).to.equal(userData.email);

          done();
        });
      });
    });

    it('should query index values for array', function (done) {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        usernames: [{type: String, index: true, indexName: 'username'}]
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        usernames: ['user1', 'user2']
      });

      user.save(function (err, savedDoc) {
        expect(err).to.not.be.ok;
        expect(savedDoc).to.be.ok;

        User.findByUsername(user.usernames[0], function (err, rdoc) {
          expect(err).to.not.be.ok;

          expect(rdoc).to.be.ok;
          expect(rdoc).to.be.an('object');
          expect(rdoc).to.be.an.instanceof(User);

          expect(rdoc.usernames.sort()).to.deep.equal(user.usernames.sort());
          expect(rdoc.firstName).to.equal(user.firstName);
          expect(rdoc.lastName).to.equal(user.lastName);
          expect(rdoc.email).to.equal(user.email);

          User.findByUsername(user.usernames[1], function (err, rdoc) {
            expect(err).to.not.be.ok;

            expect(rdoc).to.be.ok;
            expect(rdoc).to.be.an('object');
            expect(rdoc).to.be.an.instanceof(User);

            expect(rdoc.usernames.sort()).to.deep.equal(user.usernames.sort());
            expect(rdoc.firstName).to.equal(user.firstName);
            expect(rdoc.lastName).to.equal(user.lastName);
            expect(rdoc.email).to.equal(user.email);

            done();
          });
        });
      });
    });
  });

  describe('query index tests with populate', function () {
    var User, Company;
    var ts = require('./helpers/pop_setup2');
    var tsData = ts.getData();

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
        }, function () {
          bucket.manager().flush(function (err) {
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
              postalCode: String
            });

            Company = lounge.model('Company', companySchema);

            var userSchema = lounge.schema({
              firstName: String,
              lastName: String,
              email: {type: String, index: true},
              company: Company
            });

            User = lounge.model('User', userSchema);

            var popData = ts.getData();

            async.each(popData.companies, function (c, eacb) {
              var company = new Company(c);
              company.save(eacb);
            }, function (err) {
              if (err) {
                return done(err);
              }

              async.each(popData.users, function (u, eacb) {
                var user = new User(u);
                user.save(eacb);
              }, done)
            });
          });
        });
      });
    });

    it('should query using simple reference document and not populate anything if option not present', function (done) {
      var email = tsData.users[0].email;
      User.findByEmail(email, function (err, rdoc) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(User);
        expect(rdoc.id).to.be.ok;
        expect(rdoc.id).to.be.a('string');

        var userData = tsData.users[0];
        expect(rdoc.firstName).to.equal(userData.firstName);
        expect(rdoc.lastName).to.equal(userData.lastName);
        expect(rdoc.email).to.equal(userData.email);
        expect(rdoc.company).to.equal(userData.company);

        done();
      });
    });

    it('should query using simple reference document and populate as boolean', function (done) {
      var email = tsData.users[0].email;
      User.findByEmail(email, {populate: true}, function (err, rdoc) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(User);
        expect(rdoc.id).to.be.ok;
        expect(rdoc.id).to.be.a('string');

        var userData = tsData.users[0];
        var companyData = tsData.companies[0];

        expect(rdoc.firstName).to.equal(userData.firstName);
        expect(rdoc.lastName).to.equal(userData.lastName);
        expect(rdoc.email).to.equal(userData.email);

        expect(rdoc.company.id).to.equal(companyData.id);
        expect(rdoc.company.name).to.equal(companyData.name);
        expect(rdoc.company.streetAddress).to.equal(companyData.streetAddress);
        expect(rdoc.company.city).to.equal(companyData.city);
        expect(rdoc.company.country).to.equal(companyData.country);
        expect(rdoc.company.state).to.equal(companyData.state);
        expect(rdoc.company.postalCode).to.equal(companyData.postalCode);

        done();
      });
    });

    it('should query using simple reference document and populate as string', function (done) {
      var email = tsData.users[1].email;
      User.findByEmail(email, {populate: 'company'}, function (err, rdoc) {
        expect(err).to.not.be.ok;

        expect(rdoc).to.be.ok;
        expect(rdoc).to.be.an('object');
        expect(rdoc).to.be.an.instanceof(User);
        expect(rdoc.id).to.be.ok;
        expect(rdoc.id).to.be.a('string');

        var userData = tsData.users[1];
        var companyData = tsData.companies[1];

        expect(rdoc.firstName).to.equal(userData.firstName);
        expect(rdoc.lastName).to.equal(userData.lastName);
        expect(rdoc.email).to.equal(userData.email);

        expect(rdoc.company.id).to.equal(companyData.id);
        expect(rdoc.company.name).to.equal(companyData.name);
        expect(rdoc.company.streetAddress).to.equal(companyData.streetAddress);
        expect(rdoc.company.city).to.equal(companyData.city);
        expect(rdoc.company.country).to.equal(companyData.country);
        expect(rdoc.company.state).to.equal(companyData.state);
        expect(rdoc.company.postalCode).to.equal(companyData.postalCode);

        done();
      });
    });
  });
});