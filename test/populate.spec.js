var couchbase = require('couchbase');
var _ = require('lodash');
var expect = require('chai').expect;
var ts = require('./helpers/findbyid_setup');

var lounge = require('../lib');
var Schema = lounge.Schema;

var bucket;
var User1, User2, User3, Company;

describe('Model populate tests', function () {

});