const memoize = require('memoizee')

/**
 * @private
 * Finder utility class. Wraps <code>driver</code> and adds memoization to <code>get</code>.
 * @class
 * @param {Driver} driver - the <code>driver</code> instance to wrap and memoize on.
 */
function MemoDriver (driver) {
  this.driver = driver

  /**
   * Same as <code>Driver.get</code> but memoizes the result for <code>5 s</code>
   * @memberof MemoDriver
   * @instance
   */
  this.get = memoize(this.driver.get.bind(this.driver), {
    async: true,
    length: 1,
    maxAge: 5000
  })

  /**
   * Clears the memo cache
   * @memberof MemoDriver
   * @instance
   */
  this.clear = function () {
    this.get.clear()
  }
}

module.exports = MemoDriver
