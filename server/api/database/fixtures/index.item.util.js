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
ATTRIBUTES.set('answers', {
  id: aNumberCounter.increaseByOne(),
  label: 'Answers',
  data_type: 'array'
});
ATTRIBUTES.set('file', {
  id: aNumberCounter.increaseByOne(),
  label: 'File',
  data_type: 'file',
  op_regex: URL_REGX,
  op_required: true
});
ATTRIBUTES.set('image', {
  id: aNumberCounter.increaseByOne(),
  label: 'Image',
  data_type: 'file',
  op_regex: URL_REGX,
  op_required: true
});
ATTRIBUTES.set('video', {
  id: aNumberCounter.increaseByOne(),
  label: 'Video',
  data_type: 'url',
  op_regex: URL_REGX,
  op_required: true
});

exports.ITEM_TYPES = ITEM_TYPES;
exports.ATTRIBUTES = ATTRIBUTES;
exports.NumberCounter = new NumberCounter();
