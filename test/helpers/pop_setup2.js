var lounge = require('../../lib');
var _ = require('lodash');

var data = {
  users: [{
    "firstName": "Bobby",
    "lastName": "Jordan",
    "email": "bjordan0@apple.com",
    "company": "f32a5f17-b827-41b8-83fc-637976a393a5"
  }, {
    "firstName": "Rachel",
    "lastName": "Porter",
    "email": "rporter1@ning.com",
    "company": "company::9be225c9-79a8-4ec4-9113-689a800f825c"
  }, {
    "firstName": "Judith",
    "lastName": "Oliver",
    "email": "joliver2@imgur.com",
    "company": "company::52a1a9b1-5669-4133-9575-2786ebc69635"
  }, {
    "firstName": "Kathleen",
    "lastName": "Hernandez",
    "email": "khernandez3@who.int"
  }],
  companies: [{
    "id": "f32a5f17-b827-41b8-83fc-637976a393a5",
    "name": "Jaxspan",
    "streetAddress": "11 Briar Crest Drive",
    "city": "Columbus",
    "country": "United States",
    "postalCode": "43220",
    "state": "Ohio"
  }, {
    "id": "9be225c9-79a8-4ec4-9113-689a800f825c",
    "name": "Thoughtstorm",
    "streetAddress": "92862 Autumn Leaf Crossing",
    "city": "Daytona Beach",
    "country": "United States",
    "postalCode": "32128",
    "state": "Florida"
  }, {
    "id": "52a1a9b1-5669-4133-9575-2786ebc69635",
    "name": "Blogpad",
    "streetAddress": "3 Vera Pass",
    "city": "Huntsville",
    "country": "United States",
    "postalCode": "77343",
    "state": "Texas"
  }, {
    "id": "343d8f1a-29de-459d-9294-2e44c35f266e",
    "name": "Bubbletube",
    "streetAddress": "84942 Mendota Hill",
    "city": "Hampton",
    "country": "United States",
    "postalCode": "23668",
    "state": "Virginia"
  }, {
    "id": "1fabd1fe-72eb-421a-9007-19bfd69f2eb7",
    "name": "Avavee",
    "streetAddress": "334 Knutson Place",
    "city": "Saint Paul",
    "country": "United States",
    "postalCode": "55115",
    "state": "Minnesota"
  }]
};

exports.getData = function () {
  return _.cloneDeep(data);
};