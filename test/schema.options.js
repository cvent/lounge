var expect = require('chai').expect;
var lounge = require('../lib');

describe("Schema options", function () {

  beforeEach(function () {
    lounge = new lounge.Lounge(); // recreate it
  });

  describe("virtuals", function () {
    it("Should have a basic getter", function () {
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

    it("Should not set it if no setter given", function () {
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

    it("Should use the setter to set the property", function () {
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

  describe("hooks", function () {

    describe("pre", function () {
      it("Should call pre hook before function", function () {

        var userSchema = lounge.schema({firstName: String, lastName: String});

        userSchema.pre('toObject', function preFn(next) {
          this.firstName = this.firstName.toUpperCase();
          this.lastName = this.lastName.toUpperCase();
          next();
        });

        var User = lounge.model('User', userSchema);

        var user = new User({firstName: 'Joe', lastName: 'Smith'});

        var obj = user.toObject();

        expect(user.firstName).to.equal('JOE', 'Failed to call pre hook');
        expect(user.lastName).to.equal('SMITH', 'Failed to call pre hook');
      });
    });

    describe("post", function () {
      it("Should call post hook after function", function () {

        var userSchema = lounge.schema({firstName: String, lastName: String});

        userSchema.post('toJSON', function postFn(next) {
          this.firstName = this.firstName.toUpperCase();
          this.lastName = this.lastName.toUpperCase();
          next();
        });

        var User = lounge.model('User', userSchema);

        var user = new User({firstName: 'Joe', lastName: 'Smith'});

        user.toJSON();

        expect(user.firstName).to.equal('JOE', 'Failed to call post hook');
        expect(user.lastName).to.equal('SMITH', 'Failed to call post hook');
      });
    });
  });
});