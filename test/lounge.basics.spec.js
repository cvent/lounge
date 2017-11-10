/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var lounge = require('../')

describe('Lounge basics', function () {
  beforeEach(function () {
    if (lounge) {
      lounge.disconnect()
    }

    lounge = new lounge.Lounge()
  })

  it('Should export the proper functions', function () {
    // exported data
    expect(lounge.models).to.be.an('object')
    expect(lounge.config).to.be.an('object')

    // instance methods
    expect(lounge.setOption).to.be.a('function')
    expect(lounge.getOption).to.be.a('function')
    expect(lounge.get).to.be.a('function')
    expect(lounge.connect).to.be.a('function')
    expect(lounge.disconnect).to.be.a('function')
    expect(lounge.insert).to.be.a('function')
    expect(lounge.upsert).to.be.a('function')
    expect(lounge.remove).to.be.a('function')
    expect(lounge.replace).to.be.a('function')
  })

  describe('connect()', function () {
    it('should connect ok given a connection string and bucket name', function (done) {
      lounge.disconnect()

      lounge.connect({
        connectionString: 'couchbase://127.0.0.1',
        bucket: 'lounge_test'
      }, function (err) {
        expect(err).to.not.be.ok
        expect(lounge.bucket).to.be.ok
        expect(lounge.db).to.be.ok
        expect(lounge.models).to.be.ok
        expect(lounge.config).to.be.ok

        expect(lounge.bucket.configThrottle).to.be.ok
        expect(lounge.bucket.connectionTimeout).to.be.ok
        expect(lounge.bucket.durabilityInterval).to.be.ok
        expect(lounge.bucket.durabilityTimeout).to.be.ok
        expect(lounge.bucket.managementTimeout).to.be.ok
        expect(lounge.bucket.nodeConnectionTimeout).to.be.ok
        expect(lounge.bucket.operationTimeout).to.be.ok
        expect(lounge.bucket.viewTimeout).to.be.ok

        done()
      })
    })
  })

  describe('create model before connect()', function () {
    it('should have db for models created before connect', function (done) {
      lounge.disconnect()

      var schema = lounge.schema({ name: String })
      var Cat = lounge.model('Cat', schema)

      var old = new Cat({ name: 'Bob' })

      expect(Cat.db).to.not.be.ok
      expect(old.db).to.not.be.ok

      lounge.connect({
        connectionString: 'couchbase://127.0.0.1',
        bucket: 'lounge_test'
      }, function (err) {
        expect(err).to.not.be.ok
        expect(lounge.bucket).to.be.ok

        expect(Cat.db).to.be.ok
        expect(Cat.db).to.be.an('object')
        expect(Cat.db).to.equal(lounge.db)
        expect(Cat.db.config).to.be.ok
        expect(Cat.db.bucket).to.be.ok

        expect(Cat._private).to.not.be.ok

        // should not be writable
        Cat._private = { foo: 'bar' }

        expect(Cat.db).to.be.ok
        expect(Cat.db).to.be.an('object')
        expect(Cat.db).to.equal(lounge.db)
        expect(Cat.db.config).to.be.ok
        expect(Cat.db.bucket).to.be.ok

        expect(Cat._private).to.not.be.ok

        var newer = new Cat({ name: 'Joe' })

        expect(old.db).to.be.ok
        expect(newer.db).to.be.ok

        done()
      })
    })
  })

  describe('properties', function () {
    it('should set and get given properties', function () {
      lounge.connect({
        connectionString: 'couchbase://127.0.0.1',
        bucket: 'lounge_test'
      }, function (err) {
        expect(err).to.not.be.ok;

        [
          'configThrottle', 'connectionTimeout', 'durabilityInterval', 'durabilityTimeout', 'managementTimeout',
          'nodeConnectionTimeout', 'operationTimeout', 'viewTimeout'
        ].forEach(function (prop, index) {
          var val = index * 5 * 1000
          lounge[prop] = val
          expect(lounge[prop]).to.equal(val, prop)
        })
      })
    })
  })
})
