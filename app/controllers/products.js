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
  Product.find({ user_id: global_variable.user_id }, function(err, items){
    var qtdade = items.length;
    res.render('dash', { items: items, qtdProdutos: qtdade });
  });
}

exports.sync = (req, res) => {
  if(!meliObject)
    return res.redirect('/dashboard');
  meliObject.get('sites/MLB/search', { seller_id: 7736434, status: 'active' }, function(err, stats){
    console.log(err, stats.paging.total);
    var total = stats.paging.total;
    var _total = total;
    var _count = 0;
    // meliObject.get('/users/'+_id+'/items/search', { limit: total }, function(err, items){
    for(var _offset=0; total>0; _offset+=200, total-= 200){
      console.log("offset: " + _offset);
      meliObject.get('sites/MLB/search', { seller_id: 7736434, offset: _offset, limit: 200 }, function(err, items){
        console.log(err, items.paging.offset);
        items.results.forEach(function(item, index, array){
          let prod = new Product();
          prod._id = item.id;
          prod.user_id = global_variable.user_id;
          prod.name = item.title;
          prod.price = item.price;
          prod.currency = item.currency_id;
          prod.url = item.permalink;
          prod.save(function(err, newprod){
            // console.log(err, newprod);
            _count++;
            if(_count == _total) res.send({ finished: true });
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
