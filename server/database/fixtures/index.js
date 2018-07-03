'use strict';

const _ = require('lodash');
const faker = require('faker/locale/en_US');


const NUMBER_RECORDS = process.env.NUMBER_RECORDS;
if(_.isEmpty(NUMBER_RECORDS)) {

    throw new Error('Error: Not passed node variable NUMBER_RECORDS')
}

require('./model.fixtures')(NUMBER_RECORDS, 'user', {
    name: faker.name.findName,
    role: faker.random.arrayElement(['admin', 'editor'])
});

// require('./model.fixtures')(NUMBER_RECORDS, 'library', {
//     name: faker.lorem.sentence,
//     createdBy: faker.random.arrayElement(['user', 'system']),
//     owner: faker.random.number({ min: 1, max: 20 })
// });

// require('./model.fixtures')(NUMBER_RECORDS, 'program', {
//     name: faker.lorem.sentence
// });

// require('./many-to-many.fixtures')(NUMBER_RECORDS, 'library', 'program', 'library_program');

// require('./many-to-many.fixtures')(NUMBER_RECORDS, 'user', 'program', 'user_program');

// require('./model.fixtures')(NUMBER_RECORDS, 'workbook', {
//     title: faker.lorem.sentence,
//     author: faker.name.findName,
//     description: faker.lorem.paragraph,
//     price: faker.commerce.price
// });

// require('./many-to-many.fixtures')(NUMBER_RECORDS, 'program', 'workbook', 'program_workbook');

// require('./model.fixtures')(NUMBER_RECORDS, 'chapter', {
//     name: faker.lorem.sentence,
//     is_visible: faker.random.arrayElement([0, 1])
// });

// require('./many-to-many.fixtures')(NUMBER_RECORDS, 'workbook', 'chapter', 'workbook_chapter', {
//     fields: {
//         chapter_display_index: faker.random.number({ min: 1, max: 5 })
//     }
// })

// require('./model.fixtures')(NUMBER_RECORDS, 'page', {
//     name: faker.lorem.words(7)
// });

// require('./many-to-many.fixtures')(NUMBER_RECORDS, 'chapter', 'page', 'chapter_page');

// require('./model.fixtures')(NUMBER_RECORDS, 'item', {
//     name: faker.lorem.sentence,
//     type: faker.random.arrayElement([1, 2, 3, 4, 5])
// });

// require('./many-to-many.fixtures')(NUMBER_RECORDS, 'page', 'item', 'page_item');

// //attribute for item type is formatted text
// require('./model.fixtures')(NUMBER_RECORDS, 'attribute', {
//     name: faker.random.arrayElement(['padding', 'background_color', 'align', 'margin']),
//     attr_type: 'text',
//     is_active: faker.random.arrayElement[0, 1]
// });





