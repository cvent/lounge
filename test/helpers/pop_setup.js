var lounge = require('../../lib');
var async = require('async');
var _ = require('lodash');
var uuid = require('uuid');

var data = {
  users: [{
    "firstName": "Bobby",
    "lastName": "Jordan",
    "email": "bjordan0@apple.com",
    "dateOfBirth": "1958-11-01T23:28:14Z",
    "company": "f32a5f17-b827-41b8-83fc-637976a393a5"
  }, {
    "firstName": "Rachel",
    "lastName": "Porter",
    "email": "rporter1@ning.com",
    "dateOfBirth": "1977-04-23T10:32:14Z",
    "company": "company::9be225c9-79a8-4ec4-9113-689a800f825c"
  }, {
    "firstName": "Judith",
    "lastName": "Oliver",
    "email": "joliver2@imgur.com",
    "dateOfBirth": "1967-10-30T08:36:54Z",
    "company": "company::52a1a9b1-5669-4133-9575-2786ebc69635"
  }, {
    "firstName": "Kathleen",
    "lastName": "Hernandez",
    "email": "khernandez3@who.int",
    "dateOfBirth": "2014-11-04T07:23:56Z"
  }, {
    "firstName": "Nicholas",
    "lastName": "Coleman",
    "email": "ncoleman4@europa.eu",
    "dateOfBirth": "1958-04-27T01:21:52Z"
  }],
  companies: [{
    "id": "f32a5f17-b827-41b8-83fc-637976a393a5",
    "name": "Jaxspan",
    "streetAddress": "11 Briar Crest Drive",
    "city": "Columbus",
    "country": "United States",
    "postalCode": "43220",
    "state": "Ohio",
    "founded": "1999-07-21T03:33:19Z"
  }, {
    "id": "9be225c9-79a8-4ec4-9113-689a800f825c",
    "name": "Thoughtstorm",
    "streetAddress": "92862 Autumn Leaf Crossing",
    "city": "Daytona Beach",
    "country": "United States",
    "postalCode": "32128",
    "state": "Florida",
    "founded": "1982-01-25T20:00:51Z"
  }, {
    "id": "52a1a9b1-5669-4133-9575-2786ebc69635",
    "name": "Blogpad",
    "streetAddress": "3 Vera Pass",
    "city": "Huntsville",
    "country": "United States",
    "postalCode": "77343",
    "state": "Texas",
    "founded": "1977-10-13T13:32:24Z"
  }, {
    "id": "343d8f1a-29de-459d-9294-2e44c35f266e",
    "name": "Bubbletube",
    "streetAddress": "84942 Mendota Hill",
    "city": "Hampton",
    "country": "United States",
    "postalCode": "23668",
    "state": "Virginia",
    "founded": "1995-09-21T15:28:07Z"
  }, {
    "id": "1fabd1fe-72eb-421a-9007-19bfd69f2eb7",
    "name": "Avavee",
    "streetAddress": "334 Knutson Place",
    "city": "Saint Paul",
    "country": "United States",
    "postalCode": "55115",
    "state": "Minnesota",
    "founded": "2005-11-15T07:11:04Z"
  }],
  posts: [{
    "id": "f3154355-bfcc-4bf7-b9db-198838399c47",
    "title": "id mauris vulputate elementum nullam varius nulla",
    "body": "Cras mi pede, malesuada in, imperdiet et, commodo vulputate, justo. In blandit ultrices enim. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue.",
    "comments": ["ddbffba8-f2a8-4f84-b59f-85c778e52463"]
  }, {
    "id": "38641ce5-4b5c-45ff-afcf-d4b8b73b5ac0",
    "title": "interdum mauris non ligula pellentesque ultrices",
    "body": "Integer non velit. Donec diam neque, vestibulum eget, vulputate ut, ultrices vel, augue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec pharetra, magna vestibulum aliquet ultrices, erat tortor sollicitudin mi, sit amet lobortis sapien sapien non mi. Integer ac neque.",
    "comments": ["4fefc12b-df84-410c-aa4a-c8aeb8d85ce0", "36e4b763-baff-4077-9d1d-3d814b3f4ac0"]
  }, {
    "id": "8cc6c686-068a-4c26-9a8e-71370ec4e32e",
    "title": "enim blandit mi in",
    "body": "Pellentesque eget nunc.",
    "comments": ["124469a5-e8fd-4546-bc6f-89130b7d74f0", "76232ab0-d5a9-480a-8094-a97d324ba971", "355e3d30-a2df-40f8-98e6-3ceeb8e0fdae"]
  }, {
    "id": "4d97535f-3611-4458-954e-f6e4ab566cc1",
    "title": "quis odio consequat varius integer ac leo",
    "body": "Sed ante. Vivamus tortor. Duis mattis egestas metus. Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh."
  }, {
    "id": "de309406-8529-4643-8ead-0bf260c57a2e",
    "title": "sapien in sapien iaculis congue vivamus metus",
    "body": "In blandit ultrices enim.",
    "comments": []
  }],
  comments: [{
    "id": "ddbffba8-f2a8-4f84-b59f-85c778e52463",
    "body": "felis donec semper sapien a libero"
  }, {
    "id": "4fefc12b-df84-410c-aa4a-c8aeb8d85ce0",
    "body": "nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel",
    "user": "ncoleman4@europa.eu"
  }, {
    "id": "36e4b763-baff-4077-9d1d-3d814b3f4ac0",
    "body": "lectus pellentesque eget nunc donec",
    "user": "rporter1@ning.com"
  }, {
    "id": "124469a5-e8fd-4546-bc6f-89130b7d74f0",
    "body": "sociis natoque penatibus et magnis dis parturient montes nascetur ridiculus mus etiam vel",
    "user": "joliver2@imgur.com"
  }, {
    "id": "76232ab0-d5a9-480a-8094-a97d324ba971",
    "body": "metus aenean fermentum donec ut mauris",
    "user": "joliver2@imgur.com"
  }, {
    "id": "355e3d30-a2df-40f8-98e6-3ceeb8e0fdae",
    "body": "cubilia curae donec pharetra magna vestibulum aliquet ultrices erat tortor sollicitudin mi sit",
    "user": "bjordan0@apple.com"
  }, {
    "id": "a5cb7e0f-f570-45ec-9229-eb5e5acf43f5",
    "body": "arcu libero rutrum ac lobortis vel dapibus at diam nam",
    "user": "ncoleman4@europa.eu"
  }, {
    "id": "d33263cd-238c-431f-b250-ffc15b9f20e7",
    "body": "primis in faucibus orci luctus et ultrices posuere cubilia curae mauris viverra diam vitae",
    "user": "joliver2@imgur.com"
  }, {
    "id": "b9ef9373-e3b3-4dc6-952a-39e225503486",
    "body": "ac enim in tempor turpis nec euismod scelerisque quam turpis adipiscing lorem vitae mattis",
    "user": "ncoleman4@europa.eu"
  }, {
    "id": "c3a361cc-4fe6-4316-bdff-38bcf32edcc1",
    "body": "sit amet sapien dignissim vestibulum vestibulum ante",
    "user": "bjordan0@apple.com"
  }]
};

var keymapping = {
  'users': 'email',
  'companies': 'id',
  'posts': 'id',
  'comments': 'id'
};

exports.setup = function (bucket, fn) {
  exports.data = _.cloneDeep(data);

  async.eachSeries(Object.keys(exports.data), function (key, easCb) {
    var objData = exports.data[key];
    async.eachSeries(objData, function (obj, eaCb) {
      var docId = obj[keymapping[key]] || obj.id || uuid.v4();
      if (key === 'companies') {
        // companies we save with prefix
        docId = 'company::'.concat(docId);
      }

      // console.log('upsert %s', docId);
      bucket.upsert(docId, obj, eaCb);
    }, easCb);
  }, fn);
};