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

test('should save with pre save middleware', async t => {
  t.plan(6);

  const schema = lounge.schema({
    title: String,
    metadata: {
      doctype: String,
      createdAt: Date,
      updatedAt: Date
    }
  });

  schema.pre('save', function (next) {
    if (!this.metadata) {
      this.metadata = {};
    }

    const now = new Date();

    if (!this.metadata.createdAt) {
      this.metadata.createdAt = now;
    }

    this.metadata.updatedAt = now;
    this.metadata.doctype = this.modelName.toLowerCase();

    next();
  });

  const Post = lounge.model('Post2', schema);

  const post = new Post({
    title: 'sample title'
  });

  const savedDoc = await post.save();
  t.truthy(savedDoc);
  t.true(savedDoc instanceof Post);
  t.true(typeof savedDoc === 'object');
  t.true(typeof savedDoc.id === 'string');
  t.truthy(savedDoc.cas);
  t.is(savedDoc.title, 'sample title');
});

test('should save a nested document with pre save middleware', async t => {
  t.plan(15);

  const base = lounge.schema({
    metadata: {
      doctype: String,
      createdAt: Date,
      updatedAt: Date
    }
  });

  base.pre('save', function (next) {
    if (!this.metadata) {
      this.metadata = {};
    }

    const now = new Date();

    if (!this.metadata.createdAt) {
      this.metadata.createdAt = now;
    }

    this.metadata.updatedAt = now;
    this.metadata.doctype = this.modelName.toLowerCase();

    next();
  });

  function xform(doc, ret) {
    delete ret.metadata;
    return ret;
  }

  base.set('toJSON', { transform: xform });

  const userSchema2 = lounge.schema({
    firstName: String,
    lastName: String,
    email: { type: String, index: true }
  });

  userSchema2.extend(base);

  userSchema2.pre('save', function (next) {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
    next();
  });

  const User2 = lounge.model('User2', userSchema2);

  const schema = lounge.schema({
    title: String,
    owner: { type: User2, index: true }
  });

  schema.extend(base);

  const Post = lounge.model('Post', schema);

  const userData = {
    firstName: 'Joe',
    lastName: 'Smith',
    email: 'JOE@gmail.com'
  };

  const post = new Post({
    title: 'sample title',
    owner: new User2(userData)
  });

  const savedDoc = await post.save();
  t.truthy(savedDoc);
  t.true(savedDoc instanceof Post);
  t.true(typeof savedDoc === 'object');
  t.true(typeof savedDoc.id === 'string');
  t.truthy(savedDoc.cas);
  t.is(savedDoc.title, 'sample title');
  t.true(savedDoc.owner instanceof User2);
  t.true(typeof savedDoc.owner.id === 'string');
  t.is(savedDoc.owner.firstName, 'Joe');
  t.is(savedDoc.owner.lastName, 'Smith');
  t.is(savedDoc.owner.email, 'joe@gmail.com');
  t.true(typeof savedDoc.metadata === 'object');
  t.true(savedDoc.metadata.createdAt instanceof Date);
  t.true(savedDoc.metadata.updatedAt instanceof Date);
  t.true(typeof savedDoc.metadata.doctype === 'string');
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

test('should save another simple document', async t => {
  t.plan(8);

  const user = new User({
    firstName: 'Bob',
    lastName: 'Jones',
    email: 'bob@gmail.com'
  });

  const savedDoc = await user.save();
  t.truthy(savedDoc);
  t.true(savedDoc instanceof User);
  t.true(typeof savedDoc === 'object');
  t.true(typeof savedDoc.id === 'string');
  t.truthy(savedDoc.cas);
  t.is(savedDoc.firstName, 'Bob');
  t.is(savedDoc.lastName, 'Jones');
  t.is(savedDoc.email, 'bob@gmail.com');
});

test('should remove document using static remove()', async t => {
  t.plan(10);

  const email = 'bob@gmail.com';
  const user = await User.findByEmail(email);
  t.truthy(user);

  userId = user.getDocumentKeyValue(true);
  userIdRefDocKey = userSchema.getRefKey('email', user.email);

  const doc = await User.remove(user.id);
  t.truthy(doc);
  t.true(doc instanceof User);
  t.true(typeof doc === 'object');
  t.true(typeof doc.id === 'string');
  t.truthy(doc.cas);
  t.is(doc.firstName, 'Bob');
  t.is(doc.lastName, 'Jones');
  t.is(doc.email, email);

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
