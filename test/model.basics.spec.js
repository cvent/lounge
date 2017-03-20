var _ = require('lodash');
var expect = require('chai').expect;
var lounge = require('../index');

describe('Model basics', function () {
  beforeEach(function (done) {
    lounge = new lounge.Lounge(); // recreate it
    lounge.connect({
      connectionString: 'couchbase://127.0.0.1',
      bucket: 'lounge_test'
    }, function (err, bucket) {
      bucket.manager().flush(done);
    });
  });

  describe('Model creation', function () {
    it('Should properly create a model', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('December 10, 1990 03:33:00');

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob
      });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Document).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));

      // should not be able to change modelName property
      expect(user.modelName).to.equal('User');
      user.modelName = 'Foo';
      expect(user.modelName).to.equal('User');
      User.modelName = 'Foo';
      expect(User.modelName).to.equal('User');
    });

    it('Should properly create multiple models from same source data', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('December 10, 1990 03:33:00');

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob
      };

      var user = new User(data);

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Document).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));

      // should not be able to change modelName property
      expect(user.modelName).to.equal('User');
      user.modelName = 'Foo';
      expect(user.modelName).to.equal('User');
      User.modelName = 'Foo';
      expect(User.modelName).to.equal('User');

      var user2 = new User(data);

      expect(user2 instanceof User).to.be.ok;
      expect(user2 instanceof lounge.Document).to.be.ok;
      expect(user2 instanceof lounge.Model).to.be.ok;

      expect(user2.firstName).to.equal('Joe');
      expect(user2.lastName).to.equal('Smith');
      expect(user2.email).to.equal('joe@gmail.com');
      expect(user2.dateOfBirth).to.be.ok;
      expect(user2.dateOfBirth).to.be.an.instanceof(Date);
      expect(user2.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));

      // should not be able to change modelName property
      expect(user2.modelName).to.equal('User');
      user2.modelName = 'Foo';
      expect(user2.modelName).to.equal('User');
    });

    it('Should properly create a model with sub documents and arrays', function () {
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

      var dob = new Date('December 10, 1990 03:33:00');

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob,
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

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Document).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites.toArray()).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp).to.deep.equal({ abc: 'xyz', sbp: false, snp: 11 });
    });

    it('Should properly create multiple models from same source data with sub documents and arrays when using clone option', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date,
        foo: Number,
        favourites: [String],
        boolProp: Boolean,
        someProp: {
          abc: String,
          foo: Boolean,
          bar: Number
        }
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('December 10, 1990 03:33:00');

      var data = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob,
        foo: 5,
        boolProp: true,
        favourites: [
          'fav0', 'fav1', 'fav2'
        ],
        someProp: {
          abc: 'xyz',
          foo: false,
          bar: 11
        }
      };

      var user = new User(data, { clone: true });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Document).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites.toArray()).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp.toObject()).to.deep.equal({ abc: 'xyz', foo: false, bar: 11 });
      var user2 = new User(data, { clone: true });

      expect(user2 instanceof User).to.be.ok;
      expect(user2 instanceof lounge.Document).to.be.ok;
      expect(user2 instanceof lounge.Model).to.be.ok;

      expect(user2.firstName).to.equal('Joe');
      expect(user2.lastName).to.equal('Smith');
      expect(user2.email).to.equal('joe@gmail.com');
      expect(user2.dateOfBirth).to.be.ok;
      expect(user2.dateOfBirth).to.be.an.instanceof(Date);
      expect(user2.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
      expect(user2.foo).to.equal(5);
      expect(user2.boolProp).to.equal(true);
      expect(user2.favourites.toArray()).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user2.someProp.toObject()).to.deep.equal({ abc: 'xyz', foo: false, bar: 11 });

      user.email = 'email1@gmail.com';
      user2.email = 'email2@gmail.com';

      expect(user.email).to.equal('email1@gmail.com');
      expect(user2.email).to.equal('email2@gmail.com');
    });

    it('Should properly create a model with embedded document', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user:' },
        firstName: String,
        lastName: String
      });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({
        owner: User,
        content: String
      });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ owner: user, content: 'Lorem ipsum' });

      expect(user).to.be.ok;
      expect(user).to.be.an.instanceof(User);
      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');

      expect(post).to.be.ok;
      expect(post.id).to.be.ok;
      expect(post.id).to.be.a('string');
      expect(post.content).to.equal('Lorem ipsum');
      expect(post.owner).to.be.ok;
      expect(post.owner).to.be.an.instanceof(User);
      expect(post.owner.id).to.not.be.ok;
      expect(post.owner.email).to.equal('joe@gmail.com');
      expect(post.owner.firstName).to.equal('Joe');
      expect(post.owner.lastName).to.equal('Smith');
    });

    it('Should properly create multiple models with embedded document from same source', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user:' },
        firstName: String,
        lastName: String
      });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({
        owner: User,
        content: String
      });
      var Post = lounge.model('Post', postSchema);

      var userData = { email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' };

      var user = new User(userData);
      var postData = { owner: user, content: 'Lorem ipsum' };

      var post = new Post(postData);

      expect(user).to.be.ok;
      expect(user).to.be.an.instanceof(User);
      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');

      expect(post).to.be.ok;
      expect(post.id).to.be.ok;
      expect(post.id).to.be.a('string');
      expect(post.content).to.equal('Lorem ipsum');
      expect(post.owner).to.be.ok;
      expect(post.owner).to.be.an.instanceof(User);
      expect(post.owner.id).to.not.be.ok;
      expect(post.owner.email).to.equal('joe@gmail.com');
      expect(post.owner.firstName).to.equal('Joe');
      expect(post.owner.lastName).to.equal('Smith');

      var user2 = new User(userData);
      var post2 = new Post(postData);

      expect(user2).to.be.ok;
      expect(user2).to.be.an.instanceof(User);
      expect(user2.firstName).to.equal('Joe');
      expect(user2.lastName).to.equal('Smith');
      expect(user2.email).to.equal('joe@gmail.com');

      expect(post2).to.be.ok;
      expect(post2.id).to.be.ok;
      expect(post2.id).to.be.a('string');
      expect(post2.content).to.equal('Lorem ipsum');
      expect(post2.owner).to.be.ok;
      expect(post2.owner).to.be.an.instanceof(User);
      expect(post2.owner.id).to.not.be.ok;
      expect(post2.owner.email).to.equal('joe@gmail.com');
      expect(post2.owner.firstName).to.equal('Joe');
      expect(post2.owner.lastName).to.equal('Smith');
    });

    it('Should ignore unknown properties', function () {
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

      var dob = new Date('December 10, 1990 03:33:00');

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob,
        foo: 5,
        unpa: 'something',
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

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Document).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites.toArray()).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp).to.deep.equal({ abc: 'xyz', sbp: false, snp: 11 });
      expect(user.unpa).to.not.be.ok;
    });

    it('Should properly coerse string to Date when needed', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('December 10, 1990 03:33:00');

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob.toISOString()
      });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Document).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
    });

    it('Should properly change array property', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: { type: String, key: true, generate: false },
        usernames: [{ type: String }]
      });

      var User = lounge.model('User', userSchema);

      var usernames1 = ['js1', 'js2', 'js3'].sort();
      var usernames2 = ['jsnew1', 'js2', 'jsnew3'].sort();
      var usernames3 = ['jsnew4', 'js5', 'jsnew6'].sort();

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        usernames: usernames1
      });

      expect(user.usernames.sort().toArray()).to.deep.equal(usernames1);

      user.set('usernames', usernames2);
      expect(user.usernames.sort().toArray()).to.deep.equal(usernames2);

      user.usernames = usernames3;
      expect(user.usernames.toArray().sort()).to.deep.equal(usernames3);

      user.set({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bjones@gmail.com',
        usernames: usernames1
      });

      var expectedData = {
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bjones@gmail.com',
        usernames: usernames1
      };

      expect(user.toObject()).to.deep.equal(expectedData);
    });

    it('Should properly change array ref property', function () {
      var fooSchema = lounge.schema({
        a: String,
        b: String
      });

      var Foo = lounge.model('Foo', fooSchema);

      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        foos: [Foo]
      });

      var User = lounge.model('User', userSchema);

      var foos1 = _.sortBy([
        new Foo({
          a: 'a1',
          b: 'b1'
        }),
        new Foo({
          a: 'a2',
          b: 'b2'
        })
      ], 'a');

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        foos: foos1
      });

      expect(user.foos.map(function (r) { return r.toObject(); }))
        .to.deep.equal(foos1.map(function (r) { return r.toObject(); }));

      user.foos.push(new Foo({
        a: 'a3',
        b: 'b3'
      }));

      foos1.push(new Foo({
        a: 'a3',
        b: 'b3'
      }));

      user.foos.forEach(function (f, i) {
        expect(f.a).to.equal(foos1[i].a);
        expect(f.b).to.equal(foos1[i].b);
      });

      var foos2 = [
        'newFooId1',
        new Foo({
          a: 'newa1',
          b: 'newb1'
        }),
        new Foo({
          a: 'newa2',
          b: 'newb2'
        })
      ];

      user.foos = foos2;

      user.foos.forEach(function (f, i) {
        expect(f.a).to.equal(foos2[i].a);
        expect(f.b).to.equal(foos2[i].b);
      });
    });

    it('should properly create a model with manual ref of a model that is later defined', function () {
      var siteSchema = lounge.schema({
        owner: { type: lounge.Model, modelName: 'User' },
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var userSchema = lounge.schema({
        email: String,
        name: String
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe Smith',
        email: 'jsmith@gmail.com'
      });

      var site = new Site({
        url: 'http://wwww.mysite.org',
        owner: user
      });

      expect(site).to.be.instanceof(Site);
      expect(site.owner).to.be.ok;
      expect(site.owner).to.be.instanceof(User);
      expect(site.url).to.equal('http://wwww.mysite.org');
      expect(site.owner.name).to.equal('Joe Smith');
      expect(site.owner.email).to.equal('jsmith@gmail.com');
    });

    it('should get value at path using get()', function () {
      var userSchema = lounge.schema({
        email: String,
        name: String
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe Smith',
        email: 'jsmith@gmail.com'
      });

      var name = user.get('name');
      var email = user.get('email');
      var unknown = user.get('foo');
      expect(name).to.equal('Joe Smith');
      expect(email).to.equal('jsmith@gmail.com');
      expect(unknown).to.not.be.ok;
    });
  });

  describe('Nested properties tests', function () {
    it('Should properly get and set nested properties', function () {
      var userSchema = lounge.schema({
        name: String,
        profile: {
          email: String,
          age: Number
        }
      });

      var User = lounge.model('User', userSchema);
      var user = new User({
        name: 'Bob Smith',
        profile: {
          email: 'p1@p1.com',
          age: 10
        }
      });

      expect(user.name).to.equal(user.name);
      expect(user.profile.toObject()).to.deep.equal({ email: 'p1@p1.com', age: 10 });

      // this should work
      user.set('profile', {
        email: 'bsmith5@gmail.com',
        age: 25
      });

      expect(user.profile.email).to.equal('bsmith5@gmail.com');
      expect(user.profile.age).to.equal(25);

      user.profile.email = 'bsmith@gmail.com';
      user.profile.age = 20;

      expect(user.profile.email).to.equal('bsmith@gmail.com');
      expect(user.profile.age).to.equal(20);

      user.profile = {
        email: 'bsmith2@gmail.com',
        age: 22,
        foo: 'bar'
      };

      expect(user.profile.toObject()).to.deep.equal({
        email: 'bsmith2@gmail.com',
        age: 22
      });

      user.profile.email = 123;

      expect(user.profile.toObject()).to.deep.equal({
        email: '123',
        age: 22
      });

      // this should work
      user.set('profile', {
        email: 'bsmith3@gmail.com',
        age: 23
      });

      expect(user.profile.toObject()).to.deep.equal({
        email: 'bsmith3@gmail.com',
        age: 23
      });

      user.profile.set({
        email: 'bsmith3@gmail.com',
        age: 23
      });

      expect(user.profile.toObject()).to.deep.equal({
        email: 'bsmith3@gmail.com',
        age: 23
      });
    });

    it('Should properly get and set nested properties 2', function () {
      var userSchema = lounge.schema({
        name: String,
        profile: {
          email: String,
          age: Number
        }
      });

      var User = lounge.model('User', userSchema);
      var user = new User({
        name: 'Bob Smith',
        profile: {
          email: 'bsmith2@gmail.com',
          age: 22
        }
      });

      expect(user.name).to.equal(user.name);
      expect(user.profile.toObject()).to.deep.equal({ email: 'bsmith2@gmail.com', age: 22 });

      user.profile.set({
        email: 'bsmith@gmail.com',
        age: 20,
        foo: 'bar'
      });

      expect(user.profile.toObject()).to.deep.equal({
        email: 'bsmith@gmail.com',
        age: 20
      });

      user.profile.email = 123;

      expect(user.profile.toObject()).to.deep.equal({
        email: '123',
        age: 20
      });
    });

    it('Should properly work with object in an array', function () {
      var userSchema = lounge.schema({
        name: String,
        profiles: [{
          email: String,
          age: Number
        }]
      });

      var User = lounge.model('User', userSchema);
      var user = new User({
        name: 'Bob Smith'
      });

      expect(user.name).to.equal(user.name);
      expect(user.profiles.toArray()).to.deep.equal([]);

      user.profiles.push({
        email: 'bsmith@gmail.com',
        age: 20
      });

      expect(user.profiles.toArray()).to.deep.equal([{ email: 'bsmith@gmail.com', age: 20 }]);

      user.profiles = [{
        email: 'bsmith2@gmail.com',
        age: 21
      }, {
        email: 'bsmith3@gmail.com',
        age: 22
      }];

      expect(user.profiles.toArray()).to.deep.equal([{
        email: 'bsmith2@gmail.com',
        age: 21
      }, {
        email: 'bsmith3@gmail.com',
        age: 22
      }]);
    });

    it('Should properly work with basic types in an array', function () {
      var userSchema = lounge.schema({
        name: String,
        usernames: [String]
      });

      var User = lounge.model('User', userSchema);
      var user = new User({
        name: 'Bob Smith'
      });

      expect(user.name).to.equal(user.name);
      expect(user.usernames.toArray()).to.deep.equal([]);

      // should not work
      user.usernames.push({
        email: 'bsmith@gmail.com',
        age: 20
      });

      expect(user.usernames.toArray()).to.deep.equal([]);

      user.usernames.push('user1');

      expect(user.usernames.toArray()).to.deep.equal(['user1']);

      // should not work
      user.usernames = [{
        email: 'bsmith2@gmail.com',
        age: 21
      }, {
        email: 'bsmith3@gmail.com',
        age: 22
      }];

      expect(user.usernames.toArray()).to.deep.equal(['user1']);

      // should not work
      user.usernames.set([{
        email: 'bsmith2@gmail.com',
        age: 21
      }, {
        email: 'bsmith3@gmail.com',
        age: 22
      }]);

      expect(user.usernames.toArray()).to.deep.equal(['user1']);

      user.usernames.set(['user2', 'user3']);

      expect(user.usernames.toArray()).to.deep.equal(['user2', 'user3']);

      user.usernames = ['user4', 'user5', 'user6'];

      expect(user.usernames.toArray()).to.deep.equal(['user4', 'user5', 'user6']);

      // should work because we cast boolean to string
      user.usernames = ['user7', 'user8', true, 'user8'];

      expect(user.usernames.toArray()).to.deep.equal(['user7', 'user8', 'true', 'user8']);
    })

    it('Should properly work with object in an array and mixing with actions', function () {
      var userSchema = lounge.schema({
        name: String,
        profiles: [{
          email: String,
          age: Number
        }]
      });

      var User = lounge.model('User', userSchema);
      var user = new User({
        name: 'Bob Smith'
      });

      expect(user.name).to.equal(user.name);
      expect(user.profiles.toArray()).to.deep.equal([]);

      user.profiles.push({
        email: 'bsmith@gmail.com',
        age: 20
      });

      expect(user.profiles.toArray()).to.deep.equal([{ email: 'bsmith@gmail.com', age: 20 }]);

      user.profiles = [{
        email: 'bsmith2@gmail.com',
        age: 21
      }, {
        email: 'bsmith3@gmail.com',
        age: 22
      }];

      expect(user.profiles.toArray()).to.deep.equal([{
        email: 'bsmith2@gmail.com',
        age: 21
      }, {
        email: 'bsmith3@gmail.com',
        age: 22
      }]);

      var user1Profiles = user.profiles;
      var existing = _.find(user1Profiles, { email: 'bsmith2@gmail.com' });
      expect(existing).to.be.ok;

      var profiles2 = [{
        email: 'bsmith4@gmail.com',
        age: 24
      }, existing];

      var user2 = new User({
        name: 'User 2',
        profiles: profiles2
      });

      expect(user2.profiles.toArray()).to.deep.equal([{
        email: 'bsmith4@gmail.com',
        age: 24
      }, {
        email: 'bsmith2@gmail.com',
        age: 21
      }]);

      var user3 = new User({
        name: 'User 3'
      });

      var profiles3 = [{
        email: 'bsmith4@gmail.com',
        age: 24
      }, existing];

      user3.profiles = profiles3;

      expect(user3.profiles.toArray()).to.deep.equal([{
        email: 'bsmith4@gmail.com',
        age: 24
      }, {
        email: 'bsmith2@gmail.com',
        age: 21
      }]);

      var user4 = new User({
        name: 'User 4',
        profiles: [existing]
      });

      user4.profiles.push({
        email: 'bsmith4@gmail.com',
        age: 24
      });

      expect(user4.profiles.toArray()).to.deep.equal([{
        email: 'bsmith2@gmail.com',
        age: 21
      }, {
        email: 'bsmith4@gmail.com',
        age: 24
      }]);

      var user5 = new User({
        name: 'User 5',
        profiles: [{
          email: 'bsmith4@gmail.com',
          age: 24
        }]
      });

      user5.profiles.push(existing);

      expect(user5.profiles.toArray()).to.deep.equal([{
        email: 'bsmith4@gmail.com',
        age: 24
      }, {
        email: 'bsmith2@gmail.com',
        age: 21
      }]);
    });
  });

  describe('clear()', function () {
    it('should return array elements to their original state, which is an empty array', function () {
      var schema = lounge.schema({
        strings: [String]
      });

      var CModel = lounge.model('cmodel', schema);

      var o = new CModel();
      o.strings.push('hello');
      expect(o.strings).to.have.lengthOf(1);
      o.clear();
      expect(o.strings).to.be.ok;
      expect(o.strings).to.have.lengthOf(0);
    });

    it('should clear a simple document', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('December 10, 1990 03:33:00');

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob
      });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));

      user.clear();

      expect(user.firstName).to.not.be.ok;
      expect(user.lastName).to.not.be.ok;
      expect(user.email).to.not.be.ok;
      expect(user.dateOfBirth).to.not.be.ok;
    });

    it('should be able to set after clear a simple document', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        dateOfBirth: Date
      });

      var User = lounge.model('User', userSchema);

      var dob = new Date('December 10, 1990 03:33:00');

      var d = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob
      };

      var user = new User(d);

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));

      user.clear();

      expect(user.firstName).to.not.be.ok;
      expect(user.lastName).to.not.be.ok;
      expect(user.email).to.not.be.ok;
      expect(user.dateOfBirth).to.not.be.ok;

      user.set(d);

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
    });

    it('Should properly clear a model with sub documents and arrays', function () {
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

      var dob = new Date('December 10, 1990 03:33:00');

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob,
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

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites.toArray()).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp).to.deep.equal({ abc: 'xyz', sbp: false, snp: 11 });

      user.clear();

      expect(user.firstName).to.not.be.ok;
      expect(user.lastName).to.not.be.ok;
      expect(user.email).to.not.be.ok;
      expect(user.dateOfBirth).to.not.be.ok;
      expect(user.foo).to.not.be.ok;
      expect(user.boolProp).to.not.be.ok;
      expect(user.favourites).to.be.empty;
      expect(user.someProp).to.not.be.ok;
    });

    it('Should be able to set after clear a model with sub documents and arrays', function () {
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

      var dob = new Date('December 10, 1990 03:33:00');

      var d = {
        firstName: 'Joe',
        lastName: 'Smith',
        email: 'joe@gmail.com',
        dateOfBirth: dob,
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

      var user = new User(d);

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites.toArray()).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp).to.deep.equal({ abc: 'xyz', sbp: false, snp: 11 });

      user.clear();

      expect(user.firstName).to.not.be.ok;
      expect(user.lastName).to.not.be.ok;
      expect(user.email).to.not.be.ok;
      expect(user.dateOfBirth).to.not.be.ok;
      expect(user.foo).to.not.be.ok;
      expect(user.boolProp).to.not.be.ok;
      expect(user.favourites).to.be.empty;
      expect(user.someProp).to.not.be.ok;

      user.set(d);

      expect(user.firstName).to.equal('Joe');
      expect(user.lastName).to.equal('Smith');
      expect(user.email).to.equal('joe@gmail.com');
      expect(user.dateOfBirth).to.be.ok;
      expect(user.dateOfBirth).to.be.an.instanceof(Date);
      expect(user.dateOfBirth.toString()).to.equal((new Date('December 10, 1990 03:33:00').toString()));
      expect(user.foo).to.equal(5);
      expect(user.boolProp).to.equal(true);
      expect(user.favourites.toArray()).to.deep.equal(['fav0', 'fav1', 'fav2']);
      expect(user.someProp).to.deep.equal({ abc: 'xyz', sbp: false, snp: 11 });
    });

    it('should use custom clear() function defined in the schema', function () {
      var userSchema = lounge.schema({
        SSN: String,
        name: String,
        email: String
      });

      userSchema.set('clear', function () {
        delete this.name;
        delete this.email;
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        SSN: '1234567890',
        name: 'Joe Smith',
        email: 'joe@gmail.com'
      });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.name).to.equal('Joe Smith');
      expect(user.SSN).to.equal('1234567890');
      expect(user.email).to.equal('joe@gmail.com');

      user.clear();

      expect(user.SSN).to.equal('1234567890');
      expect(user.name).to.not.be.ok;
      expect(user.email).to.not.be.ok;
    });

    it('should clear() when a field has no value', function () {
      var userSchema = lounge.schema({
        SSN: String,
        name: String,
        email: String
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        SSN: '1234567890',
        name: null,
        email: 'bruce@wayne-industries.com'
      });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.name).to.not.be.ok;
      expect(user.SSN).to.equal('1234567890');
      expect(user.email).to.equal('bruce@wayne-industries.com');

      user.clear();

      expect(user.name).to.not.be.ok;
      expect(user.SSN).to.not.be.ok;
      expect(user.email).to.not.be.ok;
    });

    it('should clear() transient field when value is set', function () {
      var userSchema = lounge.schema({
        SSN: String,
        name: String,
        email: String,
        address: {type: Object, serializable: false}
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        SSN: '1234567890',
        name: 'Bruce Wayne',
        email: 'bruce@wayne-industries.com',
        address: {
          streetAddress: 'Wayne Manor',
          city: 'Gotham City'
        }
      });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.name).to.equal('Bruce Wayne');
      expect(user.SSN).to.equal('1234567890');
      expect(user.email).to.equal('bruce@wayne-industries.com');
      expect(user.address).to.be.an('object');

      user.clear();

      expect(user.name).to.not.be.ok;
      expect(user.SSN).to.not.be.ok;
      expect(user.email).to.not.be.ok;
      expect(user.address).to.not.be.ok;
    });

    it('should clear() transient field when value is not set', function () {
      var userSchema = lounge.schema({
        SSN: String,
        name: String,
        email: String,
        address: {type: Object, serializable: false}
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        SSN: '1234567890',
        name: 'Bruce Wayne',
        email: 'bruce@wayne-industries.com'
      });

      expect(user instanceof User).to.be.ok;
      expect(user instanceof lounge.Model).to.be.ok;

      expect(user.name).to.equal('Bruce Wayne');
      expect(user.SSN).to.equal('1234567890');
      expect(user.email).to.equal('bruce@wayne-industries.com');

      user.clear();

      expect(user.name).to.not.be.ok;
      expect(user.SSN).to.not.be.ok;
      expect(user.email).to.not.be.ok;
    });
  });
});
