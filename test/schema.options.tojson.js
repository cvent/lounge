var lounge = require('../lib/');
var expect = require('chai').expect;
var assert = require('assert');

describe("Schema options", function () {

  beforeEach(function () {
    lounge = new lounge.Lounge(); // recreate it
  });

  describe("toJSON", function () {

    it("Should just work without any options", function () {
      var userSchema = lounge.schema({ name: String, email: String });

      var User = lounge.model('User', userSchema);

      var user = new User({ name: 'Joe', email: 'joe@gmail.com' });

      var obj = user.toJSON();

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it("Should transform if given the option", function () {
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

      var obj = user.toJSON({transform: xform});

      var expected = {
        name: 'Joe',
        email: 'joe@gmail.com'
      };

      expect(obj.id).to.be.ok;
      expect(obj.id).to.be.a('string');

      delete obj.id;

      expect(obj).to.deep.equal(expected);
    });

    it("Should transform if given the option only the specific object", function () {
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

      var obj1 = user.toJSON({transform: xform});
      var obj2 = user2.toJSON();

      assert.equal(obj1.name, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj1.email, 'joe@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj1.password, undefined, 'Failed to properly transform toJSON(). Did not delete hidden property.');

      assert.equal(obj2.name, 'Bob', 'Failed to properly transform toJSON()');
      assert.equal(obj2.email, 'bob@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj2.password, 'password2', 'Failed to properly transform toJSON(). Deleted property when it should not have.');
    });

    it("Should transform if given the option at schema level", function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: String
      });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toJSON', {transform: xform});

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var obj = user.toJSON();

      assert.equal(obj.name, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.email, 'joe@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj.password, undefined, 'Failed to properly transform toJSON(). Did not delete hidden property.');
    });

    it("Should not effect toObject if having a transform at schema level", function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: String
      });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toJSON', {transform: xform});

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var obj = user.toObject();

      assert.equal(obj.name, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.email, 'joe@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj.password, 'password', 'Failed to properly transform toJSON().  Deleted property when it should not have.');
    });

    it("Should perform transform correctly on nested objects", function () {
      var userSchema = lounge.schema({ name: String, email: String, password: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toJSON', {transform: xform});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'password' })
        , post = new Post({ owner: user, content: "I like lounge :)"});

      var obj = post.toJSON();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toJSON()');
      assert.ok(obj.owner, 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.name, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.password, undefined, 'Failed to properly transform toJSON(). Did not delete hidden property.');
    });

    it.skip("Should perform transform correctly on nested objects when using inline tranform on one of them", function () {
      var userSchema = lounge.schema({ name: String, email: String, password: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      var userxform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toJSON', {transform: userxform});

      var postxform = function (doc, ret, options) {
        ret.content = doc.content.toUpperCase();
        return ret;
      };

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'password' })
        , post = new Post({ owner: user, content: "I like lounge :)"});

      var obj = post.toJSON({transform: postxform});

      assert.equal(obj.content, 'I LIKE LOUNGE :)', 'Failed to properly transform toJSON()');
      assert.ok(obj.owner, 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.name, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.password, undefined, 'Failed to properly transform toJSON(). Did not delete hidden property.');
    });

    it("Should perform transform correctly on nested objects when using schema tranform on both of them", function () {
      var userSchema = lounge.schema({ name: String, email: String, password: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      var userxform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toJSON', {transform: userxform});

      var postxform = function (doc, ret, options) {
        ret.content = doc.content.toUpperCase();
        return ret;
      };

      postSchema.set('toJSON', {transform: postxform});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({ name: 'Joe', email: 'joe@gmail.com', password: 'password' })
        , post = new Post({ owner: user, content: "I like lounge :)"});

      var obj = post.toJSON();

      assert.equal(obj.content, 'I LIKE LOUNGE :)', 'Failed to properly transform toJSON()');
      assert.ok(obj.owner, 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.name, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.password, undefined, 'Failed to properly transform toJSON(). Did not delete hidden property.');
    });

    it("Should not get virtuals if not given the option", function () {
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

      var obj = user.toJSON();

      assert.equal(obj.firstName, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.lastName, 'Smith', 'Failed to properly transform toJSON()');
      assert.equal(obj.fullName, undefined, 'Failed to properly transform toJSON(). Got virtual property.');
    });

    it("Should get virtuals if given the option at schema level", function () {
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

      userSchema.set('toJSON', {virtuals: true});

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var obj = user.toJSON();

      assert.equal(obj.firstName, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.lastName, 'Smith', 'Failed to properly transform toJSON()');
      assert.equal(obj.fullName, 'Joe Smith', 'Failed to properly transform toJSON(). Did not get virtual property.');
    });

    it("Should get virtuals if given the option at inline level", function () {
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

      var obj = user.toJSON({virtuals: true});

      assert.equal(obj.firstName, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.lastName, 'Smith', 'Failed to properly transform toJSON()');
      assert.equal(obj.fullName, 'Joe Smith', 'Failed to properly transform toJSON(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models inline option", function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });


      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: "I like lounge :)"});

      var obj = post.toJSON({virtuals: true});

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toJSON()');
      assert.equal(obj.capContent, 'I LIKE LOUNGE :)', 'Failed to properly transform toJSON()');
      assert.ok(obj.owner, 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.fullName, 'Joe Smith', 'Failed to properly transform toJSON(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models and setting schema option for one model", function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toJSON', {virtuals: true});

      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: "I like lounge :)"});

      var obj = post.toJSON();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toJSON()');
      assert.equal(obj.capContent, undefined, 'Failed to properly transform toJSON()');
      assert.ok(obj.owner, 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.fullName, 'Joe Smith', 'Failed to properly transform toJSON(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models and setting schema option for one and false for other", function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toJSON', {virtuals: true});

      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });

      postSchema.set('toJSON', {virtuals: false});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: "I like lounge :)"});

      var obj = post.toJSON();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toJSON()');
      assert.equal(obj.capContent, undefined, 'Failed to properly transform toJSON()');
      assert.ok(obj.owner, 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.fullName, 'Joe Smith', 'Failed to properly transform toJSON(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models and setting schema option for one and false for other", function () {
      var userSchema = lounge.schema({ firstName: String, lastName: String, password: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toJSON', {virtuals: false});

      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });

      postSchema.set('toJSON', {virtuals: true});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({ owner: user, content: "I like lounge :)"});

      var obj = post.toJSON();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toJSON()');
      assert.equal(obj.capContent, 'I LIKE LOUNGE :)', 'Failed to properly transform toJSON()');
      assert.ok(obj.owner, 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toJSON()');
      assert.equal(obj.owner.fullName, undefined, 'Failed to properly transform toJSON(). Did not get virtual property.');
    });

    it("Should print id correctly when no options specified", function () {
      var siteSchema = new lounge.Schema({
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.ok(obj.id, 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when using id and generate options specified", function () {
      var siteSchema = new lounge.Schema({
        id: { type: String, generate: true },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.ok(obj.id, 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when key option specified", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when key option specified and prefix. should not print prefix by default.", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when key option specified and suffix. should not print suffix by default.", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when key option specified with prefix and suffix. should not print prefix and suffix by default.", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:', suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id fully key option specified with prefix and expand options.", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      siteSchema.set('toJSON', {expandDocumentKey: true});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, 'site:123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id fully key option specified with prefix and expand option inline.", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, 'site:123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id fully when expand inline specified and false in schema", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:' },
        name: String,
        url: String
      });

      siteSchema.set('toJSON', {expandDocumentKey: false});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, 'site:123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when suffix specified and no options", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when suffix specified and expand option in schema", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      siteSchema.set('toJSON', {expandDocumentKey: true});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, '123.123.123:site', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when suffix specified and expand option inline", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, '123.123.123:site', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when prefix and suffix specified and expand option in schema", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:', suffix: ':site' },
        name: String,
        url: String
      });

      siteSchema.set('toJSON', {expandDocumentKey: true});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, 'site:123.123.123:site', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly when prefix and suffix specified and expand option inline", function () {
      var siteSchema = new lounge.Schema({
        ip: { type: String, key: true, prefix: 'site:', suffix: ':site' },
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com' });

      var obj = site.toJSON({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.ip, 'site:123.123.123:site', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly for nested documents and one has key specified.", function () {
      var userSchema = lounge.schema({ email: { type: String, key: true },
          firstName: String, lastName: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({owner: user, content: 'Lorem ipsum' });

      var obj = post.toJSON();

      assert.ok(obj.id, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly for nested documents and one has key specified with prefix option.", function () {
      var userSchema = lounge.schema({ email: { type: String, key: true, prefix: 'user' },
          firstName: String, lastName: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({owner: user, content: 'Lorem ipsum' });

      var obj = post.toJSON();

      assert.ok(obj.id, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly for nested documents and one has key specified with prefix option and expand.", function () {
      var userSchema = lounge.schema({ email: { type: String, key: true, prefix: 'user:' },
          firstName: String, lastName: String })
        , postSchema = lounge.schema({ owner: Object, content: String });

      userSchema.set('toJSON', { expandDocumentKey: true });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({owner: user, content: 'Lorem ipsum' });

      var obj = post.toJSON();

      assert.ok(obj.id, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly for nested documents and with different key and expand options", function () {
      var userSchema = lounge.schema({ email: { type: String, key: true, prefix: 'user:' },
          firstName: String, lastName: String })
        , postSchema = lounge.schema({ id: { type: String, key: true },
          owner: Object, content: String });

      userSchema.set('toJSON', { expandDocumentKey: true });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toJSON();

      assert.equal(obj.id, '1234', 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly for nested documents and with different key and expand options", function () {
      var userSchema = lounge.schema({ email: { type: String, key: true, prefix: 'user:' },
          firstName: String, lastName: String })
        , postSchema = lounge.schema({ id: { type: String, key: true, suffix: ':post' },
          owner: Object, content: String });

      userSchema.set('toJSON', { expandDocumentKey: true });

      postSchema.set('toJSON', { expandDocumentKey: false });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toJSON();

      assert.equal(obj.id, '1234', 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly for nested documents and with different key and expand options", function () {
      var userSchema = lounge.schema({ email: { type: String, key: true, prefix: 'user:' },
          firstName: String, lastName: String })
        , postSchema = lounge.schema({ id: { type: String, key: true, suffix: ':post' },
          owner: Object, content: String });

      userSchema.set('toJSON', { expandDocumentKey: false });

      postSchema.set('toJSON', { expandDocumentKey: true });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toJSON();

      assert.equal(obj.id, '1234:post', 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to print id properly in toJSON()');
    });

    it("Should print id correctly for nested documents and with schema and inline expand options. inline wins.", function () {
      var userSchema = lounge.schema({ email: { type: String, key: true, prefix: 'user:' },
          firstName: String, lastName: String })
        , postSchema = lounge.schema({ id: { type: String, key: true, suffix: ':post' },
          owner: Object, content: String });

      userSchema.set('toJSON', { expandDocumentKey: false });

      postSchema.set('toJSON', { expandDocumentKey: false });

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith' });
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum' });

      var obj = post.toJSON({ expandDocumentKey: true });

      assert.equal(obj.id, '1234:post', 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toJSON()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toJSON()');
    });
  });

});