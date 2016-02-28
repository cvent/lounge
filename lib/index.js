if (!global._babelPolyfill) {
  // This should be replaced with runtime transformer when this bug is fixed:
  // https://phabricator.babeljs.io/T2877
  require('babel-polyfill');
}

// Without the --harmony and --harmony_proxies flags, options strict: false and dotNotation: true will fail with exception
if (typeof(Proxy) !== 'undefined') {
  // Workaround for https://github.com/tvcutsem/harmony-reflect/issues/66
  const warn = console.warn;
  console.warn = function (message) {
    if (message !== 'getOwnPropertyNames trap is deprecated. Use ownKeys instead') {
      warn.apply(console, arguments);
    }
  };
  require('harmony-reflect');
}

import { Lounge } from './lounge'

module.exports = new Lounge();