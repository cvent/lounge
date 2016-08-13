#!/usr/bin/env node
require('shelljs/global');
var v = require('./package.json').version;
srcdir = __dirname + '/_book/api-docs/lounge';
var src = __dirname + '/_book/api-docs/lounge/' + v + '/*';
var dest = __dirname + '/_book/api-docs';
console.log(src)
console.log(dest)
mv(src, dest);
rm('-rf', srcdir);
