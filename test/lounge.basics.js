var expect = require('chai').expect;
var lounge = require('../lib');

describe('Lounge basics', function () {
  it('Should export the proper functions', function () {
    // exported data
    expect(lounge.models).to.be.an('object');
    expect(lounge.schemas).to.be.an('object');
    expect(lounge.options).to.be.an('object');

    // instance methods
    expect(lounge.setOption).to.be.a('function');
    expect(lounge.getOption).to.be.a('function');
    expect(lounge.set).to.be.a('function');
    expect(lounge.get).to.be.a('function');
    expect(lounge.connect).to.be.a('function');
    expect(lounge.disconnect).to.be.a('function');
    expect(lounge.insert).to.be.a('function');
    expect(lounge.upsert).to.be.a('function');
    expect(lounge.remove).to.be.a('function');
    //expect(lounge.model).to.be.a('function');

    // exported prototype objects
    //expect(lounge.Schema).to.be.a('function');
  });

  describe('connect()', function () {
    it('should connect ok given a connection string and bucket name', function (done) {
      lounge.connect({
        connectionString: 'couchbase://10.4.4.1',
        bucket: 'lounge_test'
      }, function (err) {
        expect(err).to.not.be.ok;
        expect(lounge.bucket).to.be.ok;

        expect(lounge.bucket.configThrottle).to.be.ok;
        expect(lounge.bucket.connectionTimeout).to.be.ok;
        expect(lounge.bucket.durabilityInterval).to.be.ok;
        expect(lounge.bucket.durabilityTimeout).to.be.ok;
        expect(lounge.bucket.managementTimeout).to.be.ok;
        expect(lounge.bucket.nodeConnectionTimeout).to.be.ok;
        expect(lounge.bucket.operationTimeout).to.be.ok;
        expect(lounge.bucket.viewTimeout).to.be.ok;

        done();
      })
    });
  });

  describe('properties', function () {
    it('should set and get given properties', function () {
      [
        'configThrottle', 'connectionTimeout', 'durabilityInterval', 'durabilityTimeout', 'managementTimeout',
        'nodeConnectionTimeout', 'operationTimeout', 'viewTimeout'
      ].forEach(function (prop, index) {
          var val = index * 5 * 1000;
          lounge[prop] = val;
          expect(lounge[prop]).to.equal(val);
        });
    });
  });
});