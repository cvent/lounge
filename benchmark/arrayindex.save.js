const Benchmark = require('benchmark')
const testUtil = require('../test/helpers/utils')
const _ = require('lodash')
const async = require('async')

var lounge = require('../')
var userSchema, User, user, bucket

function connect(options, done) {
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

function setup(options, done) {
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

function testFnUser(deferred) {
  counter = counter + 1

  user = new User({
    name: 'Joe Smith',
    email: `joe+${counter}@gmail.com`
  })

  user.save({ waitForIndex: true }, err => {
    deferred.resolve(err)
  })
}

const results = {}

function complete(options, done) {
  results[options.name] = this.stats.mean * 1000
  if (options.flush) {
    bucket.manager().flush(done)
  } else {
    process.nextTick(done)
  }
}

function createTest(options, testFn) {
  return function testerFn(done) {
    console.dir(options, { depth: 3, colors: true })
    const onComplete = _.partial(complete, options, done)
    setup(options, () => {
      var benchNew = new Benchmark(options.name, testFn, {
        defer: true,
        onComplete,
        delay: 0.5
      })

      benchNew.run({ async: true })
    })
  }
}

function createDocs(done) {
  async.timesLimit(3000, 50, (n, cb) => {
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
            console.dir(results, { depth: 3, colors: true })
            process.exit()
          })
        })
      })
    })
  })
})
