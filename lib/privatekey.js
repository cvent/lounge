// If reflection is being used, our traps will hide internal properties.
// If reflection is not being used, Symbol will hide internal properties.
//const _privateKey = typeof(Proxy) === 'undefined' ? '_private' : Symbol('_private');

// The private symbol is not visible in inherited classes. also messes up assignment. Figure it out. For now just use
// simple string...
const _privateKey = '_private';
export { _privateKey as default };