'use strict';

const _ = require('lodash');
const faker = require('faker/locale/en_US');
const app = require('../../server');


const NUMBER_RECORDS = process.env.NUMBER_RECORDS;
if (_.isEmpty(NUMBER_RECORDS)) {

    throw new Error('Error: Not passed node variable NUMBER_RECORDS')
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
    
    require('./many-to-many.fixtures')(NUMBER_RECORDS, 'library', 'program', 'library_program');
    
    require('./many-to-many.fixtures')(NUMBER_RECORDS, 'user', 'program', 'user_program');
    
    require('./model.fixtures')(NUMBER_RECORDS, 'workbook', {
        title: { func: faker.lorem.words, args: 7 },
        author: faker.name.findName,
        description: faker.lorem.paragraph,
        price: faker.commerce.price
    });
    
    require('./many-to-many.fixtures')(NUMBER_RECORDS, 'program', 'workbook', 'program_workbook');
    
    require('./model.fixtures')(NUMBER_RECORDS, 'chapter', {
        name: { func: faker.lorem.words, args: 7 },
        is_visible: {
            func: faker.random.arrayElement,
            args: [0, 1]
        }
    });
    
    require('./many-to-many.fixtures')(NUMBER_RECORDS, 'workbook', 'chapter', 'workbook_chapter', {
        fields: {
            chapter_display_index: {
                func: faker.random.number,
                args: { min: 1, max: 5 }
            }
        }
    })
    
    require('./model.fixtures')(NUMBER_RECORDS, 'page', {
        name: { func: faker.lorem.words, args: 7 }
    });
    
    require('./many-to-many.fixtures')(NUMBER_RECORDS, 'chapter', 'page', 'chapter_page');
    
    require('./model.fixtures')(NUMBER_RECORDS, 'item', {
        name: { func: faker.lorem.words, args: 7 },
        type: {
            func: faker.random.arrayElement,
            args: [1, 2, 3, 4, 5]
        }
    });
    
    require('./many-to-many.fixtures')(NUMBER_RECORDS, 'page', 'item', 'page_item');
    
    //attribute for item type is formatted text
    require('./model.fixtures')(NUMBER_RECORDS, 'attribute', {
        name: {
            func: faker.random.arrayElement,
            args: ['padding', 'background_color', 'align', 'margin']
        },
        attr_type: 'text',
        is_active: {
            func: faker.random.arrayElement,
            args: [0, 1]
        }
    });
});






