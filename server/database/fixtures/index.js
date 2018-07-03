'use strict';

const _ = require('lodash');
const faker = require('faker/locale/en_US');


const NUMBER_RECORDS = process.env.NUMBER_RECORDS;
if(_.isEmpty(NUMBER_RECORDS)) {

    throw new Error('Error: Not passed node variable NUMBER_RECORDS')
}

require('./model.fixtures')(NUMBER_RECORDS, 'workbook', {
    title: faker.lorem.sentence(),
    author: faker.name.findName(),
    description: faker.lorem.paragraph(),
    price: faker.commerce.price()
});

require('./model.fixtures')(NUMBER_RECORDS, 'chapter', {
    name: faker.lorem.sentence(),
    is_visible: faker.random.arrayElement([0, 1])
});

require('./many-to-many.fixtures')(NUMBER_RECORDS, 'workbook', 'chapter', 'workbook_chapter', {
    fields: {
        chapter_display_index: faker.random.number({ min: 1, max: 5 })
    }
})


