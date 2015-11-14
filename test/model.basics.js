var expect = require('chai').expect;
var lounge = require('../lib');
var Schema = lounge.Schema;

describe('Schema basics', function () {
  beforeEach(function () {
    lounge = new lounge.Lounge(); // recreate it
  });

  describe('Should define a tree instance after instantiation', function () {
    var schema;

    it('Should set the constructor on a property => type definition', function () {
      schema = new Schema({property: String});
      expect(schema.tree.property.Constructor).to.equal(String);
    });

    it('Should set the constructor on a property who\'s type is set on an object descriptor', function () {
      schema = new Schema({property: {type: String}});
      expect(schema.tree.property.Constructor).to.equal(String);
    });

    it('Should define child tree schema', function () {
      schema = new Schema({
        name: String,
        profile: {
          age: Number,
          gender: String,
          parents: {
            mother: {name: String},
            father: {name: String}
          }
        },
        parents: Function
      });


      expect(schema.tree.profile).to.be.an('object', 'Failed to create child tree object .profile');
      expect(schema.tree.profile.parents).to.be.an('object', 'Failed to create child tree object .profile.parents');
      expect(schema.tree.profile.parents.mother).to.be.an('object', 'Failed to create child tree object .profile.parents.mother');
      expect(schema.tree.profile.parents.father).to.be.an('object', 'Failed to create child tree object .profile.parents.father');

      expect(schema.tree.name.Constructor).to.equal(String, 'Failed setting .name on tree');
      expect(schema.tree.profile.age.Constructor).to.equal(Number, 'Failed to create .tree.profile type');
      expect(schema.tree.profile.gender.Constructor).to.equal(String, 'Failed to create .profile.gender type');
      expect(schema.tree.profile.parents.mother.name.Constructor).to.equal(String, 'Failed to create .profile.parents.mother.name type');
      expect(schema.tree.profile.parents.father.name.Constructor).to.equal(String, 'Failed to create .profile.parents.father.name type');

      var Person = lounge.model('Person', schema);
      var joe = new Person({
        parents: function () {
          var parents = this.profile.parents
            , names = [];

          for (var parent in parents) {
            names.push(parents[parent].name)
          }
          return names;
        },
        name: 'Joe',
        profile: {
          age: 22,
          gender: 'male',
          parents: {
            mother: {name: 'Cherie'},
            father: {name: 'Keith'}
          }
        }
      });

      expect(!!~joe.parents().indexOf(joe.profile.parents.mother.name)).to.be.ok;
      expect(!!~joe.parents().indexOf(joe.profile.parents.father.name)).to.be.ok;
    });
  });

});