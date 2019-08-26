'use strict';
const app = require('../../../server');

exports = module.exports = {};

exports.getAttributesByItemtypeId = function getAttributesByItemtypeId(
  itemTypeId
) {
  return new Promise((resolve, reject) => {
    //query list of attributes as a template of this itemTypeId
    var itemTypeModel = app.models.item_type;
    itemTypeModel.findOne(
      { where: { id: itemTypeId }, include: { relation: 'attributes' } },
      function(err, doc) {
        if (err) {
          return reject(err);
        }

        if (_.isEmpty(doc)) {
          return reject(new Error(`Not found item type has id ${itemTypeId}`));
        }

        resolve(doc.toJSON().attributes);
      }
    );
  });
};
