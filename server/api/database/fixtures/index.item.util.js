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

const ITEM_TYPES = {
  paragraph: {
    id: aNumberCounter.resetIndex().increaseByOne(),
    label: 'paragraph'
  },
  video: {
    id: aNumberCounter.increaseByOne(),
    label: 'video'
  },
  image: {
    id: aNumberCounter.increaseByOne(),
    label: 'image'
  },
  question: {
    id: aNumberCounter.increaseByOne(),
    label: 'question'
  }
};

const ATTRIBUTES = {
  title: {
    id: aNumberCounter.resetIndex().increaseByOne(),
    label: 'Title',
    data_type: 'text'
  },
  description: {
    id: aNumberCounter.increaseByOne(),
    label: 'Description',
    data_type: 'text'
  },
  file: {
    id: aNumberCounter.increaseByOne(),
    label: 'File',
    data_type: 'file',
    op_regex: URL_REGX
  },
  image: {
    id: aNumberCounter.increaseByOne(),
    label: 'Image',
    data_type: 'file',
    op_regex: URL_REGX
  },
  video: {
    id: aNumberCounter.increaseByOne(),
    label: 'Video',
    data_type: 'file',
    op_regex: URL_REGX
  }
};

exports.ITEM_TYPES = ITEM_TYPES;
exports.ATTRIBUTES = ATTRIBUTES;
exports.NumberCounter = new NumberCounter();
