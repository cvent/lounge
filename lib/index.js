if (!global._babelPolyfill) {
  // This should be replaced with runtime transformer when this bug is fixed:
  // https://phabricator.babeljs.io/T2877
  require('babel-polyfill');
}

// Without the --harmony and --harmony-proxies flags, options strict: false and dotNotation: true will fail with exception
if (typeof Proxy !== 'undefined') {
  require('harmony-reflect');
}

import Lounge from './lounge';

module.exports = new Lounge();
