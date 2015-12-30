var couchbase = require('couchbase');
var testUtil = require('./helpers/utils');
var _ = require('lodash');
var async = require('async');
var expect = require('chai').expect;
var wrapper = require('../lib/driver');

var bucket;
var driver;

var mockData = [
  {
    key: 'driver_test_mock_1',
    value: {
      foo: 'bar'
    }
  },
  {
    key: 'driver_test_mock_2',
    value: {
      firstName: 'Bob',
      lastName: 'Smith'
    }
  },
  {
    key: 'driver_test_mock_3',
    value: {
      firstName: 'Bill',
      lastName: 'Jones'
    }
  }
];

describe('Driver helper bucket tests', function () {
  before(function (done) {
    var cluster = testUtil.getCluser();
    bucket = cluster.openBucket('lounge_test', function (err) {
      if (err) {
        return done(err);
      }

      bucket.manager().flush(function (err) {
        if (err) return done(err);

        driver = wrapper.wrap(bucket);

        async.each(mockData, function (data, eacb) {
          bucket.upsert(data.key, data.value, eacb)
        }, done)
      });
    });
  });

  it('should get a document using the custom get', function (done) {
    driver.get(mockData[0].key, function (err, res) {
      expect(err).to.not.be.ok;

      expect(res).to.be.ok;
      expect(res).to.be.an('object');
      expect(res.cas).to.be.ok;
      expect(res.cas).to.be.instanceof(Object);
      expect(res.value).to.be.ok;
      expect(res.value).to.be.an('object');
      expect(res.value).to.deep.equal(mockData[0].value);
      done();
    });
  });

  it('should get an array of documents using the custom get', function (done) {
    var keys = _.pluck(mockData, 'key');

    driver.get(keys, function (errors, results, misses) {
      expect(errors).to.not.be.ok;

      expect(misses).to.be.instanceOf(Array);
      expect(misses.length).to.equal(0);

      expect(results).to.be.instanceOf(Array);

      var actual = _.pluck(results, 'value');
      var expected = _.pluck(mockData, 'value');

      expect(actual).to.deep.equal(expected);

      done();
    });
  });

  it('should get an array of documents using the custom get and return misses', function (done) {
    var keys = ['driver_test_mock_1', 'driver_test_mock_2', 'driver_test_mock_4', 'driver_test_mock_3'];

    driver.get(keys, function (errors, results, misses) {
      expect(errors).to.not.be.ok;

      expect(misses).to.be.instanceOf(Array);
      expect(misses.length).to.equal(1);

      expect(misses).to.deep.equal(['driver_test_mock_4']);

      expect(results).to.be.instanceOf(Array);

      var actual = _.pluck(results, 'value');
      var expected = _.pluck(mockData, 'value');

      expect(actual).to.deep.equal(expected);

      done();
    });
  });

  it('should call upsert as is on normal bucket', function (done) {
    driver.upsert('driver_test_mock_4', {
      somedata: 1234
    }, function (err) {
      expect(err).to.not.be.ok;

      done();
    });
  });

  it('should call getMulti as is on normal bucket', function (done) {
    driver.getMulti(['driver_test_mock_3', 'driver_test_mock_4'], function (err, res) {
      expect(err).to.not.be.ok;

      expect(res).to.be.ok;
      expect(res).to.be.an('object');

      expect(res['driver_test_mock_3']).to.be.an('object');
      expect(res['driver_test_mock_3'].value).to.be.ok;
      expect(res['driver_test_mock_3'].value).to.be.an('object');
      expect(res['driver_test_mock_3'].value).to.deep.equal(mockData[2].value);

      expect(res['driver_test_mock_4']).to.be.an('object');
      expect(res['driver_test_mock_4'].value).to.be.ok;
      expect(res['driver_test_mock_4'].value).to.be.an('object');
      expect(res['driver_test_mock_4'].value).to.deep.equal({somedata: 1234});
      done();
    });
  });

  it('should get an array of documents using the custom get', function (done) {
    var keys = _.pluck(mockData, 'key');
    keys.push('driver_test_mock_4');

    driver.get(keys, function (errors, results, misses) {
      expect(errors).to.not.be.ok;

      expect(misses).to.be.instanceOf(Array);
      expect(misses.length).to.equal(0);

      expect(results).to.be.instanceOf(Array);

      var actual = _.pluck(results, 'value');
      var expected = _.pluck(mockData, 'value');
      expected.push({somedata: 1234})

      expect(actual).to.deep.equal(expected);

      done();
    });
  });

});