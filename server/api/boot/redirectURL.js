module.exports = function redirectRootUrlToExplorerPage(app) {
  var router = app.loopback.Router();
  var restApiRoot = app.get('restApiRoot');

  app.get('/', function(req, res, next) {
    res.redirect('/explorer');
  });

  app.get(`(${restApiRoot})?/doc(s)?`, function(req, res, next) {
    res.redirect('/public/client_api_docs');
  });

  app.get(`(${restApiRoot})?/server_doc(s)?`, function (req, res, next) {
    res.redirect('/public/server_api_docs');
  });
};
