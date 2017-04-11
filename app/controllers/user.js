const User = require('../models/User');
const config = require('../../config/meli');
const meli = require('mercadolibre');
var meliObject = new meli.Meli(config.client_id, config.client_secret);

exports.index = (req, res) => {
  //se o usuario estiver logado redireciona ele para dashboard
  if(req.session.user_id)
    return res.redirect('/dashboard');
  var _url = meliObject.getAuthURL('https://localhost:3000/login');
  res.render('index', { url: _url });
}

exports.login = (req, res) => {
  //se usuario não estiver autorizado ele é redirecionado para tela principal
  if(!req.query.code)
    return res.redirect('/');
  //pega os dados da autorização e autentica o usuário
  meliObject.authorize(req.query.code, 'https://localhost:3000/login', function(err, auth){
    // console.log(err, auth);
    meliObject.get('/users/me', function(err, my){
      // console.log(err, my);
      User.findOne({ email: my.email }, function(err, old){
        // console.log(err, my);
        if(old) { //o usuario existe no bd mas não está logado
          meliObject.refreshAccessToken(function(err, refresh){
            User.where({ email: old.email })
                .update({ access_token: refresh.access_token, refresh_token: refresh.refresh_token }, //atualiza os dados do usuario com nova access_token
                 function(err, updated){
              console.log(err, updated);
              req.session.user_id = old._id; // cria session para usuário
              req.session.user_access_token = refresh.access_token; // adiciona token do usuario para a session
              req.session.user_refresh_token = refresh.refresh_token; // adiciona token2 do usuario para a session
              res.redirect('/dashboard'); //redireciona para dashboard
            });
          });
        } else { //o usuario não existia e será inserido no banco de dados
          let user = new User(); //instancia modelo de usuario
          user._id = my.id;
          user.name = my.first_name + ' ' + my.last_name;
          user.nickname = my.nickname;
          user.email = my.email;
          user.access_token = auth.access_token;
          user.refresh_token = auth.refresh_token;
          let date = new Date();
          date.setMilliseconds(date.getMilliseconds() + auth.expires_in * 1000);
          user.expiration_time = date;
          user.save(function(err, _user){ //salva instancia de usuario no banco
            console.log(err, _user);
            req.session.user_id = user.id; //cria session
            req.session.user_access_token = auth.access_token;
            req.session.user_refresh_token = auth.refresh_token;
            res.redirect('/dashboard');
          });
        }
      });
    });
  });
}

exports.logout = (req, res) => {
  req.session.destroy(); //destroy session
  res.redirect('/');
}
