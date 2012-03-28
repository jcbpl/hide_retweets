var ntwitter = module.exports = require('ntwitter');

ntwitter.prototype.updateFriendship = function(id, params, callback) {
  if (typeof id === 'string') {
    params.screen_name = id;
  } else {
    params.user_id = id;
  }
  
  var url = '/friendships/update.json';
  this.post(url, params, null, callback);
  return this;
};

ntwitter.prototype.getNoRetweetIds = function(id, callback) {
  if (typeof id === 'function') {
    callback = id;
    id = null;
  }
  
  if (typeof id === 'string') {
    params = { screen_name: id };
  } else {
    params = { user_id: id };
  }

  var url = '/friendships/no_retweet_ids.json';
  this.get(url, params, callback);
  return this;
};