var expect = require('chai').expect;
var testUtil = require('./helpers/utils');
var lounge = require('../lib');

describe('Schema options', function () {

  beforeEach(function () {
    lounge = new lounge.Lounge(); // recreate it
  });

  describe('virtuals', function () {
    it('Should have a basic getter', function () {
      var userSchema = lounge.schema({firstName: String, lastName: String});

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      var User = lounge.model('User', userSchema);

      var user = new User({firstName: 'Joe', lastName: 'Smith'});

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.fullName).to.equal('Joe Smith');
    });

    it('Should not set it if no setter given', function () {
      var userSchema = lounge.schema({firstName: String, lastName: String});

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      var User = lounge.model('User', userSchema);

      var user = new User({firstName: 'Joe', lastName: 'Smith'});

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.fullName).to.equal('Joe Smith');

      user.fullName = 'Bob Row';

      expect(user.fullName).to.equal('Joe Smith');
    });

    it('Should use the setter to set the property', function () {
      var userSchema = lounge.schema({firstName: String, lastName: String});

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

      var User = lounge.model('User', userSchema);

      var user = new User({firstName: 'Joe', lastName: 'Smith'});

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.fullName).to.equal('Joe Smith');

      user.fullName = 'Bob Row';

      expect(user.fullName).to.equal('Bob Row');
      expect(user.firstName).to.equal('Bob');
      expect(user.lastName).to.equal('Row');
    });
  });

  describe('hooks', function () {

    describe('pre', function () {

      it('Should call pre hook with params before function', function (done) {

        var userSchema = lounge.schema({firstName: String, lastName: String});

        userSchema.method('foo', function (firstName, lastName, cb) {
          return process.nextTick(function () {
            return cb(null, firstName + ' ' + lastName);
          });
        });

        var datacheck = {};

        userSchema.pre('foo', function preFn(next, param1, param2) {
          datacheck.param1 = param1;
          datacheck.param2 = param2;
          this.firstName = this.firstName.toUpperCase();
          this.lastName = this.lastName.toUpperCase();
          next();
        });

        var User = lounge.model('User', userSchema);

        var user = new User({firstName: 'Joe', lastName: 'Smith'});

        user.foo('Led', 'Zep', function (err, res) {
          expect(res).to.equal('Led Zep');
          expect(datacheck.param1).to.equal('Led', 'Failed to call pre hook');
          expect(datacheck.param2).to.equal('Zep', 'Failed to call pre hook');
          expect(user.firstName).to.equal('JOE', 'Failed to call pre hook');
          expect(user.lastName).to.equal('SMITH', 'Failed to call pre hook');
          done();
        });
      });

      it('Should pass error', function (done) {

        var userSchema = lounge.schema({firstName: String, lastName: String});

        userSchema.method('foo', function (firstName, lastName, cb) {
          return process.nextTick(function () {
            return cb(null, firstName + ' ' + lastName);
          });
        });

        var datacheck = {};
        var msg = 'some error';

        userSchema.pre('foo', function preFn(next, param1, param2) {
          datacheck.param1 = param1;
          datacheck.param2 = param2;
          this.firstName = this.firstName.toUpperCase();
          this.lastName = this.lastName.toUpperCase();
          next(new Error(msg));
        });

        var User = lounge.model('User', userSchema);

        var user = new User({firstName: 'Joe', lastName: 'Smith'});

        user.foo('Led', 'Zep', function (err, res) {
          expect(err).to.be.ok;
          expect(err.message).to.equal(msg);
          expect(datacheck.param1).to.equal('Led', 'Failed to call pre hook');
          expect(datacheck.param2).to.equal('Zep', 'Failed to call pre hook');
          expect(user.firstName).to.equal('JOE', 'Failed to call pre hook');
          expect(user.lastName).to.equal('SMITH', 'Failed to call pre hook');
          done();
        });
      });
    });

    describe('post', function () {

      it('Should call post hook with return param after function', function (done) {

        var userSchema = lounge.schema({firstName: String, lastName: String});

        userSchema.method('foo', function (firstName, lastName, cb) {
          return process.nextTick(function () {
            return cb(null, firstName + ' ' + lastName);
          });
        });

        var postCalled = false;

        userSchema.post('foo', true, function postFn(next, param) {
          postCalled = true;
          next(null, param);
        });

        var User = lounge.model('User', userSchema);

        var user = new User({firstName: 'Joe', lastName: 'Smith'});

        user.foo('Led', 'Zep', function (err, param1) {
          expect(param1).to.equal('Led Zep', 'Failed to call post hook');
          expect(postCalled).to.be.ok;
          expect(user.firstName).to.equal('Joe', 'Failed to call post hook');
          expect(user.lastName).to.equal('Smith', 'Failed to call post hook');
          done();
        });
      });

      it('Should not call post hook if error in hooked function', function (done) {

        var userSchema = lounge.schema({firstName: String, lastName: String});
        var msg = 'some async error';

        userSchema.method('foo', function (firstName, lastName, cb) {
          return process.nextTick(function () {
            return cb(new Error(msg), firstName + ' ' + lastName);
          });
        });

        var postCalled = false;

        userSchema.post('foo', true, function postFn(next, param) {
          postCalled = true;
          next(null, param);
        });

        var User = lounge.model('User', userSchema);

        var user = new User({firstName: 'Joe', lastName: 'Smith'});

        user.foo('Led', 'Zep', function (err, param1) {
          expect(err).to.be.ok;
          expect(err.message).to.equal(msg);
          expect(postCalled).to.not.be.ok;
          done();
        });
      });
    });
  });
});