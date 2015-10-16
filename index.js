'use strict';
var _ = require('lodash');
var later = require('later');

// see http://bunkat.github.io/later/parsers.html#cron
// and http://bunkat.github.io/later/parsers.html#text
// for acceptable formats. this plugin always assumes a seconds field
// is present for cron.
exports.register = function(server, options, next) {
  // this will hold the method, params and interval for each method we want to run:
  var methodExecutionData = [];
  // populate methodExecutionData, return an error if any are unworkable:
  for (var i = 0; i < options.schedule.length; i++) {
    var scheduleRequest = options.schedule[i];
    var method = _.get(server.methods, scheduleRequest.method, undefined);
    var params = scheduleRequest.params ? scheduleRequest.params : [];
    var scheduleText = scheduleRequest.time ? scheduleRequest.time : scheduleRequest.cron;
    if (!method){
      var error ='Method ' + scheduleRequest.method + ' not defined';
      server.log(['hapi-method-scheduler', 'error'], error);
      next(error);
      return;
    }
    if (!scheduleText){
      var error = 'Method ' + scheduleRequest.method + ' requires either a valid "time" or "cron" schedule';
      server.log(['hapi-method-scheduler', 'error'], error);
      next(error);
      return;
    }
    if (method.length-1 != params.length){
      var error = 'Method ' + scheduleRequest.method + 'takes ' + method.length-1 + ' params';
      server.log(['hapi-method-scheduler', 'error'], error);
      next(error);
      return;
    }
    // see docs for later.js if confused:
    try{
        if (scheduleRequest.time){
          var interval = later.parse.text(scheduleText);
          methodExecutionData.push({ method: method, interval : interval, params: params});
        }
        else {
          var interval = later.parse.cron(scheduleText, true);
          methodExecutionData.push({ method: method, interval : interval, params:params});
        }
    } catch(exc){
      server.log(['hapi-method-scheduler', 'error'], 'Unable to parse schedule directive for method ' + scheduleRequest.method + ' , error msg is: ' + exc);
      next(exc);
      return;
    }
    // check for any parse errors that didn't throw an exception:
    if (interval.error>-1){
      var error = 'Unable to parse schedule directive for method ' + scheduleRequest.method;
      server.log(['hapi-method-scheduler', 'error'], error);
      next(error);
      return;
    }
    // push a 'done' callback to the params we pass our server methods:
    params.push(function done(err,result){
      if (err) server.log(['hapi-method-scheduler', 'error'], err);
      server.log(['hapi-method-scheduler', 'info'], 'Method ' + scheduleRequest.method + ' called result is ' + result);
    })
  }
  // if all our methods are set up correctly then we can now put them in the queue to run:
  _.each(methodExecutionData, function(i){
    // finally, set the methodExecutionData for our methods:
    later.setInterval(function(){
      i.method.apply(null, i.params);
    }, i.interval);
  });
  next();
}
exports.register.attributes = {
    pkg: require('./package.json')
};
