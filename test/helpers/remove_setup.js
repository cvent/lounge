var lounge = require('../../lib');
var async = require('async');

exports.data = {
  users: [
    {
      "id": "d2bed65a-1910-4730-b032-0c4ea0f831dd",
      "firstName": "Robert",
      "lastName": "Gonzales",
      "email": "rgonzales0@state.gov",
      "dateOfBirth": "1997-07-19T03:26:02Z"
    }
  ]
};

exports.setup = function (bucket, fn) {
  async.eachSeries(Object.keys(exports.data), function(key, easCb) {
    var objData = exports.data[key];
    async.each(objData, function(obj, eaCb) {
      bucket.upsert(obj.id, obj, eaCb);
    }, easCb);
  }, fn);
};