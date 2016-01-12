var memoize = require('memoizee');

module.exports = MemoDriver;

/**
 * Finder utility class. Wraps driver and adds memoization to get
 * @param driver
 * @constructor
 */
function MemoDriver(driver) {
  this.driver = driver;

  /**
   * Same as driver.get but memoizes the result for 5 s
   */
  this.get = memoize(this.driver.get.bind(this.driver), {async: true, length: 1, maxAge: 5000});

  /**
   * Clears the memo cache
   */
  this.clear = function() {
    this.get.clear();
  }
}