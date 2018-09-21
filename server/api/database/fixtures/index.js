'use strict';

const _ = require('lodash');
const faker = require('faker/locale/en_US');
const app = require('../../server');
const path = require('path');
const debug = require('debug')('index_fixtures');

const NUMBER_RECORDS = process.env.NUMBER_RECORDS || 200;
if (NUMBER_RECORDS <= 0) {
  debug('Error: value of NUMBER_RECORDS must be greater than 0');
  throw new Error('Error: value of NUMBER_RECORDS must be greater than 0');
}

app.on('booted', function() {
  require('./model.fixtures')(NUMBER_RECORDS, 'user', {
    name: faker.name.findName,
    role: {
      func: faker.random.arrayElement,
      args: ['admin', 'editor']
    }
  });

  require('./model.fixtures')(NUMBER_RECORDS, 'library', {
    name: { func: faker.lorem.words, args: 7 },
    createdBy: {
      func: faker.random.arrayElement,
      args: ['user', 'system']
    },
    owner: {
      func: faker.random.number,
      args: { min: 1, max: 20 }
    }
  });

  require('./model.fixtures')(NUMBER_RECORDS, 'program', {
    name: { func: faker.lorem.words, args: 7 }
  });

  require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'library',
    'program',
    'library_program'
  );

  require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'user',
    'program',
    'user_program'
  );

  require('./model.fixtures')(NUMBER_RECORDS, 'workbook', {
    title: { func: faker.lorem.words, args: 7 },
    author: faker.name.findName,
    description: faker.lorem.paragraph,
    price: faker.commerce.price,
    owner_id: {
      func: faker.random.number,
      args: { min: 1, max: NUMBER_RECORDS }
    }
  });

  require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'program',
    'workbook',
    'program_workbook'
  );

  require('./model.fixtures')(NUMBER_RECORDS, 'chapter', {
    name: { func: faker.lorem.words, args: 7 },
    is_visible: {
      func: faker.random.arrayElement,
      args: [0, 1]
    }
  });

  require('./many-to-many.fixtures')(
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

  require('./model.fixtures')(NUMBER_RECORDS, 'page', {
    name: { func: faker.lorem.words, args: 7 }
  });

  require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'chapter',
    'page',
    'chapter_page'
  );

  require('./model.fixtures')(NUMBER_RECORDS, 'item', {
    name: { func: faker.lorem.words, args: 7 },
    item_typeId: {
      func: faker.random.arrayElement,
      args: [1, 2, 3, 4, 5]
    }
  });

  require('./many-to-many.fixtures')(
    NUMBER_RECORDS,
    'page',
    'item',
    'page_item'
  );

  require('./model.fixtures')(NUMBER_RECORDS, 'item_type', {
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

  //attribute for item type is formatted text
  require('./model.fixtures')(NUMBER_RECORDS, 'attribute', {
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

  require('./model.fixtures')(1, 'attribute', {
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

  require('./many-to-many.fixtures')(
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

  require('./model.fixtures')(NUMBER_RECORDS, 'comment', {
    message: { func: faker.lorem.words, args: 30 },
    comment_owner: {
      func: faker.random.number,
      args: { min: 1, max: NUMBER_RECORDS }
    }
  });

  require('./model.fixtures')(NUMBER_RECORDS, 'comment_reply', {
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

  require('./model.fixtures')(20, 'user_note', {
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

  require('./model.fixtures')(3, 'user_setting', {
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

  require('./many-to-many.fixtures')(
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
});
