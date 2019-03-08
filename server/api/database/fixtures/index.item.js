const faker = require('faker/locale/en');
const {
  generate_item_type_attribute
} = require('./index.item.item_type_attribute');
const _ = require('lodash');
const { ITEM_TYPES, ATTRIBUTES } = require('./index.item.util');

module.exports = exports = {};

exports.generate_item_data = async function(
  NUMBER_RECORDS,
  MIN_NUMBER_RECORDS
) {
  //It matters the order of invoking methods
  await _generate_item_types();

  await _generate_attributes();

  await generate_item_type_attribute();

  await _generate_item(NUMBER_RECORDS);
};

async function _generate_item_types() {
  for (var [item_type_code, item_type_values] of ITEM_TYPES) {
    await require('./model.fixtures')(1, 'item_type', {
      code: item_type_code,
      label: _.get(item_type_values, 'label', '${code}')
    });
  }
}

async function _generate_attributes() {
  for (var [attribute_code, attribute_values] of ATTRIBUTES) {
    await require('./model.fixtures')(1, 'attribute', {
      code: attribute_code,
      label: _.get(attribute_values, 'label', '${code}'),
      description: _.get(attribute_values, 'description'),
      data_type: _.get(attribute_values, 'data_type')
    });
  }
}

async function _generate_item(NUMBER_RECORDS) {
  await require('./model.fixtures')(NUMBER_RECORDS, 'item', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    },
    item_typeId: 1,
    item_attributes: [
      {
        id: 1,
        value: {
          func: faker.random.arrayElement,
          args: require('./_sample.data').workbook_title
        }
      },
      {
        id: 2,
        value: '<%= %long_text %>'
      }
    ]
  });
}
