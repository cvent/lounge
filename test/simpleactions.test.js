import test from 'ava';
import * as couchbase from 'couchbase';

let lounge = require('../');

let userSchema;
let User;
let bucket;
let userId;
let userIdRefDocKey;

test('should connect and get a bucket', async t => {
  t.plan(1);

  if (lounge) {
    lounge.disconnect();
  }

  lounge = new lounge.Lounge(); // recreate it

  bucket = await lounge.connect({
    connectionString: 'couchbase://127.0.0.1',
    bucket: 'lounge_test'
  });

  t.truthy(bucket);
});

test.cb('should flush and create schema', t => {
  bucket.manager().flush(() => {
    userSchema = lounge.schema({
      firstName: String,
      lastName: String,
      email: { type: String, index: true }
    });

    User = lounge.model('User', userSchema);
    t.end();
  });
});

test('should save a simple document', async t => {
  t.plan(8);

  const user = new User({
    firstName: 'Joe',
    lastName: 'Smith',
    email: 'joe@gmail.com'
  });

  const savedDoc = await user.save();
  t.truthy(savedDoc);
  t.true(savedDoc instanceof User);
  t.true(typeof savedDoc === 'object');
  t.true(typeof savedDoc.id === 'string');
  t.truthy(savedDoc.cas);
  t.is(savedDoc.firstName, 'Joe');
  t.is(savedDoc.lastName, 'Smith');
  t.is(savedDoc.email, 'joe@gmail.com');
});

test('should get the document via index function', async t => {
  t.plan(8);

  const doc = await User.findByEmail('joe@gmail.com');
  t.truthy(doc);
  t.true(doc instanceof User);
  t.true(typeof doc === 'object');
  t.true(typeof doc.id === 'string');
  t.truthy(typeof doc.cas);
  t.is(doc.firstName, 'Joe');
  t.is(doc.lastName, 'Smith');
  t.is(doc.email, 'joe@gmail.com');
});

test('should remove document', async t => {
  t.plan(10);

  const user = await User.findByEmail('joe@gmail.com');
  t.truthy(user);

  userId = user.getDocumentKeyValue(true);
  userIdRefDocKey = userSchema.getRefKey('email', user.email);

  const doc = await user.remove();
  t.truthy(doc);
  t.true(doc instanceof User);
  t.true(typeof doc === 'object');
  t.true(typeof doc.id === 'string');
  t.truthy(doc.cas);
  t.is(doc.firstName, 'Joe');
  t.is(doc.lastName, 'Smith');
  t.is(doc.email, 'joe@gmail.com');

  const r = await lounge.get(userId);
  t.falsy(r);
});

test.cb('actual document and index document should not exit', t => {
  bucket.get(userId, (err, doc) => {
    t.falsy(doc);
    t.truthy(err);
    t.is(err.code, couchbase.errors.keyNotFound);

    bucket.get(userIdRefDocKey, (err, indexRes) => {
      t.falsy(indexRes);
      t.truthy(err);
      t.is(err.code, couchbase.errors.keyNotFound);

      t.end();
    });
  });
});

test('full async test', async t => {
  t.plan(3);
  lounge = new lounge.Lounge();

  const createUserSchema = () => {
    return lounge.schema({
      firstName: String,
      lastName: String,
      email: String
    });
  };

  const createUser = User => {
    return new User({
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@gmail.com'
    });
  };

  const connOpts = {
    connectionString: 'couchbase://127.0.0.1',
    bucket: 'lounge_test',
    mock: true
  };

  await lounge.connect(connOpts);
  const schema = createUserSchema();
  const User = lounge.model('User', schema);
  const user = createUser(User);
  const doc = await user.save();

  t.truthy(doc);
  t.true(typeof doc.id === 'string');
  t.truthy(doc.cas);
});

test('async save fail test', async t => {
  t.plan(1);
  process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL = true;

  const user = new User({
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@gmail.com'
  });

  t.throws(user.save());
  process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL = null;
});

test('async save fail test try catch', async t => {
  t.plan(2);
  process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL = true;

  const user = new User({
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@gmail.com'
  });

  try {
    const doc = await user.save();
  } catch (err) {
    t.truthy(err);
    t.truthy(err instanceof Error);
    process.env.LOUNGE_DEBUG_FORCE_SAVE_FAIL = null;
  }
});
