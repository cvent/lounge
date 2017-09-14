const testUtil = require('../test/helpers/utils')
const _ = require('lodash')
const async = require('async')
const marky = require('marky')

var lounge = require('../')
var userSchema, User, user, bucket

function connect (options, done) {
  if (lounge) {
    lounge.disconnect()
  }

  lounge = new lounge.Lounge() // recreate it

  var cluster = testUtil.getCluser()
  bucket = cluster.openBucket('lounge_test', function (err) {
    if (err) {
      return done(err)
    }

    if (options.removeMutateIn) {
      delete bucket.mutateIn
      bucket.mutateIn = null
    }

    lounge.connect({
      bucket: bucket
    }, done)
  })
}

function setup (options, done) {
  connect(options, err => {
    if (err) {
      return done(err)
    }

    userSchema = lounge.schema({
      name: String,
      email: { type: String, index: true, indexType: 'array' }
    })

    User = lounge.model('User', userSchema)

    done()
  })
}

let counter = 0

function testFnUser (fn) {
  counter = counter + 1

  user = new User({
    name: 'Joe Smith',
    email: `joe+${counter}@gmail.com`
  })

  user.save({ waitForIndex: true }, (err, savedDoc) => {
    fn()
  })
}

function complete (options, done) {
  if (options.flush) {
    bucket.manager().flush(done)
  } else {
    process.nextTick(done)
  }
}

const stats = {}

const N = 5000

function createTest (options, testFn) {
  return function testerFn (done) {
    stats[options.name] = []
    console.dir(options, { depth: 3, colors: true })
    setup(options, () => {
      async.timesSeries(N - 5, (n, cb) => {
      // async.timesLimit(N - 5, 10, (n, cb) => {
        marky.mark(options.name + n)
        testFn(() => {
          const entry = marky.stop(options.name + n)
          stats[options.name].push(entry.duration)
          cb()
        })
      }, () => {
        complete(options, done)
      })
    })
  }
}

function createDocs (done) {
  async.timesLimit(N, 50, (n, cb) => {
    const keyCounter = counter + n
    const k = userSchema.getRefKey('email', `joe+${keyCounter}@gmail.com`)
    const id = `userid_${n}`
    bucket.upsert(k, { keys: [id] }, cb)
  }, done)
}

const testNew = createTest({ name: 'arrayindex.save.new', flush: true }, testFnUser)
const testSecond = createTest({ name: 'arrayindex.save.second', flush: true }, testFnUser)
const testNewOld = createTest({ name: 'arrayindex.save.new.old', removeMutateIn: true, flush: true }, testFnUser)
const testSecondOld = createTest({ name: 'arrayindex.save.second.old', removeMutateIn: true, flush: true }, testFnUser)

counter = 0
testNew(() => {
  counter = 0
  createDocs(() => {
    testSecond(() => {
      counter = 10000
      testNewOld(() => {
        counter = 10000
        createDocs(() => {
          testSecondOld(() => {
            _.forEach(stats, (v, k) => {
              v.shift()
              var mean = _.sum(v) / v.length
              console.log(`${k}: ${mean}`)
            })
            process.exit()
          })
        })
      })
    })
  })
})
