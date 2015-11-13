var expect = require('chai').expect;
var lounge = require('../lib');
var Schema = lounge.Schema;

describe('Schema basics', function () {
  beforeEach(function () {
    lounge = new lounge.Lounge(); // recreate it
  });

  describe("Schema basics", function () {
    describe("Should only accept a plain object or undefined as an argument", function () {
      it("Should accept a 'undefined'", function () {
        expect(function () {
          new Schema(undefined);
        }).to.not.throw(TypeError);
      });

      it("Should not accept a 'null'", function () {
        expect(function () {
          new Schema(null);
        }).to.throw(TypeError);
      });

      it("Should not accept a 'number'", function () {
        expect(function () {
          new Schema(1);
        }).to.throw(TypeError);
      });

      it("Should not accept a 'boolean'", function () {
        expect(function () {
          new Schema(true);
        }).to.throw(TypeError);
      });

      it("Should not accept a 'function'", function () {
        expect(function () {
          new Schema(function () {
          });
        }).to.throw(TypeError);
      });

      it("Should not accept a 'date'", function () {
        expect(function () {
          new Schema(new Date);
        }).to.throw(TypeError);
      });

      it("Should not accept a constructed object", function () {
        var Thing = function Thing(arg) {
        }, thing = new (Thing);

        expect(function () {
          new Schema(thing);
        }).to.throw(TypeError);
      });

      it("Should accept a plain object", function () {
        try {
          var sh = new Schema({property: String});
        }
        catch (e) {
          console.log(e.stack);
        }
        expect(function () {
          new Schema({property: String});
        }).to.not.throw(TypeError);
      });

      it("Should throw with key type not a Number or String", function () {
        expect(
          function () {
            var siteSchema = new lounge.Schema({
              ip: {type: Boolean, key: true},
              name: String,
              url: String
            });
          }).to.throw(TypeError);
      });
    });

    describe('add', function () {
      it("Should accept a key and a descriptor object", function () {
        schema = new Schema();
        schema.add('name', String);
        schema.add('age', {type: Number});
        expect(schema.tree.name.Constructor).to.equal(String);
        expect(schema.tree.age.Constructor).to.equal(Number);
      });
    });

    describe('refs', function () {
      it('should get the refs correctly', function () {

        var siteSchema = new lounge.Schema({
          owner: {type: String, ref: 'User'},
          url: String
        });

        var expected = {
          'owner': {
            path: 'owner',
            ref: 'User'
          }
        };

        expect(siteSchema.refs).to.deep.equal(expected, 'Refs are incorrect');
      });

      it('should get the refs correctly if in array', function () {
        var userSchema = new lounge.Schema({
          firstName: String,
          lastName: String,
          posts: [
            {type: String, ref: 'Post'}
          ]
        });

        var expected = {
          posts: {
            path: 'posts',
            ref: 'Post'
          }
        };

        expect(userSchema.refs).to.deep.equal(expected, 'Refs are incorrect');
      });

      it('should get the refs correctly in nested schema', function () {
        var userSchema = new lounge.Schema({
          firstName: String,
          lastName: String,
          blog: {
            posts: [
              {Type: String, ref: 'Post'}
            ]
          }
        });

        var expected = {
          'blog.posts': {
            path: 'blog.posts',
            ref: 'Post'
          }
        };

        expect(userSchema.refs).to.deep.equal(expected, 'Refs are incorrect');
      });

      it('should get the refs correctly with multiple refs', function () {
        var userSchema = new lounge.Schema({
          firstName: String,
          lastName: String,
          blog: {
            posts: [
              {Type: String, ref: 'Post'}
            ]
          },
          address: {Type: String, ref: 'Address'}
        });

        var expected = {
          'blog.posts': {
            path: 'blog.posts',
            ref: 'Post'
          },
          'address': {
            path: 'address',
            ref: 'Address'
          }
        };

        expect(userSchema.refs).to.deep.equal(expected, 'Refs are incorrect');
      });
    });
  });
});
