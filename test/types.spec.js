/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const _ = require('lodash')
const expect = require('chai').expect
let lounge = require('../')

describe('Type tests', function () {
  describe('any type', function () {
    beforeEach(function () {
      lounge = new lounge.Lounge() // recreate it
    })

    describe('transform', function () {
      it('should turn any string to lowercase but not touch other values', function () {
        var schema = lounge.schema({
          value: {
            type: 'any',
            transform: function (value) {
              if (_.isString(value)) {
                return value.toLowerCase()
              }
              return value
            }
          }
        })

        var SModel = lounge.model('SModel', schema)

        var o = new SModel()

        o.value = 123
        expect(o.value).to.be.a('number')
        expect(o.value).to.equal(123)

        o.value = 'HELLO'
        expect(o.value).to.be.a('string')
        expect(o.value).to.equal('hello')
      })
    })

    describe('custom get', function () {
      it('getter to transform property on get', function () {
        var schema = lounge.schema({
          firstName: String,
          lastName: String,
          name: {
            type: String,
            get: function (value) {
              if (value) {
                return value
              } else {
                return (this.firstName ? this.firstName + ' ' : '') + (this.lastName ? this.lastName : '')
              }
            }
          }
        })

        var SModel = lounge.model('SModel', schema)
        var o = new SModel()
        o.firstName = 'Joe'
        o.lastName = 'Smith'

        expect(o.name).to.be.a('string')
        expect(o.name).to.equal('Joe Smith')
        o.name = 'Bill Jones'
        expect(o.name).to.equal('Bill Jones')
      })

      it('getter should happen after typecast', function () {
        var schema = lounge.schema({
          date: {
            type: Date,
            get: function (date) {
              if (date) {
                return date.getTime()
              }
            }
          }
        })

        var SModel = lounge.model('SModel', schema)
        var o = new SModel()
        o.date = 'Tue Jun 21 1988 00:00:00 GMT-0700 (PDT)'
        expect(o.date).to.be.a('Number')
        expect(o.date).to.equal(582879600000)
      })
    })

    describe('default', function () {
      it('default as function should only be called once', function (done) {
        var i = 0
        var schema = lounge.schema({
          token: {
            type: String,
            readOnly: true,
            default: function () {
              return i++
            }
          },
          defaultDate: {
            type: Date,
            default: function () {
              return Date.now() * Math.random()
            }
          },
          defaultObject: {
            type: Object,
            objectType: { foo: String },
            default: function () {
              return { foo: 'bar' }
            }
          }
        })

        var SModel = lounge.model('SModel', schema)
        var o = new SModel()

        expect(o.hasErrors()).to.be.false

        var token = o.token
        var stillSameToken = o.token
        expect(token).equal(stillSameToken)

        var date = o.defaultDate
        var stillSameDate = o.defaultDate
        expect(date).to.equal(stillSameDate)

        var obj = o.defaultObject
        var stillSameObject = o.defaultObject
        expect(_.isEqual(obj, stillSameObject)).to.be.true
        done()
      })
    })

    describe('alias', function () {
      var SModel
      before(function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          state: String,
          region: { type: 'alias', target: 'state' },
          regionTransform: {
            type: 'alias',
            target: 'state',
            transform: function (value) {
              if (value === 'test') {
                value = value.toUpperCase()
              }
              return value
            }
          }
        })

        SModel = lounge.model('SModel', schema)
      })

      it('should allow alias to be used to set values', function () {
        var o = new SModel()
        o.region = 'CA'
        expect(o.region).to.be.a('string')
        expect(o.region).to.equal('CA')
        expect(o.state).to.be.a('string')
        expect(o.state).to.equal('CA')
      })

      it('should see same value on alias when not set through alias', function () {
        var o = new SModel()
        o.state = 'CA'
        expect(o.region).to.be.a('string')
        expect(o.region).to.equal('CA')
        expect(o.state).to.be.a('string')
        expect(o.state).to.equal('CA')
      })

      it('should allow alias to pre-transform values', function () {
        var o = new SModel()
        o.regionTransform = 'test'
        expect(o.regionTransform).to.be.a('string')
        expect(o.regionTransform).to.equal('TEST')
        expect(o.state).to.be.a('string')
        expect(o.state).to.equal('TEST')
      })

      it('should typecast values set through alias', function () {
        var o = new SModel()
        o.region = 123
        expect(o.state).to.be.a('string')
        expect(o.state).to.equal('123')
      })
    })

    describe('readOnly', function () {
      it('should not allow you to modify value', function () {
        var schema = lounge.schema({
          name: { type: String, readOnly: true, default: 'Bill Jones' }
        })

        var User = lounge.model('User', schema)
        var o = new User()
        o.name = 'John Smith'
        expect(o.name).to.equal('Bill Jones')
      })
    })
  })

  describe('String', function () {
    describe('typecasting', function () {
      var SModel

      before(function () {
        lounge = new lounge.Lounge()

        var schema = lounge.schema({
          string: String
        })

        SModel = lounge.model('SModel', schema)
      })

      it('should typecast integer to string', function () {
        var o = new SModel()

        o.string = 123
        expect(o.string).to.be.a('string')
        expect(o.string).to.equal('123')
      })

      it('should typecast boolean to string', function () {
        var o = new SModel()

        o.string = true
        expect(o.string).to.be.a('string')
        expect(o.string).to.equal('true')

        o.string = false
        expect(o.string).to.be.a('string')
        expect(o.string).to.equal('false')
      })

      it('should not join array into string', function () {
        var o = new SModel()

        o.string = ['h', 'e', 'l', 'l', 'o']
        expect(o.string).to.not.be.ok
      })

      it('should reject object', function () {
        var o = new SModel()

        o.string = { 0: 'h', 1: 'e', 2: 'l', 3: 'l', 4: 'o' }
        expect(o.string).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)
      })
    })

    describe('regex', function () {
      it('should only allow values that match regex ^([A-Z]{4})$', function () {
        lounge = new lounge.Lounge()

        var schema = lounge.schema({
          string: {
            type: String,
            regex: new RegExp('^([A-Z]{4})$')
          }
        })

        var SModel = lounge.model('SModel', schema)

        var o = new SModel()

        o.string = 'ABCD'
        expect(o.string).to.equal('ABCD')

        o.string = '1234'
        expect(o.string).to.equal('ABCD')
      })
    })

    describe('enum', function () {
      var SModel
      before(function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          string: { type: String, enum: ['allowed', 'also allowed'], default: 'allowed' }
        })

        SModel = lounge.model('smodel', schema)
      })

      it('should allow values in enum', function () {
        var o = new SModel()

        o.string = 'allowed'
        expect(o.string).to.equal('allowed')

        o.string = 'also allowed'
        expect(o.string).to.equal('also allowed')
      })

      it('value should remain untouched when non-enum is passed', function () {
        var o = new SModel()

        o.string = 'also allowed'
        expect(o.string).to.equal('also allowed')

        o.string = 'xxxxxx'
        expect(o.string).to.equal('also allowed')
      })

      it('default must be in enum or is rejected', function () {
        var schema = lounge.schema({
          string: { type: String, enum: ['allowed', 'also allowed'], default: 'not in enum' }
        })

        var SModel2 = lounge.model('smodel2', schema)

        var o = new SModel2()

        expect(o.string).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)
      })

      it('default should be set when in enum', function () {
        var schema = lounge.schema({
          string: { type: String, enum: ['allowed', 'also allowed'], default: 'allowed' }
        })

        var SModel3 = lounge.model('smodel3', schema)

        var o = new SModel3()

        expect(o.string).to.equal('allowed')
      })
    })

    describe('string transform', function () {
      var SModel
      before(function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          string: {
            type: String,
            stringTransform: function (input) {
              return input.toUpperCase()
            }
          }
        })

        SModel = lounge.model('smodel', schema)
      })

      it('should return lowercase', function () {
        var o = new SModel()

        o.string = 'hello'
        expect(o.string).to.equal('HELLO')
      })

      it('should always be passed a String object and not called if undefined or null', function () {
        var o = new SModel()

        o.string = 123
        expect(o.string).to.equal('123')

        o.string = false
        expect(o.string).to.equal('FALSE')

        o.string = undefined
        expect(o.string).to.not.be.ok

        o.string = null
        expect(o.string).to.not.be.ok
      })
    })

    describe('read only', function () {
      it('should always be default value', function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          string: { type: String, readOnly: true, default: 'permanent value' }
        })

        var SModel = lounge.model('smodel', schema)

        var o = new SModel()
        expect(o.string).to.equal('permanent value')
        o.string = 'hello'
        expect(o.string).to.equal('permanent value')
      })
    })

    describe('minLength', function () {
      it('should not allow empty strings', function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          notEmptyString: { type: String, minLength: 1 }
        })
        var SModel = lounge.model('smodel', schema)

        var o = new SModel()
        o.notEmptyString = ''
        expect(o.notEmptyString).to.equal(undefined)
        o.notEmptyString = '1'
        expect(o.notEmptyString).to.equal('1')
      })
    })

    describe('maxLength', function () {
      it('should allow a max of 5 characters', function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          shortString: { type: String, maxLength: 5 }
        })
        var SModel = lounge.model('smodel', schema)

        var o = new SModel()
        o.shortString = '123456'
        expect(o.shortString).to.equal(undefined)
        o.shortString = '1'
        expect(o.shortString).to.equal('1')
      })
    })

    describe('maxLength + clip', function () {
      it('should clip string to 5 characters', function () {
        lounge = new lounge.Lounge()

        var schema = lounge.schema({
          clippedString: { type: String, maxLength: 5, clip: true }
        })

        var SModel = lounge.model('smodel', schema)

        var o = new SModel()
        o.clippedString = '123456'
        expect(o.clippedString).to.equal('12345')
      })
    })
  })

  describe('Number', function () {
    var SModel

    before(function () {
      lounge = new lounge.Lounge()
      var schema = lounge.schema({
        number: Number,
        minMax: { type: Number, min: 100, max: 200 }
      })

      SModel = lounge.model('SModel', schema)
    })

    describe('typecasting', function () {
      it('should typecast string to number', function () {
        var o = new SModel()

        o.number = '123'
        expect(o.number).to.be.a('number')
        expect(o.number).to.equal(123)

        o.number = o.number + 1
        expect(o.number).to.equal(124)
      })

      it('should NOT typecast boolean to number', function () {
        var o = new SModel()

        o.number = false
        // expect(o.number).to.be.a('number');
        // expect(o.number).to.equal(0);
        expect(o.number).to.equal(undefined)

        o.number = true
        // expect(o.number).to.be.a('number');
        // expect(o.number).to.equal(1);
        expect(o.number).to.equal(undefined)
      })

      it('should not typecast undefined or null', function () {
        var o = new SModel()

        o.number = 1
        expect(o.number).to.be.a('number')
        expect(o.number).to.equal(1)

        o.number = undefined
        expect(o.number).to.equal(undefined)

        o.number = null
        expect(o.number).to.equal(undefined)
      })
    })

    describe('min', function () {
      it('should reject values below min', function () {
        var o = new SModel()

        o.minMax = 0
        expect(o.minMax).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)

        o.minMax = 20
        expect(o.minMax).to.not.be.ok
        expect(o.getErrors().length).to.equal(2)
        expect(o.hasErrors()).to.equal(true)

        o.minMax = 100
        expect(o.minMax).to.equal(100)

        o.minMax = 150
        expect(o.minMax).to.equal(150)
      })
    })

    describe('max', function () {
      it('should reject values above max', function () {
        var o = new SModel()

        o.minMax = 300
        expect(o.minMax).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)

        o.minMax = 200
        expect(o.minMax).to.equal(200)
      })
    })

    describe('numberTransform', function () {
      before(function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          number: {
            type: Number,
            numberTransform: function (number) {
              return Math.round(number)
            }
          }
        })

        SModel = lounge.model('smodel', schema)
      })

      it('should always round number', function () {
        var o = new SModel()

        o.number = 13.2
        expect(o.number).to.equal(13)
      })

      it('should always be passed a Number object and not called if undefined or null', function () {
        var o = new SModel()

        o.number = 'not a number'
        expect(o.number).to.not.be.ok

        o.number = undefined
        expect(o.number).to.not.be.ok

        o.number = null
        expect(o.number).to.not.be.ok
      })
    })
  })

  describe('Boolean', function () {
    describe('typecasting', function () {
      var SModel
      before(function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          boolean: Boolean
        })
        SModel = lounge.model('smodel', schema)
      })

      it('should accept boolean', function () {
        var o = new SModel()
        o.boolean = true
        expect(o.boolean).to.equal(true)

        o.boolean = undefined
        expect(o.boolean).to.equal(undefined)

        o.boolean = false
        expect(o.boolean).to.equal(false)

        delete o.boolean
        expect(o.boolean).to.equal(undefined)
      })

      it('should only typecast specific string values to boolean', function () {
        var o = new SModel()

        o.boolean = '123'
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(true);
        expect(o.boolean).to.equal(undefined)

        o.boolean = '1'
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(true);
        expect(o.boolean).to.equal(undefined)

        o.boolean = ''
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(false);
        expect(o.boolean).to.equal(undefined)

        o.boolean = '0'
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(false);
        expect(o.boolean).to.equal(undefined)

        o.boolean = '-1'
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(false);
        expect(o.boolean).to.equal(undefined)

        o.boolean = 'true'
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(true);
        expect(o.boolean).to.equal(true)

        o.boolean = 'false'
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(false);
        expect(o.boolean).to.equal(false)
      })

      it('should NOT typecast number to boolean', function () {
        var o = new SModel()

        o.boolean = 1
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(true);
        expect(o.boolean).to.equal(undefined)

        o.boolean = 100
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(true);
        expect(o.boolean).to.equal(undefined)

        o.boolean = 0
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(false);
        expect(o.boolean).to.equal(undefined)

        o.boolean = -1
        // expect(o.boolean).to.be.a('boolean');
        // expect(o.boolean).to.equal(false);
        expect(o.boolean).to.equal(undefined)
      })

      it('should not typecast undefined or null', function () {
        var o = new SModel()

        o.boolean = true
        expect(o.boolean).to.be.a('boolean')
        expect(o.boolean).to.equal(true)

        o.boolean = undefined
        expect(o.boolean).to.equal(undefined)

        o.boolean = null
        expect(o.boolean).to.equal(undefined)
      })
    })

    describe('booleanTransform', function () {
      it('should always reverse boolean', function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          boolean: {
            type: Boolean,
            booleanTransform: function (boolean) {
              return !boolean
            }
          }
        })

        var SModel = lounge.model('smodel', schema)
        var o = new SModel()

        o.boolean = true
        expect(o.boolean).to.equal(false)

        o.boolean = false
        expect(o.boolean).to.equal(true)
      })
    })
  })

  describe('Object', function () {
    describe('accessing properties', function () {
      it('should not initialize empty object', function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          anObject: {}
        })
        var SModel = lounge.model('smodel', schema)

        var o = new SModel()

        expect(o.anObject).to.not.be.ok
        o.anObject = {}
        expect(o.anObject).to.be.ok
        expect(o.anObject).to.be.an('object')

        o.anObject.prop = 123
        expect(o.anObject.prop).to.be.ok
        expect(o.anObject.prop).to.equal(123)
      })

      it('should set properties without initializing object when we have default', function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          anObject: { type: Object, default: {} }
        })
        var SModel = lounge.model('smodel', schema)

        var o = new SModel()

        o.anObject.prop = 123
        expect(o.anObject.prop).to.be.ok
        expect(o.anObject.prop).to.equal(123)
      })
    })
  })

  describe('Array', function () {
    describe('construction', function () {
      it('should allow you to pass an array to Model constructor for Array-type fields', function () {
        var schema = lounge.schema({
          strings: [String]
        })

        var AModel1 = lounge.model('amodel1', schema)

        var o = new AModel1({
          strings: ['hello', 'world']
        })

        expect(o.strings.length).to.equal(2)
        expect(o.strings[0]).to.be.a('string')
        expect(o.strings[0]).to.equal('hello')
        expect(o.strings[1]).to.be.a('string')
        expect(o.strings[1]).to.equal('world')
      })

      it('should allow you to pass an array to constructor for Array-type fields within other objects', function () {
        var schema = lounge.schema({
          obj: {
            strings: [String]
          }
        })

        var AModel2 = lounge.model('amodel2', schema)

        var o = new AModel2({
          obj: {
            strings: ['hello', 'world']
          }
        })

        expect(o.obj.strings.length).to.equal(2)
        expect(o.obj.strings[0]).to.be.a('string')
        expect(o.obj.strings[0]).to.equal('hello')
        expect(o.obj.strings[1]).to.be.a('string')
        expect(o.obj.strings[1]).to.equal('world')
      })
    })

    describe('typecasting', function () {
      var SModel
      before(function () {
        lounge = new lounge.Lounge()
        var schema = lounge.schema({
          strings: [String],
          transformedStrings: [{
            type: String,
            stringTransform: function (string) {
              return string.toLowerCase()
            }
          }],
          profiles: [{
            firstName: String,
            lastName: String
          }]
        })

        SModel = lounge.model('smodela', schema)
      })

      it('should typecast all array elements to string', function () {
        var o = new SModel()

        o.strings.push(123)
        expect(o.strings.length).to.equal(1)
        expect(o.strings[0]).to.be.a('string')
        expect(o.strings[0]).to.equal('123')
      })

      it('should typecast Array when set to instance of existing array', function () {
        var o = new SModel()
        o.strings = [123, 321]

        expect(o.strings).to.be.an.instanceof(Array)
        expect(o.strings[0]).to.be.a('string')
        expect(o.strings[0]).to.equal('123')
        expect(o.strings[1]).to.be.a('string')
        expect(o.strings[1]).to.equal('321')
      })

      it('should transform all strings to lowercase', function () {
        var o = new SModel()

        o.transformedStrings.push('HELLO')

        expect(o.transformedStrings.length).to.equal(1)
        expect(o.transformedStrings[0]).to.be.a('string')
        expect(o.transformedStrings[0]).to.equal('hello')
      })

      it('should allow you to set new schema objects', function () {
        var o = new SModel()

        o.profiles = [{
          firstName: 'Joe',
          lastName: 'Smith'
        },
        {
          firstName: 1234,
          lastName: 4321
        }
        ]

        expect(o.profiles.length).to.equal(2)
        expect(o.profiles[0].firstName).to.equal('Joe')
        expect(o.profiles[0].lastName).to.equal('Smith')

        expect(o.profiles[1].firstName).to.be.a('string')
        expect(o.profiles[1].firstName).to.equal('1234')
        expect(o.profiles[1].lastName).to.be.a('string')
        expect(o.profiles[1].lastName).to.equal('4321')

        o.profiles = [{
          firstName: 'Billy',
          lastName: 'Jones'
        }]

        expect(o.profiles.length).to.equal(1)
        expect(o.profiles[0].firstName).to.equal('Billy')
        expect(o.profiles[0].lastName).to.equal('Jones')
      })

      it('should allow you to push() in new schema objects', function () {
        var o = new SModel()

        o.profiles.push({
          firstName: 4321
        })

        expect(o.profiles.length).to.equal(1)
        expect(o.profiles[0].firstName).to.be.a('string')
        expect(o.profiles[0].firstName).to.equal('4321')
      })

      it('should enforce types on existing array elements', function () {
        var o = new SModel()

        o.profiles.push({
          firstName: 4321
        })

        expect(o.profiles.length).to.equal(1)
        expect(o.profiles[0].firstName).to.be.a('string')
        expect(o.profiles[0].firstName).to.equal('4321')

        o.profiles[0].firstName = 1234
        expect(o.profiles[0].firstName).to.be.a('string')
        expect(o.profiles[0].firstName).to.equal('1234')
      })
    })

    describe('unique', function () {
      var UAModel
      before(function () {
        var schema = lounge.schema({
          uniqueStrings: { type: Array, unique: true, arrayType: String },
          unique: { type: Array, unique: true }
        })

        UAModel = lounge.model('uamodel', schema)
      })

      it('should enforce unique values within array with typecasting', function () {
        var o = new UAModel()

        o.uniqueStrings.push(1234)
        expect(o.uniqueStrings.length).to.equal(1)
        o.uniqueStrings.push('1234')
        expect(o.uniqueStrings.length).to.equal(1)
        o.uniqueStrings.push('12345')
        expect(o.uniqueStrings.length).to.equal(2)
      })

      it('should enforce unique values within array without typecasting', function () {
        var o = new UAModel()

        o.unique.push('joe')
        expect(o.unique.length).to.equal(1)
        o.unique.push('joe')
        expect(o.unique.length).to.equal(1)
        o.unique.push('Joe')
        expect(o.unique.length).to.equal(2)
      })
    })

    describe('Array prototype', function () {
      it('concat', function () {
        var schema = lounge.schema({
          verified: [String],
          unverified: [String]
        })

        var APModel = lounge.model('apmodel', schema)

        var o = new APModel()

        o.verified = ['hello']
        o.unverified = ['world']

        var all = o.verified.concat(o.unverified, ['!'])

        expect(all).to.be.an.instanceOf(Array)
        expect(all).to.have.property('toArray')
        expect(all).to.have.lengthOf(3)
        expect(all[0]).to.be.a('string')
        expect(all[0]).to.equal('hello')
        expect(all[1]).to.be.a('string')
        expect(all[1]).to.equal('world')
        expect(all[2]).to.be.a('string')
        expect(all[2]).to.equal('!')
        expect(o.verified).to.have.lengthOf(1)
        expect(o.verified[0]).to.equal('hello')
        expect(o.unverified).to.have.lengthOf(1)
        expect(o.unverified[0]).to.equal('world')
      })
    })

    describe('toArray', function () {
      var ATModel

      before(function () {
        var schema = lounge.schema({
          strings: { type: Array, unique: true, arrayType: String }
        })

        ATModel = lounge.model('atmodel', schema)
      })

      it('should return native Array', function () {
        var o = new ATModel()

        o.strings.push(1234)
        var array = o.strings.toArray()
        expect(array).to.be.an.instanceOf(Array)
        expect(array).to.not.have.property('toArray')
        expect(array[0]).to.be.equal('1234')
      })

      it('should be used for serializing an object to JSON', function () {
        var o = new ATModel()

        o.strings.push(1234)
        var arrayStr = JSON.stringify(o.strings.toArray())
        var jsonArrStr = JSON.stringify(o.strings)
        expect(arrayStr).to.equal(jsonArrStr)
      })
    })
  })

  describe('Date', function () {
    describe('typecasting', function () {
      let SModel

      before(function () {
        var schema = lounge.schema({
          date: Date
        })

        SModel = lounge.model('dtmodel', schema)
      })

      it('should accept Date type', function () {
        var o = new SModel()

        var now = new Date()
        o.date = now
        expect(o.date).to.be.an.instanceof(Date)
        expect(o.date.getMonth()).to.equal(now.getMonth())
        expect(o.date.getDate()).to.equal(now.getDate())
        expect(o.date.getFullYear()).to.equal(now.getFullYear())
      })

      it('should typecast string "May 12, 1983" to date', function () {
        var o = new SModel()

        o.date = 'May 12, 1983'
        expect(o.date).to.be.an.instanceof(Date)
        expect(o.date.getMonth()).to.equal(4)
        expect(o.date.getDate()).to.equal(12)
        expect(o.date.getFullYear()).to.equal(1983)
      })

      it('should typecast string "05/12/1983" to date', function () {
        var o = new SModel()

        o.date = '05/12/1983'
        expect(o.date).to.be.an.instanceof(Date)
        expect(o.date.getMonth()).to.equal(4)
        expect(o.date.getDate()).to.equal(12)
        expect(o.date.getFullYear()).to.equal(1983)
      })

      it('should reject nonsense strings', function () {
        var o = new SModel()

        o.date = 'not a date'
        expect(o.date).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)
      })

      it('should typecast integer timestamp seconds to date', function () {
        var o = new SModel()

        o.date = 582879600
        expect(o.date).to.be.an.instanceof(Date)
        expect(o.date.getTime()).to.equal(582879600000)
        expect(o.date.getMonth()).to.equal(5)
        expect(o.date.getDate()).to.equal(21)
        expect(o.date.getFullYear()).to.equal(1988)
      })

      it('should typecast integer timestamp milliseconds to date', function () {
        var o = new SModel()

        o.date = 582879600000
        expect(o.date).to.be.an.instanceof(Date)
        expect(o.date.getTime()).to.equal(582879600000)
        expect(o.date.getMonth()).to.equal(5)
        expect(o.date.getDate()).to.equal(21)
        expect(o.date.getFullYear()).to.equal(1988)
      })

      it('should reject boolean', function () {
        var o = new SModel()

        o.date = true
        expect(o.date).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)

        o.date = false
        expect(o.date).to.not.be.ok
        expect(o.getErrors().length).to.equal(2)
        expect(o.hasErrors()).to.equal(true)
      })

      it('should reject array', function () {
        var o = new SModel()

        o.date = ['h', 'e', 'l', 'l', 'o']
        expect(o.date).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)
      })

      it('should reject object', function () {
        var o = new SModel()

        o.date = { 0: 'h', 1: 'e', 2: 'l', 3: 'l', 4: 'o' }
        expect(o.date).to.not.be.ok
        expect(o.getErrors().length).to.equal(1)
        expect(o.hasErrors()).to.equal(true)
      })

      it('should set to undefined if set with empty string, null, 0, false, or undefined', function () {
        var o = new SModel()

        o.date = '6/21/1988'
        o.date = ''
        expect(o.date).to.not.be.ok

        o.date = '6/21/1988'
        o.date = null
        expect(o.date).to.not.be.ok

        o.date = '6/21/1988'
        o.date = undefined
        expect(o.date).to.not.be.ok

        expect(o.getErrors().length).to.equal(0)
        expect(o.hasErrors()).to.equal(false)
      })

      // https://github.com/scotthovestadt/node-schema-object/issues/5
      it('should correctly parse dates before 1970', function () {
        var o = new SModel()

        o.date = '03/02/1959'
        expect(o.date.getMonth()).to.equal(2)
        expect(o.date.getDate()).to.equal(2)
        expect(o.date.getFullYear()).to.equal(1959)
      })
    })

    describe('dateTransform', function () {
      let SModel

      before(function () {
        var schema = lounge.schema({
          date: {
            type: Date,
            dateTransform: function (date) {
              date.setFullYear(2000)
              return date
            }
          }
        })

        SModel = lounge.model('dtmodel2', schema)
      })

      it('should always return date with year 2000 but other properties untouched', function () {
        var o = new SModel()

        var date = new Date()
        o.date = date
        expect(o.date.getDay()).to.equal(date.getDay())
        expect(o.date.getMonth()).to.equal(date.getMonth())
        expect(o.date.getFullYear()).to.equal(2000)

        o.date = date.toISOString()
        expect(o.date.getDay()).to.equal(date.getDay())
        expect(o.date.getMonth()).to.equal(date.getMonth())
        expect(o.date.getFullYear()).to.equal(2000)
      })

      it('should always be passed a Date object and not called if undefined or null', function () {
        var o = new SModel()

        o.date = 'not a date'
        expect(o.date).to.not.be.ok

        o.date = false
        expect(o.date).to.not.be.ok

        o.date = undefined
        expect(o.date).to.not.be.ok

        o.date = null
        expect(o.date).to.not.be.ok
      })
    })
  })

  describe('type definition', function () {
    before(function () {
      lounge = new lounge.Lounge()
    })

    it('should allow custom type definition properties', function () {
      var MyString = { type: String, minLength: 5, maxLength: 10 }
      var schema = lounge.schema({
        customString: MyString
      })

      var TModel1 = lounge.model('tmodel1', schema)

      var o = new TModel1()
      o.customString = '1234'
      expect(o.customString).to.not.be.ok
      o.customString = '12345'
      expect(o.customString).to.equal('12345')

      o.customString = '1234567890'
      expect(o.customString).to.equal('1234567890')
    })

    it('should allow custom type definition using properties hash with "type" property', function () {
      var MyString = { type: String, minLength: 5, maxLength: 10 }
      var schema = lounge.schema({
        customString: { type: MyString, maxLength: 15 }
      })

      var TModel2 = lounge.model('tmodel2', schema)

      var o = new TModel2()
      o.customString = '1234'
      expect(o.customString).to.not.be.ok
      o.customString = '12345'
      expect(o.customString).to.equal('12345')

      o.customString = '12345678901'
      expect(o.customString).to.equal('12345678901')

      o.customString = '12345678901234567890'
      expect(o.customString).to.equal('12345678901')
    })

    it('should allow multiple custom type definitions with the same custom type properties object', function () {
      var MyString = { type: String, minLength: 5, maxLength: 10 }
      var schema = lounge.schema({
        string: MyString,
        anotherString: MyString
      })

      var TModel3 = lounge.model('tmodel3', schema)

      var o = new TModel3()

      expect(o.string).to.not.be.ok
      o.string = '1234'
      expect(o.string).to.not.be.ok
      o.string = '12345'
      expect(o.string).to.equal('12345')

      expect(o.anotherString).to.not.be.ok
      o.anotherString = '4321'
      expect(o.anotherString).to.not.be.ok
      o.anotherString = '43210'
      expect(o.anotherString).to.equal('43210')
    })
  })
})
