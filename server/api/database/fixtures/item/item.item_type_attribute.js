const faker = require('faker/locale/en');
const {
  ITEM_TYPES,
  ATTRIBUTES,
  NumberCounter: aNumberCounter
} = require('./item.util');

module.exports.generate_item_type_attribute = async function() {
  await _generate_attributes_for_paragraph();
  await _generate_attributes_for_image();
  await _generate_attributes_for_video();
  await _generate_attributes_for_text_question();
  await _generate_attributes_for_multiple_choice_question();
};

async function _generate_attributes_for_paragraph() {
  // await require('./model.fixtures')(1, 'item_attribute_template', {
  //   item_typeId: ITEM_TYPES.get('paragraph').id, //paragraph
  //   attributeId: ATTRIBUTES.get('title').id, //title
  //   display_index: aNumberCounter.resetIndex().increaseByOne()
  // });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('paragraph').id, //paragraph
    attributeId: ATTRIBUTES.get('content').id, //content
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });
}

async function _generate_attributes_for_image() {
  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('image').id, //image
    attributeId: ATTRIBUTES.get('image').id, //image
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });
}

async function _generate_attributes_for_video() {
  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('video').id, //video
    attributeId: ATTRIBUTES.get('video').id, //video
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });
}

async function _generate_attributes_for_text_question() {
  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('text_question').id, //text_question
    attributeId: ATTRIBUTES.get('question').id, //question
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('text_question').id, //text_question
    attributeId: ATTRIBUTES.get('short_answer').id, //short_answer
    display_index: aNumberCounter.increaseByOne()
  });
}

async function _generate_attributes_for_multiple_choice_question() {
  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('multiple_choice_question').id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('question').id, //question
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('multiple_choice_question').id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('choices').id, //choices
    display_index: aNumberCounter.increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('multiple_choice_question').id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('answers').id, //answers
    display_index: aNumberCounter.increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get('multiple_choice_question').id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('multiple_choices').id, //multiple_choices
    display_index: aNumberCounter.increaseByOne()
  });
}
