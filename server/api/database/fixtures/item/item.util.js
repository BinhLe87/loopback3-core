const _ = require('lodash');

module.exports = exports = {};

const URL_REGX =
  '^(?:([\\w+\\-.]+):)?\\/\\/(?:(\\w+:\\w+)@)?([\\w.-]*)(?::(\\d+))?(.*)$';

class NumberCounter {
  constructor(index) {
    this.index = index || 0;
  }

  increaseByOne() {
    this.index++;
    return this.index;
  }

  resetIndex() {
    this.index = 0;

    return this;
  }
}

var aNumberCounter = new NumberCounter();

var ITEM_TYPES = new Map();
ITEM_TYPES.set('paragraph', {
  id: aNumberCounter.resetIndex().increaseByOne(),
  label: 'paragraph'
});
ITEM_TYPES.set('video', {
  id: aNumberCounter.increaseByOne(),
  label: 'video'
});
ITEM_TYPES.set('image', {
  id: aNumberCounter.increaseByOne(),
  label: 'image'
});
ITEM_TYPES.set('text_question', {
  id: aNumberCounter.increaseByOne(),
  label: 'text_question'
});
ITEM_TYPES.set('multiple_choice_question', {
  id: aNumberCounter.increaseByOne(),
  label: 'multiple_choice_question'
});
ITEM_TYPES.set('yes_no_question', {
  id: aNumberCounter.increaseByOne(),
  label: 'yes_no_question'
});

var ATTRIBUTES = new Map();
ATTRIBUTES.set('title', {
  id: aNumberCounter.resetIndex().increaseByOne(),
  label: 'Title',
  data_type: 'text'
});
ATTRIBUTES.set('content', {
  id: aNumberCounter.increaseByOne(),
  label: 'Content',
  data_type: 'text'
});
ATTRIBUTES.set('question', {
  id: aNumberCounter.increaseByOne(),
  label: 'Question',
  data_type: 'text'
});

ATTRIBUTES.set('answer', {
  id: aNumberCounter.increaseByOne(),
  label: 'Answer',
  data_type: 'text'
});
ATTRIBUTES.set('short_answer', {
  id: aNumberCounter.increaseByOne(),
  label: 'Short Answer',
  data_type: 'boolean'
});

ATTRIBUTES.set('multiple_choices', {
  id: aNumberCounter.increaseByOne(),
  label: 'Multiple Choices',
  data_type: 'boolean'
});
ATTRIBUTES.set('choices', {
  id: aNumberCounter.increaseByOne(),
  label: 'Choices',
  data_type: 'array'
});
ATTRIBUTES.set('answers', {
  id: aNumberCounter.increaseByOne(),
  label: 'Answers',
  data_type: 'array'
});

ATTRIBUTES.set('true', {
  id: aNumberCounter.increaseByOne(),
  label: 'True/False',
  data_type: 'boolean'
});

ATTRIBUTES.set('file', {
  id: aNumberCounter.increaseByOne(),
  label: 'File',
  data_type: 'file',
  op_regex: URL_REGX
});
ATTRIBUTES.set('image', {
  id: aNumberCounter.increaseByOne(),
  label: 'Image',
  data_type: 'file',
  op_regex: URL_REGX
});
ATTRIBUTES.set('video', {
  id: aNumberCounter.increaseByOne(),
  label: 'Video',
  data_type: 'url',
  op_regex: URL_REGX
});
ATTRIBUTES.set('style_padding', {
  id: aNumberCounter.increaseByOne(),
  label: 'Style Padding',
  data_type: 'array',
  op_default: [10, 10, 10, 10]
});
ATTRIBUTES.set('style_max_width', {
  id: aNumberCounter.increaseByOne(),
  label: 'Style Max Width',
  data_type: 'number',
  op_default: 300
});
ATTRIBUTES.set('style_background_colour', {
  id: aNumberCounter.increaseByOne(),
  label: 'Style Background Colour',
  data_type: 'string',
  op_default: 'FFFFFF'
});
ATTRIBUTES.set('style_text_colour', {
  id: aNumberCounter.increaseByOne(),
  label: 'Style Text Colour',
  data_type: 'string',
  op_default: '000000'
});

//Common style attributes
const COMMON_STYLE_ATTRIBUTES = [
  {
    id: ATTRIBUTES.get('style_padding').id, //style_padding
    value: [10, 10, 10, 10]
  },
  {
    id: ATTRIBUTES.get('style_max_width').id, //style_max_width
    value: 300
  },
  {
    id: ATTRIBUTES.get('style_background_colour').id, //style_background_colour
    value: 'FFFFFF'
  },
  {
    id: ATTRIBUTES.get('style_text_colour').id, //style_text_colour
    value: '000000'
  }
];

exports.ITEM_TYPES = ITEM_TYPES;
exports.ATTRIBUTES = ATTRIBUTES;
exports.COMMON_STYLE_ATTRIBUTES = COMMON_STYLE_ATTRIBUTES;
exports.NumberCounter = new NumberCounter();
