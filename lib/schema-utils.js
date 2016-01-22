var _ = require('lodash');
var inflection = require('inflection');
var traverse = require('traverse');

/*!
 *
 * @param ctx
 * @returns {string}
 */
function getPathFromContext(ctx) {
  var path = ctx.path.join('.');

  // check if we specifically set type
  var lastElement = ctx.path[ctx.path.length - 1];
  if (lastElement) {
    var lev = lastElement.toLowerCase();
    if (lev === 'type') {
      path = ctx.path.slice(0, ctx.path.length - 1).join('.');
    }
  }

  // check if in array
  var reg = new RegExp('^\\d+$');
  var lastPath = path.substring(path.lastIndexOf('.') + 1);
  if (lastPath && reg.test(lastPath)) {
    path = path.substring(0, path.lastIndexOf('.'));
  }

  return path;
}

var Model;
exports.getRefs = function (descriptor) {
  if (!Model) {
    Model = require('./model');
  }

  var refs = [];
  traverse(descriptor).forEach(function (obj) {
    var ctx = this;
    if (obj && ((obj.__proto__ === Model && obj.modelName) || (obj.type === Model && obj.modelName))) {
      var path = getPathFromContext(ctx);

      refs.push({
        path: path,
        ref: obj.modelName
      });
    }
  });

  refs = _.compact(refs);

  return refs;
};

exports.getIndexes = function (descriptor) {
  var inds = [];

  traverse(descriptor).forEach(function (obj) {
    var ctx = this;
    if (obj && obj.index === true && (obj.type || obj.Type)) {
      var t = obj.type || obj.Type;
      if (t === String || t === Number) {
        var path = getPathFromContext(ctx);
        var name = obj.indexName;
        if (!name) {
          name = ctx.key;
          var reg = new RegExp('^\\d+$');
          if (reg.test(name)) {
            name = ctx.path[ctx.path.length - 2];
          }
          name = inflection.singularize(name);
        }

        inds.push({
          path: path,
          name: name
        });
      }
    }
  });

  inds = _.compact(inds);
  return inds;
};