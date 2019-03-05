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
ITEM_TYPES.set('question', {
  id: aNumberCounter.increaseByOne(),
  label: 'question'
});

var ATTRIBUTES = new Map();
ATTRIBUTES.set('title', {
  id: aNumberCounter.resetIndex().increaseByOne(),
  label: 'Title',
  data_type: 'text'
});
ATTRIBUTES.set('description', {
  id: aNumberCounter.increaseByOne(),
  label: 'Description',
  data_type: 'text'
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
  data_type: 'file',
  op_regex: URL_REGX
});

exports.ITEM_TYPES = ITEM_TYPES;
exports.ATTRIBUTES = ATTRIBUTES;
exports.NumberCounter = new NumberCounter();
