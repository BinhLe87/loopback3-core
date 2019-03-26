'use strict';

const _ = require('lodash');
const faker = require('faker/locale/en');
const app = require('../../server');
const path = require('path');
const debug = require('debug')('index_fixtures');

/**
 * Support following random data types:
 * - Case 1: fakerjs pure function. Ex: faker.lorem.paragraph
 * - Case 2: fakerjs function with arguments: declared by object has {func, args}
 * - Case 3: refer to other field's value: '${<field_referred_to>}'   (place in single quote mark)
 * - Case 4: lodash string pattern: example is 'Library <%= %d %>'. Now, just support random %d, %long_text
 * - Case 5: primitive data type (string, array, number, etc)
 *
 *
 * @param {number} [number_records] the number of records needs to generate dummy data
 */
async function generate_dummy_data(number_records) {
  const NUMBER_RECORDS = _.toInteger(
    number_records || process.env.NUMBER_RECORDS || 200
  );
  const MIN_NUMBER_RECORDS = NUMBER_RECORDS; //used for models have a few manual input data

  if (NUMBER_RECORDS <= 0) {
    debug('Error: value of NUMBER_RECORDS must be greater than 0');
    throw new Error('Error: value of NUMBER_RECORDS must be greater than 0');
  }

  await require('./model.fixtures')(MIN_NUMBER_RECORDS, 'library', {
    name: 'Library number <%= %d %>',
    createdBy: {
      func: faker.random.arrayElement,
      args: ['user', 'system']
    },
    userId: {
      func: faker.random.number,
      args: { min: 1, max: 5 }
    }
  });

  await require('./model.fixtures')(NUMBER_RECORDS, 'program', {
    name: { func: faker.lorem.words, args: 7 }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'library',
    'workbook',
    'workbook_owner',
    {
      ForeignKeySourceModel: 'workbook_owner_id',
      ForeignKeyDestinationModel: 'workbookId',
      fields: {
        workbook_owner_type: 'library'
      }
    }
  );

  await require('./many-to-many.fixtures')(
    10,
    'user',
    'workbook',
    'workbook_owner',
    {
      ForeignKeySourceModel: 'workbook_owner_id',
      ForeignKeyDestinationModel: 'workbookId',
      fields: {
        workbook_owner_type: 'user'
      }
    }
  );

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'library',
    'program',
    'library_program'
  );

  await require('./many-to-many.fixtures')(
    10,
    'user',
    'program',
    'user_program'
  );

  await require('./model.fixtures')(MIN_NUMBER_RECORDS, 'workbook', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').workbook_title
    },
    description: faker.lorem.paragraph,
    price: faker.commerce.price,
    image_url: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').workbook_image_url
    }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'program',
    'workbook',
    'program_workbook'
  );

  await require('./model.fixtures')(MIN_NUMBER_RECORDS, 'chapter', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').chapter_title
    }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'workbook',
    'chapter',
    'workbook_chapter',
    {
      fields: {
        display_index: {
          func: faker.random.number,
          args: { min: 0, max: 5 }
        }
      },
      maxIdSourceModel: Math.floor(NUMBER_RECORDS / 40.0),
      maxIdDestinationModel: Math.floor(NUMBER_RECORDS / 10.0)
    }
  );

  await require('./model.fixtures')(MIN_NUMBER_RECORDS, 'page', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS * 4,
    'chapter',
    'page',
    'chapter_page',
    {
      fields: {
        display_index: {
          func: faker.random.number,
          args: { min: 1, max: 5 }
        }
      },
      maxIdSourceModel: Math.floor(NUMBER_RECORDS / 10.0),
      maxIdDestinationModel: Math.floor(NUMBER_RECORDS / 5.0)
    }
  );

  await require('./item/item.index').generate_item_data(
    NUMBER_RECORDS,
    MIN_NUMBER_RECORDS
  );

  await require('./style/style.index').generate_style_data(
    NUMBER_RECORDS,
    MIN_NUMBER_RECORDS
  );

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS * 10,
    'page',
    'item',
    'page_item',
    {
      maxIdSourceModel: Math.floor(NUMBER_RECORDS / 5.0)
    }
  );

  await require('./model.fixtures')(NUMBER_RECORDS, 'comment', {
    message: { func: faker.lorem.words, args: 30 },
    comment_owner: {
      func: faker.random.number,
      args: { min: 1, max: NUMBER_RECORDS }
    }
  });

  await require('./model.fixtures')(NUMBER_RECORDS, 'comment_reply', {
    message: { func: faker.lorem.words, args: 30 },
    parent: {
      func: faker.random.number,
      args: { min: 1, max: NUMBER_RECORDS }
    },
    comment_owner: {
      func: faker.random.number,
      args: { min: 1, max: NUMBER_RECORDS }
    }
  });

  await require('./model.fixtures')(20, 'user_note', {
    content: { func: faker.lorem.words, args: 30 },
    userId: {
      func: faker.random.number,
      args: { min: 1, max: 10 }
    },
    noteableId: {
      func: faker.random.number,
      args: { min: 1, max: 10 }
    },
    noteableType: {
      func: faker.random.arrayElement,
      args: ['page', 'workbook']
    }
  });

  await require('./model.fixtures')(3, 'user_setting', {
    code: {
      func: faker.random.arrayElement,
      args: ['auto_share_workbook']
    },
    is_active: {
      func: faker.random.arrayElement,
      args: [0, 1]
    },
    userId: {
      func: faker.random.number,
      args: { min: 1, max: 3 }
    },
    value: {
      func: faker.random.arrayElement,
      args: ['[1]', '[1,2]', '[2,3]']
    }
  });

  await require('./many-to-many.fixtures')(
    10,
    'user',
    'workbook',
    'workbook_share',
    {
      fields: {
        shared_by: {
          func: faker.random.number,
          args: { min: 1, max: 5 }
        }
      }
    }
  );
}

module.exports = generate_dummy_data;
