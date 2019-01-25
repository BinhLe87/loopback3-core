const faker = require('faker/locale/en');

const URL_REGX =
  '^(?:([\\w+\\-.]+):)?\\/\\/(?:(\\w+:\\w+)@)?([\\w.-]*)(?::(\\d+))?(.*)$';

module.exports.generate_item_data = async function(
  NUMBER_RECORDS,
  MIN_NUMBER_RECORDS
) {
  await _generate_item_type(NUMBER_RECORDS);

  await _generate_attribute();

  await require('./many-to-many.fixtures')(
    20,
    'item_type',
    'attribute',
    'item_attribute_template',
    {
      fields: {
        display_index: {
          func: faker.random.number,
          args: { min: 0, max: 5 }
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
      args: ['paragraph', 'video', 'image', 'question', ' document']
    },
    label: '${code}'
  });
}

async function _generate_attribute() {
  await require('./model.fixtures')(1, 'attribute', {
    //attribute_id = 1
    code: 'title',
    label: 'Title',
    description: 'title',
    data_type: 'text'
  });

  await require('./model.fixtures')(1, 'attribute', {
    //attribute_id = 2
    code: 'description',
    label: 'Description',
    description: 'body content or description',
    data_type: 'text'
  });

  await require('./model.fixtures')(1, 'attribute', {
    //attribute_id = 3
    code: 'file',
    label: 'File',
    data_type: 'file',
    op_regex: URL_REGX
  });

  await require('./model.fixtures')(1, 'attribute', {
    //attribute_id = 3
    code: 'image',
    label: 'Image',
    data_type: 'file',
    op_regex: URL_REGX
  });

  await require('./model.fixtures')(1, 'attribute', {
    //attribute_id = 4
    code: 'video',
    label: 'Video',
    data_type: 'file',
    op_regex: URL_REGX
  });
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
        value: '<%= %long_text %>'
      }
    ]
  });
}
