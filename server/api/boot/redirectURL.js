module.exports = function redirectRootUrlToExplorerPage(app) {
  var router = app.loopback.Router();
  var restApiRoot = app.get('restApiRoot');

  app.get('/', function(req, res, next) {
    res.redirect('/explorer');
  });

  app.get(`(${restApiRoot})?/doc(s)?`, function(req, res, next) {
    res.redirect('/public/api_docs');
  });
};
