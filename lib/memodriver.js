const memoize = require('memoizee');

module.exports = MemoDriver;

/**
 * @classdesc Finder utility class. Wraps <code>driver</code> and adds memoization to <code>get</code>.
 *
 * Creates a new instance by wrapping the <code>driver</code>.
 * @param {Driver} driver - the <code>driver</code> instance to wrap and memoize on.
 * @constructor
 */
function MemoDriver(driver) {
  this.driver = driver;

  /**
   * Same as <code>Driver.get</code> but memoizes the result for <code>5 s</code>
   */
  this.get = memoize(this.driver.get.bind(this.driver), {
    async: true,
    length: 1,
    maxAge: 5000
  });

  /**
   * Clears the memo cache
   */
  this.clear = function () {
    this.get.clear();
  };
}
