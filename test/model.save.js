var couchbase = require('couchbase');
var expect = require('chai').expect;

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model save tests', function () {
  beforeEach(function (done) {
    lounge = new lounge.Lounge(); // recreate it

    var cluster = new couchbase.Mock.Cluster('couchbase://127.0.0.1');
    bucket = cluster.openBucket('lounge_test', function (err) {
      lounge.connect({
        bucket: bucket
      }, done);
    });
  });

  it('should save a simple document', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema);

    var dob = new Date('March 3, 1990 03:30:00');

    var user = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      dateOfBirth: dob
    });

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');

      expect(savedDoc.firstName).to.equal('Joe');
      expect(savedDoc.lastName).to.equal('Smith');
      expect(savedDoc.email).to.equal('joe@gmail.com');
      expect(savedDoc.dateOfBirth).to.be.ok;
      expect(savedDoc.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedDoc.dateOfBirth.toString()).to.equal((new Date(1990, 2, 3, 3, 30, 0)).toString());

      bucket.get(savedDoc.getDocumentKeyValue(true), function (err, dbDoc) {
        expect(err).to.not.be.ok;

        expect(dbDoc).to.be.ok;
        expect(dbDoc.value).to.be.ok;
        expect(dbDoc.value).to.be.an('object');

        var expected = {
          firstName: 'Joe',
          lastName: 'Smith',
          email: 'joe@gmail.com',
          dateOfBirth: dob.toISOString()
        };

        expected.id = savedDoc.getDocumentKeyValue(true);

        expect(dbDoc.value).to.deep.equal(expected);
        done();
      });
    });
  });

  it('should save a simple document with data passed in to save()', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema);

    var dob = new Date('March 3, 1989 03:30:00');

    var user = new User();

    var data = {
      firstName: 'Joe2',
      lastName: 'Smith2',
      email: 'joe2@gmail.com',
      dateOfBirth: dob
    };

    user.save(data, function (err, savedDoc) {
      expect(err).to.not.be.ok;

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');

      expect(savedDoc.firstName).to.equal('Joe2');
      expect(savedDoc.lastName).to.equal('Smith2');
      expect(savedDoc.email).to.equal('joe2@gmail.com');
      expect(savedDoc.dateOfBirth).to.be.ok;
      expect(savedDoc.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedDoc.dateOfBirth.toString()).to.equal((new Date(1989, 2, 3, 3, 30, 0)).toString());

      bucket.get(savedDoc.getDocumentKeyValue(true), function (err, dbDoc) {
        expect(err).to.not.be.ok;

        expect(dbDoc).to.be.ok;
        expect(dbDoc.value).to.be.ok;
        expect(dbDoc.value).to.be.an('object');

        var expected = {
          firstName: 'Joe2',
          lastName: 'Smith2',
          email: 'joe2@gmail.com',
          dateOfBirth: dob.toISOString()
        };

        expected.id = savedDoc.getDocumentKeyValue(true);

        expect(dbDoc.value).to.deep.equal(expected);
        done();
      });
    });
  });

  it('should save a simple document with some data passed in to save()', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema);

    var dob = new Date('March 3, 1989 03:30:00');

    var user = new User({
      firstName: 'Joe',
      email: 'joe2@gmail.com'
    });

    var data = {
      firstName: 'Joe2',
      lastName: 'Smith2',
      dateOfBirth: dob
    };

    user.save(data, function (err, savedDoc) {
      expect(err).to.not.be.ok;

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');

      expect(savedDoc.firstName).to.equal('Joe2');
      expect(savedDoc.lastName).to.equal('Smith2');
      expect(savedDoc.email).to.equal('joe2@gmail.com');
      expect(savedDoc.dateOfBirth).to.be.ok;
      expect(savedDoc.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedDoc.dateOfBirth.toString()).to.equal((new Date(1989, 2, 3, 3, 30, 0)).toString());

      bucket.get(savedDoc.getDocumentKeyValue(true), function (err, dbDoc) {
        expect(err).to.not.be.ok;

        expect(dbDoc).to.be.ok;
        expect(dbDoc.value).to.be.ok;
        expect(dbDoc.value).to.be.an('object');

        var expected = {
          firstName: 'Joe2',
          lastName: 'Smith2',
          email: 'joe2@gmail.com',
          dateOfBirth: dob.toISOString()
        };

        expected.id = savedDoc.getDocumentKeyValue(true);

        expect(dbDoc.value).to.deep.equal(expected);
        done();
      });
    });
  });

  it('should save a simple document with sub documents and arrays', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date,
      foo: Number,
      favourites: [String],
      boolProp: Boolean,
      someProp: Object
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe3',
      lastName: 'Smith3',
      email: 'joe3@gmail.com',
      dateOfBirth: new Date('March 3, 1989 03:30:00'),
      foo: 5,
      boolProp: true,
      favourites: [
        'fav0', 'fav1', 'fav2'
      ],
      someProp: {
        abc: 'xyz',
        sbp: false,
        snp: 11
      }
    });

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');

      expect(savedDoc.firstName).to.equal('Joe3');
      expect(savedDoc.lastName).to.equal('Smith3');
      expect(savedDoc.email).to.equal('joe3@gmail.com');
      expect(savedDoc.dateOfBirth).to.be.ok;
      expect(savedDoc.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedDoc.dateOfBirth.toString()).to.equal((new Date(1989, 2, 3, 3, 30, 0)).toString());
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp).to.deep.equal({abc: 'xyz', sbp: false, snp: 11});

      bucket.get(savedDoc.getDocumentKeyValue(true), function (err, dbDoc) {
        expect(err).to.not.be.ok;

        expect(dbDoc).to.be.ok;
        expect(dbDoc.value).to.be.ok;
        expect(dbDoc.value).to.be.an('object');

        var expected = {
          firstName: 'Joe3',
          lastName: 'Smith3',
          email: 'joe3@gmail.com',
          dateOfBirth: new Date('March 3, 1989 03:30:00').toISOString(),
          foo: 5,
          boolProp: true,
          favourites: [
            'fav0', 'fav1', 'fav2'
          ],
          someProp: {
            abc: 'xyz',
            sbp: false,
            snp: 11
          }
        };

        expected.id = savedDoc.getDocumentKeyValue(true);

        expect(dbDoc.value).to.deep.equal(expected);
        done();
      });
    });
  });

  it('should ignore unknown properties', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date,
      foo: Number,
      favourites: [String],
      boolProp: Boolean,
      someProp: Object
    });

    var User = lounge.model('User', userSchema);

    var user = new User({
      firstName: 'Joe3',
      lastName: 'Smith3',
      email: 'joe3@gmail.com',
      dateOfBirth: new Date('March 3, 1989 03:30:00'),
      foo: 5,
      boolProp: true,
      unpa: 'something',
      favourites: [
        'fav0', 'fav1', 'fav2'
      ],
      someProp: {
        abc: 'xyz',
        sbp: false,
        snp: 11
      }
    });

    user.save(function (err, savedDoc) {
      expect(err).to.not.be.ok;

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');

      expect(savedDoc.firstName).to.equal('Joe3');
      expect(savedDoc.lastName).to.equal('Smith3');
      expect(savedDoc.email).to.equal('joe3@gmail.com');
      expect(savedDoc.dateOfBirth).to.be.ok;
      expect(savedDoc.dateOfBirth).to.be.an.instanceof(Date);
      expect(savedDoc.dateOfBirth.toString()).to.equal((new Date(1989, 2, 3, 3, 30, 0)).toString());
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp).to.deep.equal({abc: 'xyz', sbp: false, snp: 11});
      expect(user.unpa).to.not.be.ok;

      bucket.get(savedDoc.getDocumentKeyValue(true), function (err, dbDoc) {
        expect(err).to.not.be.ok;

        expect(dbDoc).to.be.ok;
        expect(dbDoc.value).to.be.ok;
        expect(dbDoc.value).to.be.an('object');

        var expected = {
          firstName: 'Joe3',
          lastName: 'Smith3',
          email: 'joe3@gmail.com',
          dateOfBirth: new Date('March 3, 1989 03:30:00').toISOString(),
          foo: 5,
          boolProp: true,
          favourites: [
            'fav0', 'fav1', 'fav2'
          ],
          someProp: {
            abc: 'xyz',
            sbp: false,
            snp: 11
          }
        };

        expected.id = savedDoc.getDocumentKeyValue(true);

        expect(dbDoc.value).to.deep.equal(expected);
        done();
      });
    });
  });

  it('should save simple ref', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String
    });

    var User = lounge.model('User', userSchema);

    var postSchema = lounge.schema({
      title: String,
      content: String,
      date: Date,
      owner: {type: User, ref: 'User'}
    });

    var Post = lounge.model('Post', postSchema);

    var user = new User({
      firstName: 'Will',
      lastName: 'Smith',
      email: 'willie@gmail.com'
    });

    var now = new Date();

    var post = new Post({
      title: 'sample title',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tempor iaculis nunc vel tempus. Donec fringilla orci et posuere hendrerit.',
      date: now,
      owner: user
    });

    post.save(function (err, savedDoc) {

      expect(err).to.not.be.ok;

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');
      expect(savedDoc.content).to.equal(post.content);
      expect(savedDoc.title).to.equal(post.title);
      expect(savedDoc.date).to.be.an.instanceof(Date);
      expect(savedDoc.date.toString()).to.equal(now.toString());
      expect(savedDoc.owner).to.be.ok;
      expect(savedDoc.owner).to.be.an('object');
      expect(savedDoc.owner).to.be.an.instanceof(User);
      expect(savedDoc.owner.id).to.be.ok;
      expect(savedDoc.owner.id).to.be.a('string');
      expect(savedDoc.owner.email).to.equal('willie@gmail.com');
      expect(savedDoc.owner.firstName).to.equal('Will');
      expect(savedDoc.owner.lastName).to.equal('Smith');

      var postKey = savedDoc.getDocumentKeyValue(true);
      var userKey = savedDoc.owner.getDocumentKeyValue(true);
      var docIds = [
        postKey,
        userKey
      ];

      bucket.getMulti(docIds, function (err, docs) {
        expect(err).to.not.be.ok;

        var postDoc = docs[postKey].value;
        var userDoc = docs[userKey].value;

        var expectedUserDoc = {
          firstName: 'Will',
          lastName: 'Smith',
          email: 'willie@gmail.com',
          id: userKey
        };

        var expectedPostDoc = {
          id: postKey,
          title: post.title,
          content: post.content,
          date: now.toISOString(),
          owner: {
            id: userKey
          }
        };

        expect(postDoc).to.be.ok;
        expect(userDoc).to.be.ok;
        expect(postDoc).to.be.an('object');
        expect(userDoc).to.be.an('object');

        expect(postDoc).to.deep.equal(expectedPostDoc);
        expect(userDoc).to.deep.equal(expectedUserDoc);

        done();
      });
    });
  });

});