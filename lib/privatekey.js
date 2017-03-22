// If reflection is being used, our traps will hide internal properties.
// If reflection is not being used, Symbol will hide internal properties.

const version = require('node-version');

const _privateKey = (typeof Proxy === 'undefined' || version.major < 6) ?
  '_private' :
  Symbol('_private');

// The private symbol is not visible in inherited classes due to proxy usage.
export { _privateKey as default };
