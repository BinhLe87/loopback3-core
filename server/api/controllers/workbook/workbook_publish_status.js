
const util = require('util');
const Joi = require('joi');
const {validators} = require('@cc_server/utils')


module.exports.workbook_published = async function workbook_published(req, res, next) {
  
  var workbook_status_joi = Joi.object({
    status: Joi.any()
      .valid('published', 'draft')
      .default('all')
  }).unknown();

  const workbook_status_joi_result = workbook_status_joi.validate(req.query, validators.baseJoiOptions);

  if (workbook_status_joi_result.error) {
    return next(workbook_status_joi_result.error);
  } else {

    if (workbook_status_joi_result.value.status == 'all') {
      return next();
    }

    var Workbook_version = req.app.models.workbook_version;
    var cc_mysql_connector = req.app.dataSources.cc_mysql.connector;    
    
    var workbook_query_string;
    if (workbook_status_joi_result.value.status == 'draft') {

      workbook_query_string = `SELECT workbook.* 
                                FROM workbook LEFT JOIN workbook_version 
                                ON workbook.id = workbook_version.workbookId
                                WHERE workbook_version.workbookId IS NULL`;
    } else if (workbook_status_joi_result.value.status == 'published') {

      workbook_query_string = `SELECT workbook.*
                              FROM workbook
                              LEFT JOIN workbook_version ON workbook.id = workbook_version.workbookId
                              WHERE workbook_version.workbookId IS NOT NULL
                              GROUP BY workbook.id`;
    }
    
    var query_params = [];
    var sql_query = {
      sql: workbook_query_string,
      params: query_params
    }

    var req_options = _.get(req, 'cc_options', {});
    req_options = _.assign(req_options, {sql_query});

    req.cc_options = req_options;

    next();
  }



    
   
  };
  