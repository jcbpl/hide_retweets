function TwitterError(msg){
  this.name = msg;
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
};
TwitterError.prototype.__proto__ = Error.prototype;
module.exports.TwitterError = TwitterError;