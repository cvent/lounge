#!/usr/bin/env node
require('shelljs/global');
var v = require('./package.json').version;
srcdir = __dirname + '/api-docs';
var src = __dirname + '/api-docs/lounge/' + v + '/*';
var dest = __dirname + '/docs/api-docs';
console.log(src)
console.log(dest)
mv(src, dest);
