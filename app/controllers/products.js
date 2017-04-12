const Product = require('../models/Product');
const config = require('../../config/meli');
const meli = require('mercadolibre');
const request = require('request');
const cheerio = require('cheerio');
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
  meliObject.get('/sites/MLB/search', { seller_id: 7736434, status: 'active' }, function(err, stats){
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
  });
}

exports.showProduct = (req, res) => {
  if(!meliObject)
    return res.redirect('/dashboard');
  Product.findById(req.params.prod_id, function(err, prod){
    Product.aggregate([
      { "$match": { "_id": req.params.prod_id}}, { "$unwind": "$meli_compare" }, { "$sort": { "meli_compare.price" : 1 }}, { "$limit": 1 }
    ], function(err, cheaper){
      console.log(err, cheaper);
      if(cheaper[0])
        return res.render('product', { product: prod, cheaper: cheaper[0].meli_compare });
      return res.render('product', { product: prod });
    });
  });
}

exports.insertCompare = (req, _res) => {
  let _url = req.body.url;
  if (!_url)
    return _res.render('', { message: 'Coloque um link válido para adicionar o produto' });
  let product_id;
  //pega id do produto fazendo request da url inserida e pesquisa DOM no campo input[name='item_id']
  //que é unico em qualquer produto do mercadolivre
  request.get(_url, function(err, res, body){
    if(err) console.log(err);

    if(res.statusCode != 200)
      return _res.render('product', { message: 'Não foi possível encontrar esse produto!' });

    var $ = cheerio.load(res.body);

    product_id = $('input[name=item_id]').val();
    console.log('ID DO ITEM INSERIDO: ' + product_id);

    Product.findById(req.params.prod_id, function(err, refresh){
      meliObject.get('/items/'+product_id, function(err, description){
        let temp_compare = {
          meli_id: description.id,
          name: description.title,
          url: description.permalink,
          price: description.price,
          currency: description.currency_id,
        };
        if(!refresh.cheaper_price || temp_compare.price < refresh.cheaper_price)
          refresh.cheaper_price = temp_compare.price;
        console.log(temp_compare);
        refresh.meli_compare.push(temp_compare);
        refresh.save(function(err){
          if(err)
            console.log(err)
          _res.redirect('/dashboard/item/'+req.params.prod_id);
        });
      });
    });
  });
}
//mongo retorna menor preço:
// db.products.aggregate({ $match: { "_id": "MLB853679531"}}, { $unwind: "$meli_compare" }, { $sort: { "meli_compare.price" : 1 }}, { $limit: 1 }).pretty();
