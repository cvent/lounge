var couchbase = require('couchbase')

exports.getCluser = function () {
  return process.env.LOUNGE_COUCHBASE_MOCK
    ? new couchbase.Mock.Cluster('couchbase://127.0.0.1')
    : new couchbase.Cluster('couchbase://127.0.0.1')
}
