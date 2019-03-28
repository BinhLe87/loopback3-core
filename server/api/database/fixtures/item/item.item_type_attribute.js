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
  const item_type = 'paragraph';

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //paragraph
    attributeId: ATTRIBUTES.get('content').id, //content
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await __add_common_style_attributes(item_type);
}

async function _generate_attributes_for_image() {
  const item_type = 'image';

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //image
    attributeId: ATTRIBUTES.get('image').id, //image
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await __add_common_style_attributes(item_type);
}

async function _generate_attributes_for_video() {
  const item_type = 'video';

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //video
    attributeId: ATTRIBUTES.get('video').id, //video
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await __add_common_style_attributes(item_type);
}

async function _generate_attributes_for_text_question() {
  const item_type = 'text_question';

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //text_question
    attributeId: ATTRIBUTES.get('question').id, //question
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //text_question
    attributeId: ATTRIBUTES.get('short_answer').id, //short_answer
    display_index: aNumberCounter.increaseByOne()
  });

  await __add_common_style_attributes(item_type);
}

async function _generate_attributes_for_multiple_choice_question() {
  const item_type = 'multiple_choice_question';

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('question').id, //question
    display_index: aNumberCounter.resetIndex().increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('choices').id, //choices
    display_index: aNumberCounter.increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('answers').id, //answers
    display_index: aNumberCounter.increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id, //multiple_choice_question
    attributeId: ATTRIBUTES.get('multiple_choices').id, //multiple_choices
    display_index: aNumberCounter.increaseByOne()
  });

  await __add_common_style_attributes(item_type);
}

async function __add_common_style_attributes(item_type) {
  if (!item_type) return;

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id,
    attributeId: ATTRIBUTES.get('style_padding').id, //style_padding
    display_index: aNumberCounter.increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id,
    attributeId: ATTRIBUTES.get('style_background_colour').id, //style_background_colour
    display_index: aNumberCounter.increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id,
    attributeId: ATTRIBUTES.get('style_text_colour').id, //style_text_colour
    display_index: aNumberCounter.increaseByOne()
  });

  await require('../model.fixtures')(1, 'item_attribute_template', {
    item_typeId: ITEM_TYPES.get(item_type).id,
    attributeId: ATTRIBUTES.get('style_max_width').id, //style_max_width
    display_index: aNumberCounter.increaseByOne()
  });
}
