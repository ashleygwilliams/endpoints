const relate = require('./relate');

module.exports = function (model, opts) {
  if (!opts) {
    opts = {};
  }
  var links = {};
  var linkWithoutIncludes = opts.linkWithoutInclude || [];
  var linkWithIncludes = opts.linkWithInclude || [];

  // Link relations that were not explictly included. For example,
  // a record in a database of employees might look like this:
  // {
  //   "id": "1",
  //   "name": "tyler",
  //   "position_id": "1"
  // }
  // The output of that record in json-api notation would be:
  // {
  //   "id": "1",
  //   "name": "tyler",
  //   "links": {
  //     "type": "position",
  //     "id": "1"
  //   }
  // }
  linkWithoutIncludes.reduce(function (result, relationName) {
    var relation = model.related(relationName);
    var relatedData = relation.relatedData;
    var fkey = relatedData.foreignKey;
    var id = model.get(fkey);
    var type = relatedData.target.typeName;
    var link = {
      type: relatedData.target.typeName,
      id: id
    };
    if (id) {
      link.href = '/' + type + '/' + id;
    }
    result[relationName] = link;
    return result;
  }, links);

  // Link relations that were explictly included, adding the associated
  // resources to the top level "linked" object
  linkWithIncludes.reduce(function (result, relationName) {
    var related = relate(model, relationName);
    var link = {
      type: related.type
    };
    if (Array.isArray(related.models) || Array.isArray(related)) {
      // if the related is an array, we have a hasMany relation
      // and should serialize to an `ids` key rather than the `id`
      // key
      link.ids = related.reduce(function (result, model) {
        var id = model.get('id');
        // exclude nulls and duplicates, the point of a links
        // entry is to provide linkage to related resources,
        // not a full mapping of the underlying data
        if (id && result.indexOf(id) === -1) {
          result.push(id);
        }
        return result;
      }, []);
    } else {
      // for singular resources, store the id under `id`
      link.id = related.get('id') || null;
    }
    result[relationName] = link;
    return result;
  }, links);

  return links;
};
