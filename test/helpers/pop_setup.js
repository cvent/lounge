var lounge = require('../../lib');
var async = require('async');
var uuid = require('uuid');

exports.data = {
  users: [{
    "id": "f1fbfaa8-4ee0-4612-a272-04b092869f4e",
    "firstName": "Bobby",
    "lastName": "Jordan",
    "email": "bjordan0@apple.com",
    "dateOfBirth": "1958-11-01T23:28:14Z"
  }, {
    "id": "51bf4ea0-a545-4251-b644-84b849fef9c3",
    "firstName": "Rachel",
    "lastName": "Porter",
    "email": "rporter1@ning.com",
    "dateOfBirth": "1977-04-23T10:32:14Z"
  }, {
    "id": "5b7205ef-3cbb-442d-89c1-971ebc1bfb85",
    "firstName": "Judith",
    "lastName": "Oliver",
    "email": "joliver2@imgur.com",
    "dateOfBirth": "1967-10-30T08:36:54Z"
  }, {
    "id": "65374518-54d2-4683-a449-a57e449086fb",
    "firstName": "Kathleen",
    "lastName": "Hernandez",
    "email": "khernandez3@who.int",
    "dateOfBirth": "2014-11-04T07:23:56Z"
  }, {
    "id": "443047c9-629f-4388-8f16-096d3936a0a2",
    "firstName": "Nicholas",
    "lastName": "Coleman",
    "email": "ncoleman4@europa.eu",
    "dateOfBirth": "1958-04-27T01:21:52Z"
  }],
  companies: [{
    "id": "company::f32a5f17-b827-41b8-83fc-637976a393a5",
    "name": "Jaxspan",
    "streetAddress": "11 Briar Crest Drive",
    "city": "Columbus",
    "country": "United States",
    "postalCode": "43220",
    "state": "Ohio",
    "founded": "1999-07-21T03:33:19Z"
  }, {
    "id": "company::9be225c9-79a8-4ec4-9113-689a800f825c",
    "name": "Thoughtstorm",
    "streetAddress": "92862 Autumn Leaf Crossing",
    "city": "Daytona Beach",
    "country": "United States",
    "postalCode": "32128",
    "state": "Florida",
    "founded": "1982-01-25T20:00:51Z"
  }, {
    "id": "company::52a1a9b1-5669-4133-9575-2786ebc69635",
    "name": "Blogpad",
    "streetAddress": "3 Vera Pass",
    "city": "Huntsville",
    "country": "United States",
    "postalCode": "77343",
    "state": "Texas",
    "founded": "1977-10-13T13:32:24Z"
  }, {
    "id": "company::343d8f1a-29de-459d-9294-2e44c35f266e",
    "name": "Bubbletube",
    "streetAddress": "84942 Mendota Hill",
    "city": "Hampton",
    "country": "United States",
    "postalCode": "23668",
    "state": "Virginia",
    "founded": "1995-09-21T15:28:07Z"
  }, {
    "id": "company::1fabd1fe-72eb-421a-9007-19bfd69f2eb7",
    "name": "Avavee",
    "streetAddress": "334 Knutson Place",
    "city": "Saint Paul",
    "country": "United States",
    "postalCode": "55115",
    "state": "Minnesota",
    "founded": "2005-11-15T07:11:04Z"
  }]
};

var keymapping = {
  'users': 'id',
  'users2': 'email',
  'users3': 'username',
  'companies': 'id'
};

exports.setup = function (bucket, fn) {
  async.eachSeries(Object.keys(exports.data), function (key, easCb) {
    var objData = exports.data[key];
    async.each(objData, function (obj, eaCb) {
      var docId = obj[keymapping[key]] || obj.id || uuid.v4();
      bucket.upsert(docId, obj, eaCb);
    }, easCb);
  }, fn);
};