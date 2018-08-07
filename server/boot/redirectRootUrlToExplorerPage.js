module.exports = function redirectRootUrlToExplorerPage(app) {
  app.get('/', function(req, res, next) {
    res.redirect('/explorer');
  });
};
