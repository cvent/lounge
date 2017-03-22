// If reflection is being used, our traps will hide internal properties.
// If reflection is not being used, Symbol will hide internal properties.
const _privateKey = Symbol('_private')

// The private symbol is not visible in inherited classes due to proxy usage.
module.exports = _privateKey
