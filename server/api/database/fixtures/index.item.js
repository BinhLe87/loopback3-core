const faker = require('faker/locale/en');

module.exports.generate_item_data = async function(
  NUMBER_RECORDS,
  MIN_NUMBER_RECORDS
) {
  await _generate_item_type(NUMBER_RECORDS);

  await _generate_attribute();

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'item_type',
    'attribute',
    'item_attribute_template',
    {
      fields: {
        display_index: {
          func: faker.random.number,
          args: { min: 1, max: 5 }
        }
      }
    }
  );

  await _generate_item(NUMBER_RECORDS);
};

async function _generate_item_type(NUMBER_RECORDS) {
  await require('./model.fixtures')(NUMBER_RECORDS, 'item_type', {
    //item_type_id = 1
    code: {
      func: faker.random.arrayElement,
      args: ['paragraph']
    },
    label: '${code}'
  });
}

async function _generate_attribute() {
  await require('./model.fixtures')(1, 'attribute', {
    //attribute_id = 1
    code: 'content',
    label: '${code}',
    description: 'entire content of item type is text/paragraph',
    data_type: 'string'
  });

  await require('./model.fixtures')(1, 'attribute', {
    //attribute_id = 2
    code: 'url',
    label: 'url',
    data_type: 'string',
    op_regex:
      '(((ftp|http|https)://)|(/)|(../))(w+:{0,1}w*@)?(S+)(:[0-9]+)?(/|/([w#!:.?+=&%@!-/]))?'
  });
}

async function _generate_item(NUMBER_RECORDS) {
  await require('./model.fixtures')(NUMBER_RECORDS, 'item', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    },
    item_typeId: 1,
    item_attributes: `[
            {
                "id": 1,
                "values": "<%= %long_text %>"
            }
        ]`
  });
}
