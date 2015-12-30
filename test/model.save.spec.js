var couchbase = require('couchbase');
var testUtil = require('./helpers/utils');
var _ = require('lodash');
var expect = require('chai').expect;

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;

describe('Model save tests', function () {
  beforeEach(function (done) {
    if (lounge) {
      lounge.disconnect();
    }

    lounge = new lounge.Lounge(); // recreate it

    var cluster = testUtil.getCluser();
    bucket = cluster.openBucket('lounge_test', function (err) {
      lounge.connect({
        bucket: bucket
      }, function () {
        bucket.manager().flush(done);
      });
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
      owner: User
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
          owner: userKey
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

  it('should save simple ref with email as key / ref', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: {type: String, key: true}
    });

    var User = lounge.model('User', userSchema);

    var postSchema = lounge.schema({
      title: String,
      content: String,
      date: Date,
      owner: {type: User}
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
      expect(savedDoc.owner.id).to.not.be.ok;
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
          email: 'willie@gmail.com'
        };

        var expectedPostDoc = {
          id: postKey,
          title: post.title,
          content: post.content,
          date: now.toISOString(),
          owner: userKey
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

  it('should save array ref', function (done) {

    var commentSchema = lounge.schema({
      content: String,
      date: Date,
      owner: String
    });

    var Comment = lounge.model('Comment', commentSchema);

    var postSchema = lounge.schema({
      title: String,
      content: String,
      date: Date,
      comments: [Comment]
    });

    var Post = lounge.model('Post', postSchema);

    var comments = [
      new Comment({
        content: 'Comment 1',
        date: new Date('November 10, 2015 03:00:00'),
        owner: 'Bob'
      }),
      new Comment({
        content: 'Comment 2',
        date: new Date('November 11, 2015 04:00:00'),
        owner: 'Sara'
      }),
      new Comment({
        content: 'Comment 3',
        date: new Date('November 12, 2015 05:00:00'),
        owner: 'Jake'
      })
    ];

    var postDate = new Date('November 9, 2015 02:00:00');
    var post = new Post({
      title: 'Sample post title',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tempor iaculis nunc vel tempus.',
      date: postDate,
      comments: comments
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
      expect(savedDoc.date.toString()).to.equal(postDate.toString());
      expect(savedDoc.comments).to.be.ok;
      expect(savedDoc.comments).to.be.an.instanceof(Array);
      expect(savedDoc.comments.length).to.be.equal(3);

      var commentKeys = [];
      savedDoc.comments.forEach(function (elem, i) {
        expect(elem).to.be.an.instanceof(Comment);
        expect(elem.id).to.be.ok;
        expect(elem.id).to.be.a('string');
        expect(elem.content).to.equal(comments[i].content);
        expect(elem.owner).to.equal(comments[i].owner);
        expect(elem.date.toString()).to.equal(comments[i].date.toString());
        commentKeys.push(elem.getDocumentKeyValue(true));
      });

      var postKey = savedDoc.getDocumentKeyValue(true);

      commentKeys.sort();

      var docKeys = [postKey].concat(commentKeys);

      bucket.getMulti(docKeys, function (err, docs) {
        expect(err).to.not.be.ok;

        var postDoc = docs[postKey].value;
        var commentDocs = _.sortBy([docs[commentKeys[0]].value, docs[commentKeys[1]].value, docs[commentKeys[2]].value], 'id');

        expect(postDoc).to.be.ok;
        expect(postDoc).to.be.an('object');
        expect(postDoc.comments).to.be.an.instanceof(Array);
        expect(postDoc.comments.length).to.be.equal(3);

        postDoc.comments = postDoc.comments.sort();

        var expectedPostDoc = {
          id: postKey,
          title: post.title,
          content: post.content,
          date: postDate.toISOString(),
          comments: [commentKeys[0], commentKeys[1], commentKeys[2]].sort()
        };

        expect(postDoc).to.be.ok;
        expect(postDoc).to.be.an('object');

        expect(postDoc).to.deep.equal(expectedPostDoc);

        var commentDocKeys = _.pluck(commentDocs, 'id');
        commentDocKeys.sort();

        expect(commentDocKeys).to.deep.equal(commentKeys);

        commentDocs = _.chain(commentDocs).map(function (c) {
          return _.omit(c, 'id');
        }).sortBy('content').value();

        var expectedCommentDocs = _.sortBy([
          {
            content: 'Comment 1',
            date: new Date('November 10, 2015 03:00:00').toISOString(),
            owner: 'Bob'
          },
          {
            content: 'Comment 2',
            date: new Date('November 11, 2015 04:00:00').toISOString(),
            owner: 'Sara'
          },
          {
            content: 'Comment 3',
            date: new Date('November 12, 2015 05:00:00').toISOString(),
            owner: 'Jake'
          }
        ], 'content');

        expect(commentDocs).to.deep.equal(expectedCommentDocs);

        done();
      });
    });
  });

  it('should save when ref is just an id', function (done) {
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
      owner: User
    });

    var Post = lounge.model('Post', postSchema);

    var user = new User({
      firstName: 'Will',
      lastName: 'Smith',
      email: 'willie@gmail.com'
    });

    user.save(function (err, savedUserDoc) {

      expect(err).to.not.be.ok;

      expect(savedUserDoc).to.be.ok;
      expect(savedUserDoc).to.be.an('object');
      expect(savedUserDoc).to.be.an.instanceof(User);
      expect(savedUserDoc.id).to.be.ok;
      expect(savedUserDoc.id).to.be.a('string');
      expect(savedUserDoc.id).to.equal(user.id);
      expect(savedUserDoc.email).to.equal('willie@gmail.com');
      expect(savedUserDoc.firstName).to.equal('Will');
      expect(savedUserDoc.lastName).to.equal('Smith');

      var now = new Date();

      var post = new Post({
        title: 'sample title',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tempor iaculis nunc vel tempus. Donec fringilla orci et posuere hendrerit.',
        date: now,
        owner: user.id
      });

      post.save(function (err, savedDoc) {

        expect(err).to.not.be.ok;

        expect(savedUserDoc).to.be.ok;
        expect(savedUserDoc).to.be.an('object');
        expect(savedUserDoc).to.be.an.instanceof(User);
        expect(savedUserDoc.id).to.be.ok;
        expect(savedUserDoc.id).to.be.a('string');
        expect(savedUserDoc.id).to.equal(user.id);
        expect(savedUserDoc.email).to.equal('willie@gmail.com');
        expect(savedUserDoc.firstName).to.equal('Will');
        expect(savedUserDoc.lastName).to.equal('Smith');

        expect(savedDoc).to.be.ok;
        expect(savedDoc).to.be.an('object');
        expect(savedDoc.id).to.be.ok;
        expect(savedDoc.id).to.be.a('string');
        expect(savedDoc.content).to.equal(post.content);
        expect(savedDoc.title).to.equal(post.title);
        expect(savedDoc.date).to.be.an.instanceof(Date);
        expect(savedDoc.date.toString()).to.equal(now.toString());
        expect(savedDoc.owner).to.be.ok;
        expect(savedDoc.owner).to.be.a('string');

        var postKey = savedDoc.getDocumentKeyValue(true);
        var userKey = savedUserDoc.getDocumentKeyValue(true);
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
            owner: userKey
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

  it('should work with a mix of refs and refs in array with a mix of objects and string ids', function (done) {
    var userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: String,
      dateOfBirth: Date
    });

    var User = lounge.model('User', userSchema);

    var commentSchema = lounge.schema({
      content: String,
      date: Date,
      owner: User
    });

    var Comment = lounge.model('Comment', commentSchema);

    var postSchema = lounge.schema({
      title: String,
      content: String,
      date: Date,
      owner: User,
      comments: [Comment]
    });

    var Post = lounge.model('Post', postSchema);

    var dob1 = new Date('March 3, 1990 03:30:00');
    var dob2 = new Date('April 7, 1985 11:22:00');

    var user1 = new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com',
      dateOfBirth: dob1
    });

    var user2 = new User({
      firstName: 'Jay',
      lastName: 'Rock',
      email: 'jrock@gmail.com',
      dateOfBirth: dob2.toISOString()
    });

    var comments = [
      new Comment({
        content: 'Comment 1',
        date: new Date('November 10, 2015 03:00:00'),
        owner: user2
      }),
      new Comment({
        content: 'Comment 2',
        date: new Date('November 11, 2015 04:00:00'),
        owner: user1
      }),
      new Comment({
        content: 'Comment 3',
        date: new Date('November 12, 2015 05:00:00'),
        owner: user2.id
      })
    ];

    var now = new Date();

    var post = new Post({
      title: 'sample title',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tempor iaculis nunc vel tempus. Donec fringilla orci et posuere hendrerit.',
      date: now,
      owner: user1,
      comments: comments
    });

    post.save(function (err, savedDoc) {

      expect(err).to.not.be.ok;

      expect(savedDoc).to.be.ok;
      expect(savedDoc).to.be.an('object');
      expect(savedDoc).to.be.an.instanceof(Post);
      expect(savedDoc.id).to.be.ok;
      expect(savedDoc.id).to.be.a('string');
      expect(savedDoc.id).to.equal(post.id);

      var keys = [user1.id, user2.id, comments[0].id, comments[1].id, comments[2].id, post.id];

      bucket.getMulti(keys, function (err, docs) {
        expect(err).to.not.be.ok;

        expect(Object.keys(docs).length).to.equal(6);

        var user1doc = docs[user1.id].value;
        var user2doc = docs[user2.id].value;
        var comment1Doc = docs[comments[0].id].value;
        var comment2Doc = docs[comments[1].id].value;
        var comment3Doc = docs[comments[2].id].value;
        var postDoc = docs[post.id].value;

        // USER 1
        expect(user1doc).to.be.ok;
        expect(user1doc).to.be.an('object');
        expect(user1doc.id).to.equal(user1.id);

        delete user1doc.id;

        var expectedUser1 = {
          firstName: 'Joe',
          lastName: 'Smith',
          email: 'joe@gmail.com',
          dateOfBirth: dob1.toISOString()
        };

        expect(user1doc).to.deep.equal(expectedUser1);

        // USER 2
        expect(user2doc).to.be.ok;
        expect(user2doc).to.be.an('object');
        expect(user2doc.id).to.equal(user2.id);

        delete user2doc.id;

        var expectedUser2 = {
          firstName: 'Jay',
          lastName: 'Rock',
          email: 'jrock@gmail.com',
          dateOfBirth: dob2.toISOString()
        };

        expect(user2doc).to.deep.equal(expectedUser2);

        // COMMENTS

        var commentDocs = _.sortBy([comment1Doc, comment2Doc, comment3Doc], 'id');

        var expectedComments = _.sortBy([comments[0].toObject(), comments[1].toObject(), comments[2].toObject()], 'id');

        expectedComments = _.map(expectedComments, function (comment) {
          comment.date = comment.date.toISOString();
          if (comment.owner.id) {
            comment.owner = comment.owner.id;
          }

          return comment;
        });

        expect(commentDocs).to.deep.equal(expectedComments);

        // POST

        var expectedPost = {
          title: 'sample title',
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tempor iaculis nunc vel tempus. Donec fringilla orci et posuere hendrerit.',
          date: now.toISOString(),
          owner: user1.id,
          comments: [comment1Doc.id, comment2Doc.id, comment3Doc.id].sort(),
          id: post.id
        };

        expect(postDoc.comments).to.be.instanceOf(Array);

        postDoc.comments.sort();

        expect(postDoc).to.deep.equal(expectedPost);

        done();
      });
    });
  });

  describe('save() pre hooks tests', function () {
    this.slow(200);

    it('should call sync pre save', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var preCalled = false;

      userSchema.pre('save', function (next) {
        if (this.email) {
          this.email = this.email.toLowerCase();
        }

        preCalled = true;
        next();
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('March 3, 1990 03:30:00');

      var email = 'JOE@gmail.com';

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: email,
        dateOfBirth: dob
      });

      user.save(function (err, savedDoc) {
        expect(err).to.not.be.ok;
        expect(savedDoc).to.be.ok;
        expect(savedDoc.email).to.equal(email.toLowerCase());
        expect(preCalled).to.be.ok;
        done();
      });
    });

    it('should call async pre save', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var preCalled = false;

      userSchema.pre('save', true, function (next, done) {
        var self = this;
        setTimeout(function () {
          if (self.email) {
            self.email = self.email.toLowerCase();
          }
          done();
          preCalled = true;
        }, 100);
        next();
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('March 3, 1990 03:30:00');

      var email = 'JOE@gmail.com';

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: email,
        dateOfBirth: dob
      });

      user.save(function (err, savedDoc) {
        expect(err).to.not.be.ok;
        expect(savedDoc).to.be.ok;
        expect(savedDoc.email).to.equal(email.toLowerCase());
        expect(preCalled).to.be.ok;
        done();
      });
    });

    it('should call sync pre save and it should abort the save', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var preCalled = false;
      var missingDOB = 'Missing date of birth';

      userSchema.pre('save', function (next) {
        if (this.email) {
          this.email = this.email.toLowerCase();
        }

        preCalled = true;

        if (!this.dob) {
          return next(new Error(missingDOB));
        }

        next();
      });

      var User = lounge.model('User', userSchema);

      var email = 'JOE@gmail.com';

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: email
      });

      user.save(function (err, savedDoc) {
        expect(err).to.be.ok;
        expect(err.message).to.equal(missingDOB);
        expect(preCalled).to.be.ok;

        var docKey = User.getDocumentKeyValue(user.id, true);
        bucket.get(docKey, function (err, doc) {
          expect(doc).to.not.be.ok;
          expect(err).to.be.ok;
          expect(err.code).to.equal(couchbase.errors.keyNotFound);

          done();
        });
      });
    });
  });

  describe('save() post hooks tests', function () {
    this.slow(200);

    it('should call sync post save', function (done) {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var postCalled = false;

      userSchema.post('save', function () {
        postCalled = true;
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('March 3, 1990 03:30:00');

      var email = 'joe@gmail.com';

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: email,
        dateOfBirth: dob
      });

      user.save(function (err, savedDoc) {
        expect(err).to.not.be.ok;
        expect(savedDoc).to.be.ok;
        expect(savedDoc.email).to.equal(email);

        setTimeout(function () {
          expect(postCalled).to.be.ok;
          done();
        }, 100);
      });
    });

    it('should not call sync post save middleware on save error', function (done) {
      process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL = true;

      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var postCalled = false;

      userSchema.post('save', function () {
        postCalled = true;
        next();
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('March 3, 1990 03:30:00');

      var email = 'joe@gmail.com';

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: email,
        dateOfBirth: dob
      });

      user.save(function (err, savedDoc) {
        expect(err).to.be.ok;
        expect(savedDoc).to.not.be.ok;

        setTimeout(function () {
          expect(postCalled).to.not.be.ok;
          delete process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL;
          done();
        }, 100);
      });
    });
  });
});