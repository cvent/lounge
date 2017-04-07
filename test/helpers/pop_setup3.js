var async = require('async')
var _ = require('lodash')
var uuid = require('uuid')

var data = {
  users: [{
    'firstName': 'Bobby',
    'lastName': 'Jordan',
    'email': 'bjordan0@apple.com',
    'company': 'f32a5f17-b827-41b8-83fc-637976a393a5'
  }, {
    'firstName': 'Rachel',
    'lastName': 'Porter',
    'email': 'rporter1@ning.com',
    'company': 'f32a5f17-b827-41b8-83fc-637976a393a5'
  }, {
    'firstName': 'Nicholas',
    'lastName': 'Coleman',
    'email': 'ncoleman4@europa.eu',
    'company': '52a1a9b1-5669-4133-9575-2786ebc69635'
  }, {
    'firstName': 'Robert',
    'lastName': 'Dunphy',
    'email': 'rdunphy@acme.co',
    'company': '52a1a9b1-5669-4133-9575-2786ebc69635'
  }, {
    'firstName': 'Kate',
    'lastName': 'Porter',
    'email': 'kporter@salesforce.com',
    'company': '52a1a9b1-5669-4133-9575-2786ebc69635'
  }, {
    'firstName': 'Kathleen',
    'lastName': 'Hernandez',
    'email': 'khernandez3@who.int'
  }, {
    'firstName': 'Julie',
    'lastName': 'Oliver',
    'email': 'joliver2@imgur.com',
    'company': '9be225c9-79a8-4ec4-9113-689a800f825c'
  }, {
    'firstName': 'Judith',
    'lastName': 'Fowler',
    'email': 'jfowler0@icio.us',
    'company': '343d8f1a-29de-459d-9294-2e44c35f266e'
  }, {
    'firstName': 'Jesse',
    'lastName': 'Palmer',
    'email': 'jpalmer1@phoca.cz',
    'company': '1fabd1fe-72eb-421a-9007-19bfd69f2eb7'
  }],
  companies: [{
    'id': 'f32a5f17-b827-41b8-83fc-637976a393a5',
    'name': 'Jaxspan',
    'streetAddress': '11 Briar Crest Drive',
    'city': 'Columbus',
    'country': 'United States',
    'postalCode': '43220',
    'state': 'Ohio'
  }, {
    'id': '9be225c9-79a8-4ec4-9113-689a800f825c',
    'name': 'Thoughtstorm',
    'streetAddress': '92862 Autumn Leaf Crossing',
    'city': 'Daytona Beach',
    'country': 'United States',
    'postalCode': '32128',
    'state': 'Florida'
  }, {
    'id': '52a1a9b1-5669-4133-9575-2786ebc69635',
    'name': 'Blogpad',
    'streetAddress': '3 Vera Pass',
    'city': 'Huntsville',
    'country': 'United States',
    'postalCode': '77343',
    'state': 'Texas'
  }, {
    'id': '343d8f1a-29de-459d-9294-2e44c35f266e',
    'name': 'Bubbletube',
    'streetAddress': '84942 Mendota Hill',
    'city': 'Hampton',
    'country': 'United States',
    'postalCode': '23668',
    'state': 'Virginia'
  }, {
    'id': '1fabd1fe-72eb-421a-9007-19bfd69f2eb7',
    'name': 'Avavee',
    'streetAddress': '334 Knutson Place',
    'city': 'Saint Paul',
    'country': 'United States',
    'postalCode': '55115',
    'state': 'Minnesota'
  }]
}

var keymapping = {
  'users': 'email',
  'companies': 'id'
}

exports.getData = function () {
  return _.cloneDeep(data)
}

exports.setup = function (bucket, fn) {
  exports.data = _.cloneDeep(data)

  async.eachSeries(Object.keys(exports.data), function (key, easCb) {
    var objData = exports.data[key]
    async.eachSeries(objData, function (obj, eaCb) {
      var docId = obj[keymapping[key]] || obj.id || uuid.v4()
      if (key === 'companies') {
        // companies we save with prefix
        docId = 'company::'.concat(docId)
      }

      bucket.upsert(docId, obj, eaCb)
    }, easCb)
  }, fn)
}
