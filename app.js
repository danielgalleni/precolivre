const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const https = require('https');
const fs = require('fs');
const redis = require('redis');
const session = require('express-session');
const redisStore = require('connect-redis')(session);


const app = express();
const debug = require('debug')('myapp:app');

// config
const config = require('./config/config');

// database config
const db = require('./config/db');

// view engine setup
app.engine('html', nunjucks.render);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'html');


app.use(logger(config.isProd ? 'combined' : 'dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'public', 'favicon/favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

var _client = redis.createClient();
app.use(session({
  store: new redisStore({ host: 'localhost', port: 6379, client: _client}),
  secret: 'whoisagoodboy',
  // store: new redisStore(),
  saveUninitialized: false,
  resave: false
}));

// bootstrap routes
require('./app/routes')(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message; // eslint-disable-line no-param-reassign
  res.locals.error = config.isDev ? err : {}; // eslint-disable-line no-param-reassign
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var options = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt'),
    requestCert: false,
    rejectUnauthorized: false
};

db.on('connected', () => {
  https.createServer(options, app).listen(config.server.port, () => {
    debug(`App listening on port: ${config.server.port}`);
    app.emit('appStarted');
  });
});

module.exports = app;
