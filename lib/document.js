const _ = require('lodash')
const uuid = require('uuid')

const { BaseModel } = require('./basemodel')
const _privateKey = require('./privatekey')

class Document extends BaseModel {
  /**
   * @classdesc Base constructor for all created Document instances.
   * Represents just the document data and generic properties and functions.
   * Clients should never have to call this directly.
   *
   * @description Clients do not need to create Document manually.
   * @class
   * @augments BaseModel
   * @param {Object} values - the object data
   * @param {Object} options - creation options
   * @param {Boolean} options.clone - Whether to deep clone the incoming data. Default: <code>false</code>.
   *                                  Make sure you wish to do this as it has performance implications. This is
   *                                  useful if you are creating multiple instances from same base data and then
   *                                  wish to modify each instance.
   * @param {Schema} schema - schema instance
   * @param {String} name - the model name
   * @returns {Document}
   */
  constructor (values, options, schema, name) {
    super(values, options, schema)

    if (name) {
      this[_privateKey].modelName = name
    }

    const idKey = this.getDocumentKeyKey()

    // auto generate document key if needed
    if (this.schema.key.generate === true && !this[idKey]) {
      this.set(idKey, uuid())
      this[_privateKey]._isNew = true
    }

    // if they supplied init() method
    if (this.init && _.isFunction(this.init)) {
      this.init()
    }
  }

  /**
   * The name the name of the model. This is both a static and instance property.
   * @member {String}
   * @example
   * var schema = lounge.schema({ name: String });
   * var Cat = lounge.model('Cat', schema);
   * var kitty = new Cat({ name: 'Zildjian' });
   * console.log(Cat.modelName); // 'Cat'
   * console.log(kitty.modelName); // 'Cat'
   */
  get modelName () {
    return this[_privateKey].modelName
  }

  /**
   * Has a key been generated for this document.
   * @member {Boolean}
   * @example
   * var schema = lounge.schema({ name: String });
   * var Cat = lounge.model('Cat', schema);
   * var kitty = new Cat({ name: 'Zildjian' });
   * console.log(kitty._isNew); // true
   * var kat = new Cat({ id: '123abc', name: 'Sabian' });
   * console.log(kat._isNew); // false
   */
  get _isNew () {
    return this[_privateKey]._isNew
  }

  /**
   *
   * @param options
   * @param json
   * @returns {{}}
   * @private
   */
  _toObject (options, json) {
    options = this._prepareToObjectOptions(options, json)
    const ret = super._toObject(options, json)

    this._applyDocumentKey(ret, options)

    return ret
  }

  /**
   * Helper function to get the document key.
   * @public
   * @param {Boolean} full - If <code>true</code> the full expanded value of the key will be returned.
   *                  If there were any suffix and / or prefix defined in schema they are applied.
   * @returns {String} document key
   * @example
   * var schema = lounge.schema({ email: String }, { keyPrefix: 'user::'});
   * var User = lounge.model('User', schema);
   * var user = new User({ email: 'bsmith@acme.com' });
   * console.log(user.getDocumentKeyValue()); // 114477a8-1901-4146-8c90-0fc9eec57a58
   * console.log(user.getDocumentKeyValue(true)); // user::114477a8-1901-4146-8c90-0fc9eec57a58
   */
  getDocumentKeyValue (full) {
    const idKey = this.getDocumentKeyKey()
    return this.schema.getDocumentKeyValue(this[idKey], full)
  }

  /**
   * Gets the Document key property name.
   * @public
   * @returns {String} Document key property name
   * @example
   * var schema = lounge.schema({ email: { type: String, key: true, generate: false }});
   * var User = lounge.model('User', schema);
   * var user = new User({ email: 'bsmith@acme.com' });
   * console.log(user.getDocumentKeyKey()); // email
   */
  getDocumentKeyKey () {
    return this.schema.key.docKeyKey
  }

  /**
   * Static version of <code>getDocumentKeyValue</code>.
   * @public
   * @param {String} id - id of the document
   * @param {Boolean} full - If <options>true</options> the full expanded value of the key will be returned.
   *                  If there were any suffix and / or prefix defined in schema they are applied.
   * @returns {string} Document key / id
   * @example
   * // assuming keyPrefix: 'user::'
   * console.log(User.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', true)); // user::114477a8-1901-4146-8c90-0fc9eec57a58
   * console.log(User.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', true)); // user::114477a8-1901-4146-8c90-0fc9eec57a58
   * console.log(User.getDocumentKeyValue('user::114477a8-1901-4146-8c90-0fc9eec57a58', false)); // 114477a8-1901-4146-8c90-0fc9eec57a58
   * console.log(User.getDocumentKeyValue('114477a8-1901-4146-8c90-0fc9eec57a58', false)); // 114477a8-1901-4146-8c90-0fc9eec57a58
   */
  static getDocumentKeyValue (id, full) {
    return this.schema.getDocumentKeyValue(id, full)
  }

  /**
   * Used to detect instance of schema object internally.
   * @private
   */
  _isDocumentObject () {
    return true
  }

  /*!
   * Applies document key
   * @param self
   * @param ret
   * @param options
   */
  _applyDocumentKey (ret, options) {
    if (!options) {
      options = {}
    }

    const schemaOption = options.json ? 'toJSON' : 'toObject'

    let expandDocumentKey
    if (_.isBoolean(options.expandDocumentKey)) {
      expandDocumentKey = options.expandDocumentKey
    }
    if (!_.isBoolean(expandDocumentKey)) {
      expandDocumentKey = _.isPlainObject(this.schema.options[schemaOption]) &&
        _.isBoolean(this.schema.options[schemaOption].expandDocumentKey)
        ? this.schema.options[schemaOption].expandDocumentKey : false
    }

    if (expandDocumentKey) {
      const k = this.getDocumentKeyKey()
      ret[k] = this.getDocumentKeyValue(true)
    }
  }
}

module.exports = Document
