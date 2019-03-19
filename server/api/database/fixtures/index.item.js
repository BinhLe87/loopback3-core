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
  const NUMBER_ITEM_TYPES = 3.0; //REMEMBER CHANGE EXACTLY NUMBER OF ITEM TYPES WILL GENERATED.
  const NUMBER_RECORDS_EACH_TYPE = Math.floor(
    NUMBER_RECORDS / NUMBER_ITEM_TYPES
  );

  //`paragraph` item
  await require('./model.fixtures')(NUMBER_RECORDS_EACH_TYPE, 'item', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    },
    item_typeId: ITEM_TYPES.get('paragraph').id,
    item_attributes: [
      // {
      //   id: ATTRIBUTES.get('title').id,
      //   value: {
      //     func: faker.random.arrayElement,
      //     args: require('./_sample.data').workbook_title
      //   }
      // },
      {
        id: ATTRIBUTES.get('content').id,
        value: '<%= %long_text %>'
      }
    ]
  });

  //`image` item
  await require('./model.fixtures')(NUMBER_RECORDS_EACH_TYPE, 'item', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    },
    item_typeId: ITEM_TYPES.get('image').id,
    item_attributes: [
      {
        id: ATTRIBUTES.get('image').id,
        value: {
          func: faker.random.arrayElement,
          args: require('./_sample.data').item_image_url
        }
      }
    ]
  });

  //`video` item
  await require('./model.fixtures')(NUMBER_RECORDS_EACH_TYPE, 'item', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    },
    item_typeId: ITEM_TYPES.get('video').id,
    item_attributes: [
      {
        id: ATTRIBUTES.get('video').id,
        value: {
          func: faker.random.arrayElement,
          args: require('./_sample.data').video_url
        }
      }
    ]
  });

  //`text_question` item
  await require('./model.fixtures')(NUMBER_RECORDS_EACH_TYPE, 'item', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    },
    item_typeId: ITEM_TYPES.get('text_question').id,
    item_attributes: [
      {
        id: ATTRIBUTES.get('question').id,
        value: {
          func: faker.random.arrayElement,
          args: require('./_sample.data').item_question
        }
      },
      {
        id: ATTRIBUTES.get('shortAnswer').id,
        value: {
          func: faker.random.arrayElement,
          args: [true, false]
        }
      }
    ]
  });

  //`multiple_choice_question` item
  await require('./model.fixtures')(NUMBER_RECORDS_EACH_TYPE, 'item', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    },
    item_typeId: ITEM_TYPES.get('multiple_choice_question').id,
    item_attributes: [
      {
        id: ATTRIBUTES.get('question').id,
        value: {
          func: faker.random.arrayElement,
          args: require('./_sample.data').item_question
        }
      },
      {
        id: ATTRIBUTES.get('answers').id,
        value: _.values(require('./_sample.data').item_answer).join('\n')
      },
      {
        id: ATTRIBUTES.get('multiple_choices').id,
        value: {
          func: faker.random.arrayElement,
          args: [true, false]
        }
      }
    ]
  });
}
