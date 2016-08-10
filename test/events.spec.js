var _ = require('lodash');
var expect = require('chai').expect;
var lounge = require('../index');

describe('Events tests', function () {
  beforeEach(function (done) {
    lounge = new lounge.Lounge(); // recreate it
    lounge.connect({
      connectionString: 'couchbase://127.0.0.1',
      bucket: 'lounge_test'
    }, function (err, bucket) {
      bucket.manager().flush(done);
    });
  });

  describe('Instance events', function () {
    var savedDoc;

    it('Should properly emit \'save\' event when saved`', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com'
      });

      var semitted = false;
      try {
        user.on('save', function (doc) {
          semitted = true;
        });
      } catch (e) { console.log(e); }

      user.save(function (err, doc) {
        savedDoc = doc;
        expect(semitted).to.equal(true);
        done();
      });
    });

    it('Should properly emit \'remove\' event when removed`', function (done) {
      var remitted = false;
      savedDoc.on('remove', function (doc) {
        remitted = true;
      });

      savedDoc.remove(function (err, doc) {
        expect(remitted).to.equal(true);
        done();
      });
    });

    it('Should properly emit \'index\' event when indexed`', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true }
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com'
      });

      var emitted = false;
      user.on('index', function (doc) {
        emitted = true;
      });

      user.index(function () {
        expect(emitted).to.equal(true);
        done();
      });
    });
  });

  describe('Model scope events', function () {
    var savedDoc, User, Company;

    it('Should properly emit \'save\' event when saved`', function (done) {
      var userSchema = lounge.schema({
        name: String,
        email: String,
      });

      User = lounge.model('User', userSchema);

      var companySchema = lounge.schema({
        name: String,
        address: String,
      });

      Company = lounge.model('company', companySchema);

      var semitted = false;
      User.on('save', function (doc) {
        semitted = true;
      });

      var cemitted = false;
      Company.on('save', function (doc) {
        cemitted = true;
      });

      var user = new User({
        firstName: 'Joe Smith',
        email: 'joe@gmail.com'
      });

      user.save(function (err, doc) {
        savedDoc = doc;
        expect(semitted).to.equal(true);
        expect(cemitted).to.equal(false);
        done();
      });
    });

    it('Should properly emit \'remove\' event when removed`', function (done) {
      var remitted = false;
      var cemitted = false;

      User.on('remove', function (doc) {
        remitted = true;
      });

      Company.on('remove', function (doc) {
        cemitted = true;
      });

      savedDoc.remove(function (err, doc) {
        expect(remitted).to.equal(true);
        expect(cemitted).to.equal(false);
        done();
      });
    });

    it('Should properly emit \'index\' event when indexed`', function (done) {
      var userSchema = lounge.schema({
        name: String,
        email: { type: String, index: true }
      });

      var User = lounge.model('User', userSchema);

      var emitted = false;
      User.on('index', function (doc) {
        emitted = true;
      });

      var user = new User({
        name: 'Joe Smith',
        email: 'joe@gmail.com'
      });

      user.index(function () {
        expect(emitted).to.equal(true);
        done();
      });
    });
  });

  describe('Global events', function () {
    it('Should properly emit \'save\', \'index\' and \'remove\' events when actions done`', function (done) {
      var saveEmitted = false;
      var indexEmitted = false;
      var removeEmitted = false;
      var savedDoc, indexedDoc, removedDoc;

      lounge.on('save', function (doc, options) {
        saveEmitted = true;
        savedDoc = doc;
      });

      lounge.on('index', function (doc, options) {
        indexEmitted = true;
        indexedDoc = doc;
      });

      lounge.on('remove', function (doc, options) {
        removeEmitted = true;
        removedDoc = doc;
      });

      var userSchema = lounge.schema({
        name: String,
        email: { type: String, index: true }
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe Smith',
        email: 'joe@gmail.com'
      });

      user.index(function (err, doc) {
        expect(indexEmitted).to.equal(true);
        expect(indexedDoc).to.equal(user);

        user.save(function (err, doc) {
          expect(saveEmitted).to.equal(true);
          expect(savedDoc).to.equal(user);

          user.remove(function (err, doc) {
            expect(removeEmitted).to.equal(true);
            expect(removedDoc).to.equal(user);
            done();
          });
        });
      });
    });
  });
});
