const Joi = require('joi');

module.exports = exports = {};

exports.baseJoiOptions = {
  abortEarly: false,
  convert: true,
  allowUnknown: true
};

_workbook_chapter_page_attribtues_joi = Joi.object().keys({
  id: Joi.number()
    .empty('')
    .required(),
  display: Joi.number(),
  position_table: Joi.object().keys({
    table_name: Joi.string().required(),
    id: Joi.number().required()
  }),
  elements: Joi.array()
    .items(Joi.lazy(() => workbook_chapter_page_item_joi))
    .description('array of child elements')
});

const _workbook_joi = _workbook_chapter_page_attribtues_joi
  .keys({
    type: Joi.any()
      .valid('workbook')
      .required()
  })
  .unknown(false);

const workbook_chapter_page_item_joi = _workbook_chapter_page_attribtues_joi
  .keys({
    type: Joi.any()
      .valid('workbook', 'chapter', 'page', 'item')
      .required()
  })
  .unknown(false);

exports.workbook_chapter_page_item_joi = workbook_chapter_page_item_joi;
