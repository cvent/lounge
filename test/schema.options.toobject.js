describe("Schema options", function () {
  var lounge = require('../lib/')
    , assert = require('assert');

  beforeEach(function (done) {
    lounge = new lounge.Lounge(); // recreate it
    done();
  });

  describe("toObject", function () {

    it("Should just work without any options", function () {
      var userSchema = lounge.schema({name: String, email: String});

      var User = lounge.model('User', userSchema);

      var user = new User({name: 'Joe', email: 'joe@gmail.com'});

      var obj = user.toObject();

      assert.equal(obj.name, 'Joe');
      assert.equal(obj.email, 'joe@gmail.com');
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

      var obj = user.toObject({transform: xform});

      assert.equal(obj.name, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.email, 'joe@gmail.com', 'Failed to properly transform toObject()');
      assert.equal(obj.password, undefined, 'Failed to properly transform toObject(). Did not delete hidden property.');
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

      var obj1 = user.toObject({transform: xform});
      var obj2 = user2.toObject();

      assert.equal(obj1.name, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj1.email, 'joe@gmail.com', 'Failed to properly transform toObject()');
      assert.equal(obj1.password, undefined, 'Failed to properly transform toObject(). Did not delete hidden property.');

      assert.equal(obj2.name, 'Bob', 'Failed to properly transform toObject()');
      assert.equal(obj2.email, 'bob@gmail.com', 'Failed to properly transform toObject()');
      assert.equal(obj2.password, 'password2', 'Failed to properly transform toObject(). Deleted property when it should not have.');
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

      userSchema.set('toObject', {transform: xform});

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var obj = user.toObject();

      assert.equal(obj.name, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.email, 'joe@gmail.com', 'Failed to properly transform toObject()');
      assert.equal(obj.password, undefined, 'Failed to properly transform toObject(). Did not delete hidden property.');
    });

    it("Should not effect toJSON if having a transform at schema level", function () {
      var userSchema = lounge.schema({
        name: String,
        email: String,
        password: String
      });

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', {transform: xform});

      var User = lounge.model('User', userSchema);

      var user = new User({
        name: 'Joe',
        email: 'joe@gmail.com',
        password: 'password'
      });

      var obj = user.toJSON();

      assert.equal(obj.name, 'Joe', 'Failed to properly transform toJSON()');
      assert.equal(obj.email, 'joe@gmail.com', 'Failed to properly transform toJSON()');
      assert.equal(obj.password, 'password', 'Failed to properly transform toJSON().  Deleted property when it should not have.');
    });

    it("Should perform transform correctly on nested objects", function () {
      var userSchema = lounge.schema({name: String, email: String, password: String})
        , postSchema = lounge.schema({owner: Object, content: String});

      var xform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', {transform: xform});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({name: 'Joe', email: 'joe@gmail.com', password: 'password'})
        , post = new Post({owner: user, content: "I like lounge :)"});

      var obj = post.toObject();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toObject()');
      assert.ok(obj.owner, 'Failed to properly transform toObject()');
      assert.equal(obj.owner.name, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.password, undefined, 'Failed to properly transform toObject(). Did not delete hidden property.');
    });

    it.skip("Should perform transform correctly on nested objects when using inline tranform on one of them", function () {
      var userSchema = lounge.schema({name: String, email: String, password: String})
        , postSchema = lounge.schema({owner: Object, content: String});

      var userxform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', {transform: userxform});

      var postxform = function (doc, ret, options) {
        ret.content = doc.content.toUpperCase();
        return ret;
      };

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({name: 'Joe', email: 'joe@gmail.com', password: 'password'})
        , post = new Post({owner: user, content: "I like lounge :)"});

      var obj = post.toObject({transform: postxform});

      assert.equal(obj.content, 'I LIKE LOUNGE :)', 'Failed to properly transform toObject()');
      assert.ok(obj.owner, 'Failed to properly transform toObject()');
      assert.equal(obj.owner.name, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.password, undefined, 'Failed to properly transform toObject(). Did not delete hidden property.');
    });

    it("Should perform transform correctly on nested objects when using schema tranform on both of them", function () {
      var userSchema = lounge.schema({name: String, email: String, password: String})
        , postSchema = lounge.schema({owner: Object, content: String});

      var userxform = function (doc, ret, options) {
        delete ret.password;
        return ret;
      };

      userSchema.set('toObject', {transform: userxform});

      var postxform = function (doc, ret, options) {
        ret.content = doc.content.toUpperCase();
        return ret;
      };

      postSchema.set('toObject', {transform: postxform});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({name: 'Joe', email: 'joe@gmail.com', password: 'password'})
        , post = new Post({owner: user, content: "I like lounge :)"});

      var obj = post.toObject();

      assert.equal(obj.content, 'I LIKE LOUNGE :)', 'Failed to properly transform toObject()');
      assert.ok(obj.owner, 'Failed to properly transform toObject()');
      assert.equal(obj.owner.name, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.password, undefined, 'Failed to properly transform toObject(). Did not delete hidden property.');
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

      var obj = user.toObject();

      assert.equal(obj.firstName, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.lastName, 'Smith', 'Failed to properly transform toObject()');
      assert.equal(obj.fullName, undefined, 'Failed to properly transform toObject(). Got virtual property.');
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

      userSchema.set('toObject', {virtuals: true});

      var User = lounge.model('User', userSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var obj = user.toObject();

      assert.equal(obj.firstName, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.lastName, 'Smith', 'Failed to properly transform toObject()');
      assert.equal(obj.fullName, 'Joe Smith', 'Failed to properly transform toObject(). Did not get virtual property.');
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

      var obj = user.toObject({virtuals: true});

      assert.equal(obj.firstName, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.lastName, 'Smith', 'Failed to properly transform toObject()');
      assert.equal(obj.fullName, 'Joe Smith', 'Failed to properly transform toObject(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models inline option", function () {
      var userSchema = lounge.schema({firstName: String, lastName: String, password: String})
        , postSchema = lounge.schema({owner: Object, content: String});

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

      var post = new Post({owner: user, content: "I like lounge :)"});

      var obj = post.toObject({virtuals: true});

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toObject()');
      assert.equal(obj.capContent, 'I LIKE LOUNGE :)', 'Failed to properly transform toObject()');
      assert.ok(obj.owner, 'Failed to properly transform toObject()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.fullName, 'Joe Smith', 'Failed to properly transform toObject(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models and setting schema option for one model", function () {
      var userSchema = lounge.schema({firstName: String, lastName: String, password: String})
        , postSchema = lounge.schema({owner: Object, content: String});

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toObject', {virtuals: true});

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

      var post = new Post({owner: user, content: "I like lounge :)"});

      var obj = post.toObject();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toObject()');
      assert.equal(obj.capContent, undefined, 'Failed to properly transform toObject()');
      assert.ok(obj.owner, 'Failed to properly transform toObject()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.fullName, 'Joe Smith', 'Failed to properly transform toObject(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models and setting schema option for one and false for other", function () {
      var userSchema = lounge.schema({firstName: String, lastName: String, password: String})
        , postSchema = lounge.schema({owner: Object, content: String});

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toObject', {virtuals: true});

      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });

      postSchema.set('toObject', {virtuals: false});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({owner: user, content: "I like lounge :)"});

      var obj = post.toObject();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toObject()');
      assert.equal(obj.capContent, undefined, 'Failed to properly transform toObject()');
      assert.ok(obj.owner, 'Failed to properly transform toObject()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.fullName, 'Joe Smith', 'Failed to properly transform toObject(). Did not get virtual property.');
    });

    it("Should perform correctly on nested objects when using virtuals on both models and setting schema option for one and false for other", function () {
      var userSchema = lounge.schema({firstName: String, lastName: String, password: String})
        , postSchema = lounge.schema({owner: Object, content: String});

      userSchema.virtual('fullName', {
        get: function () {
          return this.firstName + ' ' + this.lastName;
        }
      });

      userSchema.set('toObject', {virtuals: false});

      postSchema.virtual('capContent', {
        get: function () {
          return this.content.toUpperCase();
        }
      });

      postSchema.set('toObject', {virtuals: true});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({
        firstName: 'Joe',
        lastName: 'Smith',
        password: 'password'
      });

      var post = new Post({owner: user, content: "I like lounge :)"});

      var obj = post.toObject();

      assert.equal(obj.content, 'I like lounge :)', 'Failed to properly transform toObject()');
      assert.equal(obj.capContent, 'I LIKE LOUNGE :)', 'Failed to properly transform toObject()');
      assert.ok(obj.owner, 'Failed to properly transform toObject()');
      assert.equal(obj.owner.firstName, 'Joe', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.lastName, 'Smith', 'Failed to properly transform toObject()');
      assert.equal(obj.owner.fullName, undefined, 'Failed to properly transform toObject(). Did not get virtual property.');
    });

    it("Should print id correctly when no options specified", function () {
      var siteSchema = new lounge.Schema({
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.ok(obj.id, 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when using id and generate options specified", function () {
      var siteSchema = new lounge.Schema({
        id: {type: String, generate: true},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.ok(obj.id, 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when key option specified", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when key option specified and prefix. should not print prefix by default.", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, prefix: 'site:'},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when key option specified and suffix. should not print suffix by default.", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, suffix: ':site'},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when key option specified with prefix and suffix. should not print prefix and suffix by default.", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, prefix: 'site:', suffix: ':site'},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id fully key option specified with prefix and expand options.", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, prefix: 'site:'},
        name: String,
        url: String
      });

      siteSchema.set('toObject', {expandDocumentKey: true});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, 'site:123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id fully key option specified with prefix and expand option inline.", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, prefix: 'site:'},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, 'site:123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id fully when expand inline specified and false in schema", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, prefix: 'site:'},
        name: String,
        url: String
      });

      siteSchema.set('toObject', {expandDocumentKey: false});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, 'site:123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when suffix specified and no options", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, suffix: ':site'},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, '123.123.123', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when suffix specified and expand option in schema", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, suffix: ':site'},
        name: String,
        url: String
      });

      siteSchema.set('toObject', {expandDocumentKey: true});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, '123.123.123:site', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when suffix specified and expand option inline", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, suffix: ':site'},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, '123.123.123:site', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when prefix and suffix specified and expand option in schema", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, prefix: 'site:', suffix: ':site'},
        name: String,
        url: String
      });

      siteSchema.set('toObject', {expandDocumentKey: true});

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject();

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, 'site:123.123.123:site', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly when prefix and suffix specified and expand option inline", function () {
      var siteSchema = new lounge.Schema({
        ip: {type: String, key: true, prefix: 'site:', suffix: ':site'},
        name: String,
        url: String
      });

      var Site = lounge.model('Site', siteSchema);

      var site = new Site({ip: '123.123.123', name: 'google', url: 'http://www.google.com'});

      var obj = site.toObject({expandDocumentKey: true});

      assert.equal(obj.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.ip, 'site:123.123.123:site', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly for nested documents and one has key specified.", function () {
      var userSchema = lounge.schema({
          email: {type: String, key: true},
          firstName: String, lastName: String
        })
        , postSchema = lounge.schema({owner: Object, content: String});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith'});
      var post = new Post({owner: user, content: 'Lorem ipsum'});

      var obj = post.toObject();

      assert.ok(obj.id, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly for nested documents and one has key specified with prefix option.", function () {
      var userSchema = lounge.schema({
          email: {type: String, key: true, prefix: 'user'},
          firstName: String, lastName: String
        })
        , postSchema = lounge.schema({owner: Object, content: String});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith'});
      var post = new Post({owner: user, content: 'Lorem ipsum'});

      var obj = post.toObject();

      assert.ok(obj.id, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly for nested documents and one has key specified with prefix option and expand.", function () {
      var userSchema = lounge.schema({
          email: {type: String, key: true, prefix: 'user:'},
          firstName: String, lastName: String
        })
        , postSchema = lounge.schema({owner: Object, content: String});

      userSchema.set('toObject', {expandDocumentKey: true});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith'});
      var post = new Post({owner: user, content: 'Lorem ipsum'});

      var obj = post.toObject();

      assert.ok(obj.id, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly for nested documents and with different key and expand options", function () {
      var userSchema = lounge.schema({
          email: {type: String, key: true, prefix: 'user:'},
          firstName: String, lastName: String
        })
        , postSchema = lounge.schema({
          id: {type: String, key: true},
          owner: Object, content: String
        });

      userSchema.set('toObject', {expandDocumentKey: true});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith'});
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum'});

      var obj = post.toObject();

      assert.equal(obj.id, '1234', 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly for nested documents and with different key and expand options", function () {
      var userSchema = lounge.schema({
          email: {type: String, key: true, prefix: 'user:'},
          firstName: String, lastName: String
        })
        , postSchema = lounge.schema({
          id: {type: String, key: true, suffix: ':post'},
          owner: Object, content: String
        });

      userSchema.set('toObject', {expandDocumentKey: true});

      postSchema.set('toObject', {expandDocumentKey: false});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith'});
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum'});

      var obj = post.toObject();

      assert.equal(obj.id, '1234', 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly for nested documents and with different key and expand options", function () {
      var userSchema = lounge.schema({
          email: {type: String, key: true, prefix: 'user:'},
          firstName: String, lastName: String
        })
        , postSchema = lounge.schema({
          id: {type: String, key: true, suffix: ':post'},
          owner: Object, content: String
        });

      userSchema.set('toObject', {expandDocumentKey: false});

      postSchema.set('toObject', {expandDocumentKey: true});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith'});
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum'});

      var obj = post.toObject();

      assert.equal(obj.id, '1234:post', 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.email, 'joe@gmail.com', 'Failed to print id properly in toObject()');
    });

    it("Should print id correctly for nested documents and with schema and inline expand options. inline wins.", function () {
      var userSchema = lounge.schema({
          email: {type: String, key: true, prefix: 'user:'},
          firstName: String, lastName: String
        })
        , postSchema = lounge.schema({
          id: {type: String, key: true, suffix: ':post'},
          owner: Object, content: String
        });

      userSchema.set('toObject', {expandDocumentKey: false});

      postSchema.set('toObject', {expandDocumentKey: false});

      var User = lounge.model('User', userSchema);
      var Post = lounge.model('Post', postSchema);

      var user = new User({email: 'joe@gmail.com', firstName: 'Joe', lastName: 'Smith'});
      var post = new Post({id: '1234', owner: user, content: 'Lorem ipsum'});

      var obj = post.toObject({expandDocumentKey: true});

      assert.equal(obj.id, '1234:post', 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.id, undefined, 'Failed to print id properly in toObject()');
      assert.equal(obj.owner.email, 'user:joe@gmail.com', 'Failed to print id properly in toObject()');
    });
  });
});