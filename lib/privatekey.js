// If reflection is being used, our traps will hide internal properties.
// If reflection is not being used, Symbol will hide internal properties.
const _privateKey = typeof Proxy === 'undefined' ? '_private' : Symbol('_private');

// The private symbol is not visible in inherited classes due to proxy usage.
export { _privateKey as default };
