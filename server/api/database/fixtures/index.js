'use strict';

const _ = require('lodash');
const faker = require('faker/locale/en_US');
const app = require('../../server');
const path = require('path');
const debug = require('debug')('index_fixtures');

/**
 * Support following random data types:
 * - Case 1: fakerjs pure function
 * - Case 2: fakerjs function with arguments: declared by object has {func, args}
 * - Case 3: refer to other field's value: ${<field_referred_to>}
 * - Case 4: lodash string pattern: example is 'Library <%= %d %>'. Now, just support random %d numberic value
 * - Case 5: primitive data type (string, array, number, etc)
 */
async function generate_dummy_data() {
  const NUMBER_RECORDS = process.env.NUMBER_RECORDS || 200;
  if (NUMBER_RECORDS <= 0) {
    debug('Error: value of NUMBER_RECORDS must be greater than 0');
    throw new Error('Error: value of NUMBER_RECORDS must be greater than 0');
  }

  await require('./model.fixtures')(NUMBER_RECORDS, 'user', {
    password: '$2a$10$yYvIQhagYDSd8GCUsHIW5eXMKAiOfeXdOja1bsXiFFdzJwQvZ.YiS',
    email: 'admin@coachingcloud.com'
  });

  await require('./model.fixtures')(NUMBER_RECORDS, 'library', {
    name: 'Library number <%= %d %>',
    createdBy: {
      func: faker.random.arrayElement,
      args: ['user', 'system']
    },
    userId: {
      func: faker.random.number,
      args: { min: 1, max: 20 }
    }
  });

  await require('./model.fixtures')(NUMBER_RECORDS, 'program', {
    name: { func: faker.lorem.words, args: 7 }
  });

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

  await require('./model.fixtures')(NUMBER_RECORDS, 'workbook', {
    title: { func: faker.lorem.words, args: 7 },
    author: faker.name.findName,
    description: faker.lorem.paragraph,
    price: faker.commerce.price,
    owner_id: {
      func: faker.random.number,
      args: { min: 1, max: NUMBER_RECORDS }
    }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'program',
    'workbook',
    'program_workbook'
  );

  await require('./model.fixtures')(NUMBER_RECORDS, 'chapter', {
    name: { func: faker.lorem.words, args: 7 },
    is_visible: {
      func: faker.random.arrayElement,
      args: [0, 1]
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

  await require('./model.fixtures')(NUMBER_RECORDS, 'page', {
    name: { func: faker.lorem.words, args: 7 }
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'chapter',
    'page',
    'chapter_page'
  );

  await require('./model.fixtures')(NUMBER_RECORDS, 'item_type', {
    code: {
      func: faker.random.arrayElement,
      args: ['text', 'video', 'audio', 'question', 'html', 'experience_points']
    },
    label: {
      func: faker.random.arrayElement,
      args: ['text', 'video', 'audio', 'question', 'html', 'experience_points']
    },
    is_active: {
      func: faker.random.arrayElement,
      args: [0, 1]
    }
  });

  await require('./model.fixtures')(NUMBER_RECORDS, 'item', {
    name: 'item_video',
    item_typeId: {
      func: faker.random.arrayElement,
      args: [1, 2, 3, 4, 5]
    },
    is_public: 1,
    item_attributes: [
      { id: 1, values: [{ value: 'title' }] },
      {
        id: 3,
        values: [{ value: 'https://coachingcloud.com/img/platform-intro.png' }]
      }
    ]
  });

  await require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'page',
    'item',
    'page_item'
  );

  //attribute for item type is formatted text
  await require('./model.fixtures')(NUMBER_RECORDS, 'attribute', {
    code: {
      func: faker.random.arrayElement,
      args: ['padding', 'background_color', 'align', 'margin']
    },
    label: '${code}',
    data_type: 'string',
    is_active: {
      func: faker.random.arrayElement,
      args: [0, 1]
    },
    op_required: {
      func: faker.random.arrayElement,
      args: [0, 1]
    }
  });

  await require('./model.fixtures')(1, 'attribute', {
    code: {
      func: faker.random.arrayElement,
      args: ['url']
    },
    label: {
      func: faker.random.arrayElement,
      args: ['url']
    },
    data_type: 'string',
    is_active: {
      func: faker.random.arrayElement,
      args: [1]
    },
    op_required: {
      func: faker.random.arrayElement,
      args: [0]
    },
    op_regex: {
      func: faker.random.arrayElement,
      args: [
        '(((ftp|http|https)://)|(/)|(../))(w+:{0,1}w*@)?(S+)(:[0-9]+)?(/|/([w#!:.?+=&%@!-/]))?'
      ]
    }
  });

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
