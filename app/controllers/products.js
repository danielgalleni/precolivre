const Product = require('../models/Product');
const config = require('../../config/meli');
const meli = require('mercadolibre');
var meliObject;
var global_variable;

exports.index = (req, res) => {
  meliObject = new meli.Meli(config.client_id, config.client_secret, req.session.user_access_token, req.session.user_refresh_token);
  global_variable = {
    user_id: req.session.user_id,
    user_token: req.session.user_access_token
  };
  res.send('<a href="/logout">Sair</a><a href="/dashboard/sync">Sync</a>');
}

exports.sync = (req, res) => {
  if(!meliObject)
    return res.redirect('/dashboard');
  meliObject.get('sites/MLB/search', { seller_id: global_variable.user_id, status: 'active' }, function(err, stats){
    console.log(err, stats.paging.total);
    var total = stats.paging.total;
    // meliObject.get('/users/'+_id+'/items/search', { limit: total }, function(err, items){
    for(var _offset=0; total>0; _offset+=200, total-= 200){
      console.log("offset: " + _offset);
      meliObject.get('sites/MLB/search', { seller_id: global_variable.user_id, offset: _offset, limit: 200 }, function(err, items){
        items.results.forEach(function(item){
          let prod = new Product();
          prod._id = item.id;
          prod.user_id = global_variable.user_id;
          prod.name = item.title;
          prod.price = item.price;
          prod.currency = item.currency_id;
          prod.url = item.permalink;
          prod.save(function(err, newprod){
            console.log(err, newprod);
            if(total <= 0) res.redirect('/dashboard');
          });
        });
      });
    }
    // res.render('dash', { items: items.results, quantidade: items.results.length });
  });
}

// meliObject.get('sites/MLB/search', { seller_id: _id, status: 'active' }, function(err, stats){
//   console.log(err, stats.paging.total);
//   var total = stats.paging.total;
//   var _items = [];
//   // meliObject.get('/users/'+_id+'/items/search', { limit: total }, function(err, items){
//   for(var _offset=0; total>=0; _offset+=200, total-=200){
//     meliObject.get('sites/MLB/search', { seller_id: _id, offset: _offset, limit: 200 }, function(err, it){
//       _items.push(it.results);
//       if(total<=0){
//         console.log("entrou no loop");
//         res.render('dash', { items: _items, quantidade: _items.length });
//       }
//     });
//   }
//   console.log('URL ID USUARIO: /users/'+_id+'/items/search');
//   // res.render('dash', { items: items.results, quantidade: items.results.length });
// });
