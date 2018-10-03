'use strict';

const _ = require('lodash');
const faker = require('faker/locale/en');
const app = require('../../server');
const path = require('path');
const debug = require('debug')('index_fixtures');

/**
 * Support following random data types:
 * - Case 1: fakerjs pure function
 * - Case 2: fakerjs function with arguments: declared by object has {func, args}
 * - Case 3: refer to other field's value: '${<field_referred_to>}'   (place in single quote mark)
 * - Case 4: lodash string pattern: example is 'Library <%= %d %>'. Now, just support random %d numberic value
 * - Case 5: primitive data type (string, array, number, etc)
 *
 *
 * @param {number} [number_records] the number of records needs to generate dummy data
 */
async function generate_dummy_data(number_records) {
  const NUMBER_RECORDS = number_records || process.env.NUMBER_RECORDS || 200;
  const MIN_NUMBER_RECORDS = Math.floor(NUMBER_RECORDS / 6.0); //used for models have a few manual input data

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
      args: { min: 200, max: 210 }
    }
  });

  await require('./model.fixtures')(NUMBER_RECORDS, 'program', {
    name: { func: faker.lorem.words, args: 7 }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'library',
    'workbook',
    'library_workbook',
    {
      ForeignKeySourceModel: 'workbook_owner_id',
      ForeignKeyDestinationModel: 'workbookId',
      fields: {
        workbook_owner_type: 'library'
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
    NUMBER_RECORDS,
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
    owner_id: {
      func: faker.random.number,
      args: { min: 1, max: NUMBER_RECORDS }
    },
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
        chapter_display_index: {
          func: faker.random.number,
          args: { min: 1, max: 5 }
        }
      }
    }
  );

  await require('./model.fixtures')(MIN_NUMBER_RECORDS, 'page', {
    title: {
      func: faker.random.arrayElement,
      args: require('./_sample.data').page_title
    }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'chapter',
    'page',
    'chapter_page',
    {
      fields: {
        page_display_index: {
          func: faker.random.number,
          args: { min: 1, max: 5 }
        }
      }
    }
  );

  await require('./index.item').generate_item_data(
    NUMBER_RECORDS,
    MIN_NUMBER_RECORDS
  );

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'page',
    'item',
    'page_item'
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
    NUMBER_RECORDS,
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
