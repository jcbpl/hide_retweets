var express = require('express')
  , HerokuRedisStore = require('connect-heroku-redis')(express)
  , routes = require('./routes')
  , errors = require('./errors');

var app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({store: new HerokuRedisStore, secret: process.env['CONNECT_SESSION_SECRET'] || 'keyboard cat'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));  
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(function(err, req, res, next) {
    if (err instanceof errors.TwitterError) {
      res.render('503');
    } else {
      next(err);
    }
  });
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/sessions/new', routes.connect);
app.get('/sessions/callback', routes.callback);
app.get('/retweets', routes.retweets);
app.post('/retweets/show', routes.show);
app.post('/retweets/hide', routes.hide);
app.get('/done', routes.done);

app.listen(process.env['PORT'] || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
