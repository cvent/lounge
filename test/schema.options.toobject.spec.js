var lounge = require('../');
var expect = require('chai').expect;

describe('Schema options', function () {

  beforeEach(function () {
    lounge = new lounge.Lounge(); // recreate it
  });

  describe('toObject', function () {

    it('Should just work without any options', function () {
      var userSchema = lounge.schema({ name: String, email: String });
      var User = lounge.model('User', userSchema);
      var user = new User({ name: 'Joe', email: 'joe@gmail.com' });
      var obj = user.toObject();

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      delete obj.id;
      expect(obj).to.deep.equal(expected);
    });

    it('Should just work without any options when we set a property to null', function () {
      var userSchema = lounge.schema({ name: String, email: String });
      var User = lounge.model('User', userSchema);
      var user = new User({ name: 'Joe', email: 'joe@gmail.com' });
      var obj = user.toObject();

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);

      user.email = null;

      obj = user.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal({ name: 'Joe' });
    });

    it('should not return invisible properties', function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: { type: String, invisible: true }
      });

      var User = lounge.model('User', userSchema);
      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'asdf' });
      var obj = user.toObject();

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      delete obj.id;
      expect(obj).to.deep.equal(expected);
    });

    it('should not return invisible properties but return non serializable', function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: { type: String, invisible: true },
        tempProp: { type: Number, serializable: false }
      });

      var User = lounge.model('User', userSchema);
      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'asdf', tempProp: 11 });
      var obj = user.toObject();

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com',
        tempProp: 11
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      delete obj.id;
      expect(obj).to.deep.equal(expected);
    });

    it('Should transform if given the option', function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: String
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      var obj = user.toObject({ transform: xform });

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should transform if given the option only the specific object', function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: String
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var user2 = new User({
        name: 'Bob',
        email: 'bob@gmail.com',
        password: 'password2'
      });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      var obj1 = user.toObject({ transform: xform });
      var obj2 = user2.toObject();

      var expected1 = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      var expected2 = {
        name: 'Bob',
        email: 'bob@gmail.com',
        password: 'password2'
      };

      expect(obj1.id).to.be.ok;
      expect(obj1.id).to.be.a('string');

      delete obj1.id;

      expect(obj2.id).to.be.ok;
      expect(obj2.id).to.be.a('string');

      delete obj2.id;

      expect(obj1).to.deep.equal(expected1);
      expect(obj2).to.deep.equal(expected2);
    });

    it('Should transform if given the option at schema level', function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: String
      });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', { transform: xform });

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var obj = user.toObject();

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should not effect toJSON if having a transform at schema level', function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: String
      });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', { transform: xform });

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var obj = user.toJSON();

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should perform transform correctly on nested objects', function () {
      var userSchema = lounge.schema({ name: String, email: String, password: String });


      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', { transform: xform });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'password' }),
        post = new Post({ owner: user, content: 'I like lounge :)' });

      var obj = post.toObject();

      var expected = {
        content: 'I like lounge :)',
        owner: {
          name: 'Joe',
          email: 'joe@gmail.com'
        }
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.be.ok;
      expect(obj.owner.id).to.be.a('string');

      delete obj.id;
      delete obj.owner.id;

      expect(obj).to.deep.equal(expected);
    });

    it.skip('Should perform transform correctly on nested objects when using inline tranform on one of them', function () {
      var userSchema = lounge.schema({ name: String, email: String, password: String });

      var userxform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', { transform: userxform });

      var postxform = function (doc, ret, options) {
        ret.content = doc.content.toUpperCase();
        return ret;
      };

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'password' }),
        post = new Post({ owner: user, content: 'I like lounge :)' });

      var obj = post.toObject({ transform: postxform });

      var expected = {
        content: 'I LIKE LOUNGE :)',
        owner: {
          name: 'Joe',
          email: 'joe@gmail.com'
        }
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.be.ok;
      expect(obj.owner.id).to.be.a('string');

      delete obj.id;
      delete obj.owner.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should perform transform correctly on nested objects when using schema tranform on both of them', function () {
      var userSchema = lounge.schema({ name: String, email: String, password: String });

      var userxform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', { transform: userxform });

      var postxform = function (doc, ret, options) {
        ret.content = doc.content.toUpperCase();
        return ret;
      };

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      postSchema.set('toObject', { transform: postxform });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'password' }),
        post = new Post({ owner: user, content: 'I like lounge :)' });

      var obj = post.toObject();

      var expected = {
        content: 'I LIKE LOUNGE :)',
        owner: {
          name: 'Joe',
          email: 'joe@gmail.com'
        }
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.be.ok;
      expect(obj.owner.id).to.be.a('string');

      delete obj.id;
      delete obj.owner.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should not get virtuals if not given the option', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        password: String
      });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var obj = user.toObject();

      var expected = {
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should get virtuals if given the option at schema level', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        password: String
      });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toObject', { virtuals: true });

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var obj = user.toObject();

      var expected = {
        firstName: 'Joe',
        lastName: 'Smith',
        fullName: 'Joe Smith',
        password: 'password'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should get virtuals if given the option at inline level', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        password: String
      });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var obj = user.toObject({ virtuals: true });

      var expected = {
        firstName: 'Joe',
        lastName: 'Smith',
        fullName: 'Joe Smith',
        password: 'password'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should perform correctly on nested objects when using virtuals on both models inline option', function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: 'I like lounge :)' });

      var obj = post.toObject({ virtuals: true });

      var expected = {
        owner: {
          firstName: 'Joe',
          lastName: 'Smith',
          password: 'password',
          fullName: 'Joe Smith'
        },
        content: 'I like lounge :)',
        capContent: 'I LIKE LOUNGE :)'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.be.ok;
      expect(obj.owner.id).to.be.a('string');

      delete obj.id;
      delete obj.owner.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should perform correctly on nested objects when using virtuals on both models and setting schema option for one model', function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toObject', { virtuals: true });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: 'I like lounge :)' });

      var obj = post.toObject();

      var expected = {
        owner: {
          firstName: 'Joe',
          lastName: 'Smith',
          password: 'password',
          fullName: 'Joe Smith'
        },
        content: 'I like lounge :)'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.be.ok;
      expect(obj.owner.id).to.be.a('string');

      delete obj.id;
      delete obj.owner.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should perform correctly on nested objects when using virtuals on both models and setting schema option for one and false for other', function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String })

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toObject', { virtuals: true });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });
      postSchema.set('toObject', { virtuals: false });
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: 'I like lounge :)' });

      var obj = post.toObject();

      var expected = {
        owner: {
          firstName: 'Joe',
          lastName: 'Smith',
          password: 'password',
          fullName: 'Joe Smith'
        },
        content: 'I like lounge :)'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.be.ok;
      expect(obj.owner.id).to.be.a('string');

      delete obj.id;
      delete obj.owner.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should perform correctly on nested objects when using virtuals on both models and setting schema option for one and false for other', function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toObject', { virtuals: false });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });
      postSchema.set('toObject', { virtuals: true });
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: 'I like lounge :)' });

      var obj = post.toObject();

      var expected = {
        owner: {
          firstName: 'Joe',
          lastName: 'Smith',
          password: 'password'
        },
        content: 'I like lounge :)',
        capContent: 'I LIKE LOUNGE :)'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.be.ok;
      expect(obj.owner.id).to.be.a('string');

      delete obj.id;
      delete obj.owner.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should print id correctly when no options specified', function () {
      var siteSchema = new lounge.Schema({
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
    });

    it('Should print id correctly when using id and generate options specified', function () {
      var siteSchema = new lounge.Schema({
        id: { type: String, key: true, generate: true },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
    });

    it('Should print id correctly when key option specified', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('123.123.123');
    });

    it('Should print id correctly when key option specified and prefix. should not print prefix by default.', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('123.123.123');
    });

    it('Should print id correctly when key option specified and suffix. should not print suffix by default.', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('123.123.123');
    });

    it('Should print id correctly when key option specified with prefix and suffix. should not print prefix and suffix by default.', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:', suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('123.123.123');
    });

    it('Should print id fully key option specified with prefix and expand options.', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      siteSchema.set('toObject', { expandDocumentKey: true });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('site:123.123.123');
    });

    it('Should print id fully key option specified with prefix and expand option inline.', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject({ expandDocumentKey: true });

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('site:123.123.123');
    });

    it('Should print id fully when expand inline specified and false in schema', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      siteSchema.set('toObject', { expandDocumentKey: false });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject({ expandDocumentKey: true });

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('site:123.123.123');
    });

    it('Should print id correctly when suffix specified and no options', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('123.123.123');
    });

    it('Should print id correctly when suffix specified and expand option in schema', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      siteSchema.set('toObject', { expandDocumentKey: true });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('123.123.123:site');
    });

    it('Should print id correctly when suffix specified and expand option inline', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject({ expandDocumentKey: true });

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('123.123.123:site');
    });

    it('Should print id correctly when prefix and suffix specified and expand option in schema', function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:', suffix: ':site' },
        name: String,
        url: String
      });

      siteSchema.set('toObject', { expandDocumentKey: true });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject();

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('site:123.123.123:site');
    });

    it('Should print id correctly when prefix and suffix specified and expand option inline', function () {
      var siteSchema = lounge.schema({
        ip: { type: String, key: true, prefix: 'site:', suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toObject({ expandDocumentKey: true });

      expect(obj.id).to.not.be.ok;
      expect(obj.ip).to.equal('site:123.123.123:site');
    });

    it('Should print id correctly for nested documents and one has key specified.', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true },
        firstName: String,
        lastName: String
      });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ owner: user, content: 'Lorem ipsum' });

      var obj = post.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.not.be.ok;

      var expected = {
        owner: {
          email: 'joe@gmail.com',
          firstName: 'Joe',
          lastName: 'Smith'
        },
        content: 'Lorem ipsum'
      };

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should print id correctly for nested documents and one has key specified with prefix option.', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user' },
        firstName: String,
        lastName: String
      });

      var User = lounge.model('User', userSchema);
      var postSchema = lounge.schema({ owner: User, content: String });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ owner: user, content: 'Lorem ipsum' });

      var obj = post.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.not.be.ok;

      var expected = {
        owner: {
          email: 'joe@gmail.com',
          firstName: 'Joe',
          lastName: 'Smith'
        },
        content: 'Lorem ipsum'
      };

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should print id correctly for nested documents and one has key specified with prefix option and expand.', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user:' },
        firstName: String,
        lastName: String
      });

      userSchema.set('toObject', { expandDocumentKey: true });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({ owner: User, content: String });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ owner: user, content: 'Lorem ipsum' });

      var obj = post.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.not.be.ok;

      var expected = {
        owner: {
          email: 'user:joe@gmail.com',
          firstName: 'Joe',
          lastName: 'Smith'
        },
        content: 'Lorem ipsum'
      };

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it('Should print id correctly for nested documents and with different key and expand options', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user:' },
        firstName: String,
        lastName: String
      });

      userSchema.set('toObject', { expandDocumentKey: true });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({
        id: { type: String, key: true },
        owner: User,
        content: String
      });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.not.be.ok;

      var expected = {
        id: '1234',
        owner: {
          email: 'user:joe@gmail.com',
          firstName: 'Joe',
          lastName: 'Smith'
        },
        content: 'Lorem ipsum'
      };

      expect(obj).to.deep.equal(expected);
    });

    it('Should print id correctly for nested documents and with different key and expand options', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user:' },
        firstName: String,
        lastName: String
      });

      userSchema.set('toObject', { expandDocumentKey: true });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({
        id: { type: String, key: true, suffix: ':post' },
        owner: User,
        content: String
      });
      postSchema.set('toObject', { expandDocumentKey: false });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.not.be.ok;

      var expected = {
        id: '1234',
        owner: {
          email: 'user:joe@gmail.com',
          firstName: 'Joe',
          lastName: 'Smith'
        },
        content: 'Lorem ipsum'
      };

      expect(obj).to.deep.equal(expected);
    });

    it('Should print id correctly for nested documents and with different key and expand options', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user:' },
        firstName: String,
        lastName: String
      });

      userSchema.set('toObject', { expandDocumentKey: false });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({
        id: { type: String, key: true, suffix: ':post' },
        owner: User,
        content: String
      });
      postSchema.set('toObject', { expandDocumentKey: true });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toObject();

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.not.be.ok;

      var expected = {
        id: '1234:post',
        owner: {
          email: 'joe@gmail.com',
          firstName: 'Joe',
          lastName: 'Smith'
        },
        content: 'Lorem ipsum'
      };

      expect(obj).to.deep.equal(expected);
    });

    it('Should print id correctly for nested documents and with schema and inline expand options. inline wins.', function () {
      var userSchema = lounge.schema({
        email: { type: String, key: true, prefix: 'user:' },
        firstName: String,
        lastName: String
      });

      userSchema.set('toObject', { expandDocumentKey: false });

      var User = lounge.model('User', userSchema);

      var postSchema = lounge.schema({
        id: { type: String, key: true, suffix: ':post' },
        owner: User,
        content: String
      });
      postSchema.set('toObject', { expandDocumentKey: false });
      var Post = lounge.model('Post', postSchema);

      var user = new User({ email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({ id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toObject({ expandDocumentKey: true });

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');
      expect(obj.owner).to.be.ok;
      expect(obj.owner).to.be.an('object');
      expect(obj.owner.id).to.not.be.ok;

      var expected = {
        id: '1234:post',
        owner: {
          email: 'user:joe@gmail.com',
          firstName: 'Joe',
          lastName: 'Smith'
        },
        content: 'Lorem ipsum'
      };

      expect(obj).to.deep.equal(expected);
    });
  });

  it('should not return empty properties by default', function () {
    var userSchema = lounge.schema({
      name: String,
      email: String,
      arrProp: [String],
      nickname: { type: String }
    });

    var User = lounge.model('User', userSchema);
    var user = new User({ name: 'Joe', email: 'joe@gmail.com', arrProp: [] });
    var obj = user.toObject();

    var expected = {
      name: 'Joe',
      email: 'joe@gmail.com'
    };

    expect(obj.id).to.be.ok;
    expect(obj.id).to.be.a('string');
    delete obj.id;
    expect(obj).to.deep.equal(expected);
  });

  it('should return empty properties if minimize set to false in options', function () {
    var userSchema = lounge.schema({
      name: String,
      email: String,
      arrProp: [String],
      nickname: { type: String }
    });

    var User = lounge.model('User', userSchema);
    var user = new User({ name: 'Joe', email: 'joe@gmail.com', nickname: '', arrProp: [] });
    var obj = user.toObject({ minimize: false });

    var expected = {
      name: 'Joe',
      email: 'joe@gmail.com',
      nickname: '',
      arrProp: []
    };

    expect(obj.id).to.be.ok;
    expect(obj.id).to.be.a('string');
    delete obj.id;
    expect(obj).to.deep.equal(expected);
  });

  it('should return empty properties if minimize set to false in schema options', function () {
    var userSchema = lounge.schema({
      name: String,
      email: String,
      arrProp: [String],
      nickname: { type: String }
    });

    userSchema.set('toObject', { minimize: false });

    var User = lounge.model('User', userSchema);
    var user = new User({ name: 'Joe', email: 'joe@gmail.com', nickname: '', arrProp: [] });
    var obj = user.toObject();

    var expected = {
      name: 'Joe',
      email: 'joe@gmail.com',
      nickname: '',
      arrProp: []
    };

    expect(obj.id).to.be.ok;
    expect(obj.id).to.be.a('string');
    delete obj.id;
    expect(obj).to.deep.equal(expected);
  });
});
