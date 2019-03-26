const _ = require('lodash');

module.exports = exports = {};

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

var THEMES = new Map();
THEMES.set('default', {
  id: aNumberCounter.resetIndex().increaseByOne(),
  name: 'theme default',
  description: 'theme default'
});

THEMES.set('theme_1', {
  id: aNumberCounter.increaseByOne(),
  name: 'theme 1',
  description: 'theme 1'
});

var STYLE_ATTRIBUTES = new Map();
STYLE_ATTRIBUTES.set('padding', {
  id: aNumberCounter.resetIndex().increaseByOne(),
  code: 'padding',
  label: 'Padding',
  data_type: 'number',
  default_value: 10
});
STYLE_ATTRIBUTES.set('margin', {
  id: aNumberCounter.increaseByOne(),
  code: 'margin',
  label: 'Margin',
  data_type: 'number',
  default_value: 10
});

exports.THEMES = THEMES;
exports.STYLE_ATTRIBUTES = STYLE_ATTRIBUTES;
exports.NumberCounter = new NumberCounter();
