const faker = require('faker/locale/en');
const {
  ITEM_TYPES,
  ATTRIBUTES,
  NumberCounter: aNumberCounter
} = require('./index.item.util');

module.exports.generate_item_type_attribute = async function() {
  await _generate_attributes_for_paragraph();
};

async function _generate_attributes_for_paragraph() {
  await require('./model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('paragraph').id, //paragraph
    attributeId: ATTRIBUTES.get('title').id, //title
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await require('./model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('paragraph').id, //paragraph
    attributeId: ATTRIBUTES.get('description').id, //description
    display_index: aNumberCounter.increaseByOne()
  });
}
