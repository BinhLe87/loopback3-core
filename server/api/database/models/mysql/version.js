const mkdirp = require('mkdirp');
const fs = require('fs');
const md5 = require('blueimp-md5');
const WorkbookVersion = require('./workbook-version');
('use strict');

module.exports = function(Version) {
  Version._draft_ = async function(workbookId, ctx) {
    const Workbook = this.app.models.workbook;
    let workbook = await Workbook.findById(workbookId);
    let workbookUuid = `workbook-${md5(workbookId)}`;
    let workbookDataPath = __dirname + '/../../../data/';
    let workbookContentFile = workbookDataPath + workbookUuid;

    let content;
    try {
      if (fs.statSync(workbookContentFile).mtime > workbook.updatedAt) {
        content = JSON.parse(fs.readFileSync(workbookContentFile).toString());
      }
    } catch (e) {
      // do nothing
    }

    if (!content) {
      content = await WorkbookVersion.generateWorkbookContent(
        workbookId,
        this.app
      );
      await mkdirp(workbookDataPath);
      fs.writeFileSync(workbookContentFile, JSON.stringify(content));
    }

    return {
      workbookId,
      content,
      name: workbook.title,
      id: '_draft_'
    };
  };

  Version.remoteMethod('_draft_', {
    accepts: [
      {
        arg: 'workbookId',
        type: 'string'
      }
    ],
    returns: {
      arg: 'data',
      type: 'Version',
      root: true
    },
    http: {
      verb: 'get'
    }
  });

  // Version.observe('loaded', async function(ctx) {
  //   // check if version details
  //   var params = ctx.options.req.params;
  //   var route = ctx.options.req.route;

  //   if (['/:id', '/:id/versions/:fk'].indexOf(route.path) >= 0) {
  //     // do nothing
  //   } else {
  //     ctx.data.content = {};
  //   }

  //   return;
  // });
};
