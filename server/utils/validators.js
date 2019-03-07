const Joi = require("joi");

const baseJoiOptions = {
    abortEarly: false,
    convert: true,
    allowUnknown: true
  };

_workbook_chapter_page_attribtues_joi = Joi.object().keys({
  id: Joi.number()
    .empty("")
    .required(),
  display: Joi.number(),
  position_table: Joi.object().keys({
      table_name: Joi.string().required(),
      id: Joi.number().required()
  }),
  elements: Joi.array()
    .items(Joi.lazy(() => _workbook_chapter_page_joi))
    .description("array of child elements")
});

const _workbook_joi = _workbook_chapter_page_attribtues_joi
  .keys({
    type: Joi.any().valid("workbook").required()
  })
  .unknown(false);

const _workbook_chapter_page_joi = _workbook_chapter_page_attribtues_joi.keys({
    type: Joi.any().valid("workbook", "chapter", "page").required()
}).unknown(false);


module.exports = exports = {};
exports.workbook_chapter_tree_view_joi = _workbook_chapter_page_joi;
exports.baseJoiOptions = baseJoiOptions;

