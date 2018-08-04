---
title: Debug Logging
---

# Debug logging

[debug](https://npmjs.com/package/debug) package is used for debug logging.

```sh
DEBUG=lounge node app.js
```

Since Lounge uses [couchbase-driver](https://npmjs.com/package/couchbase-driver) which also uses [debug](https://npmjs.com/package/debug) we can combine both together...

```sh
DEBUG=lounge,couchbase-driver node app.js
lounge connect to open bucket +3ms
lounge single index. operation: upsert key: $_ref_by_email_joe@gmail.com refKeyValue: 0f99b12c-6e4e-489b-add4-e32b3db3b346 +13ms
lounge save. type: User  key: 0f99b12c-6e4e-489b-add4-e32b3db3b346 +2ms
lounge User.findByIndexValue. value: $_ref_by_email_joe@gmail.com path: email +2ms
couchbase-driver Driver.get. keys: $_ref_by_email_joe@gmail.com +0ms
lounge User.findById. id: 0f99b12c-6e4e-489b-add4-e32b3db3b346 +9ms
couchbase-driver Driver.get. keys: 0f99b12c-6e4e-489b-add4-e32b3db3b346 +0ms
```
