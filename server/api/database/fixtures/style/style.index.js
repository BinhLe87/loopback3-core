const faker = require('faker/locale/en');
const _ = require('lodash');
const { THEMES, STYLE_ATTRIBUTES } = require('./style.util');

module.exports = exports = {};

exports.generate_style_data = async function(
  NUMBER_RECORDS,
  MIN_NUMBER_RECORDS
) {
  //It matters the order of invoking methods
  await _generate_themes();

  await _generate_style_attributes();

  await _generate_style_theme_attributes();

  await _generate_style_theme_owners(NUMBER_RECORDS);
};

async function _generate_themes() {
  for (var [theme_code, theme_values] of THEMES) {
    await require('../model.fixtures')(1, 'style_theme', {
      name: _.get(theme_values, 'name', theme_code),
      description: _.get(theme_values, 'description', theme_code)
    });
  }
}

async function _generate_style_attributes() {
  for (var [attribute_code, attribute_values] of STYLE_ATTRIBUTES) {
    await require('../model.fixtures')(1, 'style_attribute', {
      code: attribute_code,
      label: _.get(attribute_values, 'label', '${code}'),
      description: _.get(attribute_values, 'description'),
      data_type: _.get(attribute_values, 'data_type'),
      default_value: _.get(attribute_values, 'default_value')
    });
  }
}

//---------------STYLE_THEME_ATTRIBUTES-------------------------------------------------
async function _generate_style_theme_attributes() {
  await __generate_attributes_for_theme_default();
  await __generate_attributes_for_theme_1();
}

async function __generate_attributes_for_theme_default() {
  await require('../model.fixtures')(1, 'style_theme_attribute', {
    style_themeId: THEMES.get('default').id, //theme `default`
    style_attributeId: STYLE_ATTRIBUTES.get('padding').id, //padding
    value: 20
  });

  await require('../model.fixtures')(1, 'style_theme_attribute', {
    style_themeId: THEMES.get('default').id, //theme `default`
    style_attributeId: STYLE_ATTRIBUTES.get('margin').id, //margin
    value: 20
  });
}

async function __generate_attributes_for_theme_1() {
  await require('../model.fixtures')(1, 'style_theme_attribute', {
    style_themeId: THEMES.get('theme_1').id, //theme `1`
    style_attributeId: STYLE_ATTRIBUTES.get('padding').id, //padding
    value: 15
  });
}

//---------------STYLE_THEME_OWNER------------------------------------------------------
async function _generate_style_theme_owners(NUMBER_RECORDS) {
  await require('../many-to-many.fixtures')(
    NUMBER_RECORDS,
    'workbook',
    'style_theme',
    'style_theme_owner',
    {
      ForeignKeySourceModel: 'theme_owner_id',
      ForeignKeyDestinationModel: 'style_themeId',
      fields: {
        theme_owner_type: 'workbook'
      }
    }
  );
}
