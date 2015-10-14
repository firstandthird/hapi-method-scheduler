'use strict';
var _ = require('lodash');
var later = require('later');

// see http://bunkat.github.io/later/parsers.html#cron
// and http://bunkat.github.io/later/parsers.html#text
// for acceptable formats. this plugin always assumes a seconds field
// is present for cron.
exports.register = function(server, options, next) {
  _.each(options.schedule, function(scheduleRequest){
    var method = _.get(server.methods, scheduleRequest.method);
    var params = scheduleRequest.params ? scheduleRequest.params : [];
    var scheduleText = scheduleRequest.time ? scheduleRequest.time : scheduleRequest.cron;
    if (!method){
      server.log(['hapi-method-scheduler', 'error'], `Method ${scheduleRequest.method} not defined`);
      return;
    }
    if (!scheduleText){
      server.log([`hapi-method-scheduler`, `error`], `Method ${scheduleRequest.method} requires either a valid "time" or "cron" schedule`);
      return;
    }
    if (method.length-1 != params.length){
      server.log([`hapi-method-scheduler`, `error`], `Method ${scheduleRequest.method} takes ${method.length-1} params`);
      return;
    }
    // see docs for later.js if confused:
    try{
        if (scheduleRequest.time){
          var interval = later.parse.text(scheduleText);
        }
        else {
          var interval = later.parse.cron(scheduleText, true);
        }
    } catch(exc){
      server.log([`hapi-method-scheduler`, `error`], `Unable to parse schedule directive for method ${scheduleRequest.method}, error msg is: ${exc}`);
      return;
    }
    // push a 'done' callback to the params we pass our server methods:
    params.push(function done(err,result){
      if (err) server.log(['hapi-method-scheduler', 'error'], err);
      server.log(['hapi-method-routes', 'info'], `Method ${interval.method} called result is ${result}` )
    })
    // finally, set the interval that applies our method:
    later.setInterval(function(){
      method.apply(null, params);
    }, interval);
  })
  next();
}
exports.register.attributes = {
    pkg: require('./package.json')
};
