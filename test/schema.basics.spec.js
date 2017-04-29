/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
var validator = require('validator')
var expect = require('chai').expect
var lounge = require('../')
var Schema = lounge.Schema

describe('Schema basics', function () {
  describe('Should only accept a plain object or undefined as an argument', function () {
    beforeEach(function () {
      lounge = new lounge.Lounge() // recreate it
    })

    it('Should accept a \'undefined\'', function () {
      expect(function () {
        new Schema(undefined)
      }).to.not.throw(TypeError)
    })

    it('Should accept a plain object', function () {
      try {
        var sh = new Schema({ property: String })
      } catch (e) {
        console.log(e.stack)
      }
      expect(function () {
        new Schema({ property: String })
      }).to.not.throw(TypeError)
    })

    it('Should throw with key type not a Number or String', function () {
      expect(
        function () {
          lounge.schema({
            ip: { type: Boolean, key: true },
            name: String,
            url: String
          })
        }).to.throw(TypeError)
    })
  })

  describe('refs', function () {
    beforeEach(function () {
      lounge = new lounge.Lounge() // recreate it
    })

    it('should not get any refs where there are none', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: String
      })

      var expected = {}

      expect(userSchema.refs).to.deep.equal(expected, 'Refs are incorrect')
    })

    it('should get the refs correctly', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: String
      })

      var User = lounge.model('User', userSchema)

      var siteSchema = lounge.schema({
        owner: { type: User },
        url: String
      })

      var expected = {
        'owner': {
          path: 'owner',
          ref: 'User'
        }
      }

      expect(siteSchema.refs).to.deep.equal(expected, 'Refs are incorrect')
    })

    it('should get the refs correctly when referencing Model directly', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: String
      })

      var User = lounge.model('User', userSchema)

      var siteSchema = lounge.schema({
        owner: User,
        url: String
      })

      var expected = {
        'owner': {
          path: 'owner',
          ref: 'User'
        }
      }

      expect(siteSchema.refs).to.deep.equal(expected, 'Refs are incorrect')
    })

    it('should get the refs correctly if in array', function () {
      var postSchema = lounge.schema({
        title: String,
        body: String
      })

      var Post = lounge.model('Post', postSchema)

      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        posts: [
          { type: Post }
        ]
      })

      var expected = {
        posts: {
          path: 'posts',
          ref: 'Post'
        }
      }

      expect(userSchema.refs).to.deep.equal(expected, 'Refs are incorrect')
    })

    it('should get the refs correctly in nested schema', function () {
      var postSchema = lounge.schema({
        title: String,
        body: String
      })

      var Post = lounge.model('Post', postSchema)

      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        blog: {
          posts: [Post]
        }
      })

      var expected = {
        'blog.posts': {
          path: 'blog.posts',
          ref: 'Post'
        }
      }

      expect(userSchema.refs).to.deep.equal(expected, 'Refs are incorrect')
    })

    it('should get the refs correctly with multiple refs', function () {
      var postSchema = lounge.schema({
        title: String,
        body: String
      })

      var Post = lounge.model('Post', postSchema)

      var addrSchema = lounge.schema({
        street: String,
        city: String,
        postalCode: String,
        country: String
      })

      var Address = lounge.model('Address', addrSchema)

      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        blog: {
          posts: [
            { Type: Post }
          ]
        },
        address: Address
      })

      var expected = {
        'blog.posts': {
          path: 'blog.posts',
          ref: 'Post'
        },
        'address': {
          path: 'address',
          ref: 'Address'
        }
      }

      expect(userSchema.refs).to.deep.equal(expected, 'Refs are incorrect')
    })

    it('should get the refs correctly in manual ref setup scenario', function () {
      var siteSchema = lounge.schema({
        owner: { type: lounge.Model, modelName: 'User' },
        url: String
      })

      var expected = {
        'owner': {
          path: 'owner',
          ref: 'User'
        }
      }

      expect(siteSchema.refs).to.deep.equal(expected, 'Refs are incorrect')
    })
  })

  describe('single index', function () {
    beforeEach(function () {
      lounge = new lounge.Lounge() // recreate it
    })

    it('should get the indexes correctly', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true }
      })

      var expected = {
        'email': {
          path: 'email',
          name: 'email',
          indexType: 'single'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly only when index = true', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: false }
      })

      var expected = {}

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly only when index = true 2', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: 'true' }
      })

      var expected = {}

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the index correctly if in array', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        posts: [
          { type: String, index: true }
        ]
      })

      var expected = {
        posts: {
          path: 'posts',
          name: 'post',
          indexType: 'single'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly in nested schema', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        blog: {
          posts: [
            { Type: String, index: true, indexName: 'blogPost' }
          ]
        }
      })

      var expected = {
        'blog.posts': {
          path: 'blog.posts',
          name: 'blogPost',
          indexType: 'single'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly with multiple indexes', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true },
        username: { type: String, index: true, indexName: 'userName' }
      })

      var expected = {
        'email': {
          path: 'email',
          name: 'email',
          indexType: 'single'
        },
        'username': {
          path: 'username',
          name: 'userName',
          indexType: 'single'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })
  })

  describe('array index', function () {
    beforeEach(function () {
      lounge = new lounge.Lounge() // recreate it
    })

    it('should get the indexes correctly', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true, indexType: 'array' }
      })

      var expected = {
        'email': {
          path: 'email',
          name: 'email',
          indexType: 'array'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly only when index = true', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: false, indexType: 'array' }
      })

      var expected = {}

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly only when index = true 2', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: 'true', indexType: 'array' }
      })

      var expected = {}

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the index correctly if in array', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        posts: [
          { type: String, index: true, indexType: 'array' }
        ]
      })

      var expected = {
        posts: {
          path: 'posts',
          name: 'post',
          indexType: 'array'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly in nested schema', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        blog: {
          posts: [
            { Type: String, index: true, indexName: 'blogPost', indexType: 'array' }
          ]
        }
      })

      var expected = {
        'blog.posts': {
          path: 'blog.posts',
          name: 'blogPost',
          indexType: 'array'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly with multiple indexes', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true, indexType: 'array' },
        username: { type: String, index: true, indexName: 'userName', indexType: 'array' }
      })

      var expected = {
        'email': {
          path: 'email',
          name: 'email',
          indexType: 'array'
        },
        'username': {
          path: 'username',
          name: 'userName',
          indexType: 'array'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })

    it('should get the indexes correctly with multiple indexes of mixed types', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, index: true, indexType: 'array' },
        username: { type: String, index: true, indexName: 'userName' }
      })

      var expected = {
        'email': {
          path: 'email',
          name: 'email',
          indexType: 'array'
        },
        'username': {
          path: 'username',
          name: 'userName',
          indexType: 'single'
        }
      }

      expect(userSchema.indexes).to.deep.equal(expected)
    })
  })

  describe('getDocumentKeyValue', function () {
    var userSchema, userSchema2, userSchema3
    var id1, id2, id3, val

    before(function () {
      lounge = new lounge.Lounge() // recreate it

      id1 = '1234'
      id2 = '12345'
      id3 = 'test@gmail.com'

      userSchema = new lounge.Schema({
        email: String
      })

      userSchema2 = new lounge.Schema({
        id: { type: String, key: true, generate: true, prefix: 'pre:', suffix: ':suf' },
        email: String
      })

      userSchema3 = new lounge.Schema({
        email: { type: String, key: true, generate: false, prefix: 'user::' }
      })
    })

    it('should get document key value without full', function () {
      var val = userSchema.getDocumentKeyValue(id1)
      expect(val).to.equal(id1)
    })

    it('should get document key value with full', function () {
      val = userSchema.getDocumentKeyValue(id1, true)
      expect(val).to.equal(id1)
    })

    it('should get document key value without full in schema with prefix and suffix', function () {
      val = userSchema2.getDocumentKeyValue(id2)
      expect(val).to.equal(id2)
    })

    it('should get document key value in full in schema with prefix and suffix', function () {
      val = userSchema2.getDocumentKeyValue(id2, true)
      expect(val).to.equal('pre:' + id2 + ':suf')
    })

    it('should get document key value in full in schema with prefix and suffix when passed in expanded value', function () {
      val = userSchema2.getDocumentKeyValue('pre:' + id2 + ':suf', true)
      expect(val).to.equal('pre:' + id2 + ':suf')
    })

    it('should get short document key value in schema with prefix and suffix when passed in expanded value', function () {
      val = userSchema2.getDocumentKeyValue('pre:' + id2 + ':suf')
      expect(val).to.equal(id2)
    })

    it('should get document key value without full in schema with assigned prefix', function () {
      // user schema 3
      val = userSchema3.getDocumentKeyValue(id3)
      expect(val).to.equal(id3)
    })

    it('should get document key value in full in schema with assigned prefix', function () {
      val = userSchema3.getDocumentKeyValue(id3, true)
      expect(val).to.equal('user::' + id3)
    })

    it('should get document key value in full in schema with assigned prefix when passed in expanded value', function () {
      val = userSchema3.getDocumentKeyValue('user::' + id3, true)
      expect(val).to.equal('user::' + id3)
    })

    it('should get document key value in full in schema with assigned prefix when passed in expanded value', function () {
      val = userSchema3.getDocumentKeyValue('user::' + id3)
      expect(val).to.equal(id3)
    })
  })

  describe('init()', function () {
    beforeEach(function () {
      lounge = new lounge.Lounge() // recreate it
    })

    it('should call init function after if defined as a method as part of construction', function () {
      var userSchema = lounge.schema({
        firstName: String,
        lastName: String,
        email: String,
        $_data: { type: Object, invisible: true }
      })

      userSchema.method('init', function () {
        if (!this.$_data) {
          this.$_data = {}
        }
        this.$_data.initialEmail = this.email
      })

      var User = lounge.model('User', userSchema)

      var user = new User({
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bsmith@gmail.com'
      })

      expect(user.init).to.be.ok
      expect(user.init).to.be.instanceof(Function)
      expect(user.$_data).to.be.ok
      expect(user.$_data).to.be.an('object')
      expect(user.$_data.initialEmail).to.equal('bsmith@gmail.com')

      user.email = 'bobsmith@gmail.com'

      expect(user.email).to.equal('bobsmith@gmail.com')
      expect(user.$_data.initialEmail).to.equal('bsmith@gmail.com')
    })
  })

  describe('custom validate', function () {
    beforeEach(function () {
      lounge = new lounge.Lounge() // recreate it
    })

    it('should use custom validate function', function () {
      var userSchema = new lounge.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, validate: validator.isEmail }
      })

      var User = lounge.model('User', userSchema)
      var user = new User()

      user.email = 'joe@gmail.com'

      expect(user.email).to.equal('joe@gmail.com')

      user.email = 'jsmith'

      expect(user.email).to.equal('joe@gmail.com')
    })
  })
})
