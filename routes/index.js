var _ = require('nimble')
  , errors = require('../errors')
  , Twitter = require('../twitter');

var twitter = function(tokens) {
  var t = new Twitter({
    consumer_key: process.env['TWITTER_CONSUMER_KEY'],
    consumer_secret: process.env['TWITTER_CONSUMER_SECRET']
  });
  
  t.oauth._version = '1.0A';
  t.oauth._authorize_callback = process.env['TWITTER_CALLBACK_URL'];
  
  if (tokens) {
    t.options.access_token_key = tokens.access_token;
    t.options.access_token_secret = tokens.access_secret;
  }
  
  return t;
};

module.exports.index = function(req, res) {
  res.render('index');
};

module.exports.connect = function(req, res, next) {
  twitter().oauth.getOAuthRequestToken(function(err, request_token, request_secret, data){
    if (err) {
      next(new errors.TwitterError('Could not get request token'));
    } else {
      req.session.request_token = request_token;
      req.session.request_secret = request_secret;
      res.redirect('https://twitter.com/oauth/authorize?oauth_token=' + req.session.request_token);
    }
  });
};

module.exports.callback = function(req, res, next) {
  if (req.query.denied) {
    res.redirect('/');
  } else {
    twitter().oauth.getOAuthAccessToken(req.session.request_token, req.session.request_secret, req.query.oauth_verifier, function(err, access_token, access_secret, data) {
      if (err) {
        next(new errors.TwitterError('Could not get access token'));
      } else {
        req.session.tokens = { access_token: access_token, access_secret: access_secret, handle: data.screen_name }
        res.redirect('/retweets');
      }
    });
  }
};

module.exports.retweets = function(req, res) {
  res.render('retweets')
};

module.exports.show = function(req, res, next) {
  var t = twitter(req.session.tokens);
  t.getNoRetweetIds(function(err, no_retweet_ids) {
    if (err) {
      next(new errors.TwitterError('Could not get no-retweet IDs'));
    } else {
      _.each(no_retweet_ids, function(id, eachCallback) {
        var retries = 10
          , params = { retweets: true };
        t.updateFriendship(id, params, function callback(err, data) {
          if (err) {
            retries -= 1;
            if (retries <= 0) {
              eachCallback(err);
            } else {
              t.updateFriendship(id, params, callback);
            }
          } else {
            eachCallback();
          }
        });
      }, function(err) {
        if (err) {
          next(new errors.TwitterError('Could not update friendship'));
        } else {
          res.redirect('/done');
        }
      });
    }
  });
};

module.exports.hide = function(req, res, next) {
  var t = twitter(req.session.tokens);
  t.getFriendsIds(function(err, friend_ids) {
    if (err) {
      next(new errors.TwitterError('Could not get friend IDs'));
    } else {
      t.getNoRetweetIds(function(err, no_retweet_ids) {
        if (err) {
          next(new errors.TwitterError('Could not get no-retweet IDs'));
        } else {
          var ids = _.filter(friend_ids, function(id){
            return no_retweet_ids.indexOf(id) < 0;
          });
          
          _.each(ids, function(id, eachCallback) {
            var retries = 10
              , params = { retweets: false };
            t.updateFriendship(id, params, function callback(err, data) {
              if (err) {
                retries -= 1;
                if (retries <= 0) {
                  eachCallback(err);
                } else {
                  t.updateFriendship(id, params, callback);
                }
              } else {
                eachCallback();
              }
            });
          }, function(err) {
            if (err) {
              next(new errors.TwitterError('Could not update friendship'));
            } else {
              res.redirect('/done');
            }
          });
        }
      });
    }
  });
};

module.exports.done = function(req, res) {
  req.session.destroy;
  res.render('done')
};
