/* eslint-disable global-require, func-names */
var UserController = require('./controllers/user');
var ProductsController = require('./controllers/products');

module.exports = (app) => {
  app.get('/', UserController.index);
  app.get('/login', UserController.login);
  app.get('/logout', UserController.logout);
  app.get('/dashboard', isUser, ProductsController.index);
  app.get('/dashboard/item/:prod_id', isUser, ProductsController.showProduct);
  app.post('/dashboard/item/:prod_id', isUser, ProductsController.insertCompare);
  app.get('/dashboard/sync', isUser, ProductsController.sync);
};

//middleware de login
function isUser(req, res, next){
  //se existir variavel user_id na sessao significa que está logado
  if(req.session.user_id)
    return next();
  //caso não exista será direcionado para página inicial
  res.redirect(401, '/');
}
