'use strict';

const assert = require('assert');
const _ = require('lodash');
const faker = require('faker');
const moment = require('moment');
const Joi = require('joi');

process.env.SERVICE_NAME= 'apc';
process.env.NODE_ENV = 'development';

const url_params_joi = Joi.alternatives().try(
    Joi.object().keys({
        model_scope: Joi.string().valid('workbooks').required(),
        model_scope_id: Joi.any().required(),
        model_from: Joi.string().valid('chapters').required(),
        model_from_id: Joi.any().required(),
        action: Joi.string().valid('move', 'swap').required(),
        relation_model_name: Joi.string().default('workbook_chapter'),
        model_scope_foreign_key: Joi.string().default('workbookId'),
        model_from_foreign_key: Joi.string().default('chapterId'),
        model_to_id: Joi.number().when('action', {
            is: 'swap',
            then: Joi.required()
        })
    }).unknown(),
    Joi.object().keys({
        model_scope: Joi.string().valid('chapters').required(),
        model_scope_id: Joi.any().required(),
        model_from: Joi.string().valid('pages').required(),
        model_from_id: Joi.any().required(),
        action: Joi.string().valid('move', 'swap').required(),
        relation_model_name: Joi.string().default('chapter_page'),
        model_scope_foreign_key: Joi.string().default('chapterId'),
        model_from_foreign_key: Joi.string().default('pageId')
    }).unknown(),
    Joi.object().keys({
        model_scope: Joi.string().valid('pages').required(),
        model_scope_id: Joi.any().required(),
        model_from: Joi.string().valid('items').required(),
        model_from_id: Joi.any().required(),
        action: Joi.string().valid('move', 'swap').required(),
        relation_model_name: Joi.string().default('page_item'),
        model_scope_foreign_key: Joi.string().default('pageId'),
        model_from_foreign_key: Joi.string().default('itemId')
    }).unknown(),
);

var result = url_params_joi.validate({
    model_scope: 'workbooks',
    model_from: 'chapters',
    action: 'move',
    model_scope_id: 1
});

console.log(result);

