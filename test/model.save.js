var expect = require('chai').expect;
var lounge = require('../lib');
var Schema = lounge.Schema;
var couchbase = require('couchbase');
var cluster, bucket;

describe('Model save tests', function () {
  beforeEach(function (done) {
    lounge = new lounge.Lounge(); // recreate it

    var cluster = new couchbase.Mock.Cluster('couchbase://127.0.0.1');
    var bucket = cluster.openBucket('lounge_test');

    lounge.connect({
      connectionString: 'couchbase://127.0.0.1',
      bucket: 'lounge_test'
    }, done);
  });

  it('should save a simple document', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema);

    var dob = new Date(1995, 11, 17, 3, 24, 0);


    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      dateOfBirth: dob
    });

    user.dateOfBirth = dob;

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');

      expect(savedDoc.firstName).to.be.equal('Joe');
      expect(savedDoc.lastName).to.be.equal('Smith');
      expect(savedDoc.email).to.be.equal('joe@gmail.com');
      expect(savedDoc.dateOfBirth).to.be.ok;
      expect(savedDoc.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedDoc.dateOfBirth.toString()).to.be.equal(new Date(1995, 11, 17, 3, 24, 0).toString());

      done();
    });
  });
});