'use strict';
const async = require('async');
const _ = require('lodash');
const later = require('later');
const str2fn = require('str2fn');

module.exports = (server, methodExecutionData, options, scheduleRequest) => {
  // in order to use options.timezone you must override later.setTimeout:
  if (options.timezone) {
    require('later-timezone').timezone(later, options.timezone);
  }
  // event called before an interval method fires:
  const onStart = (methodName) => {
    if (options.onStart) {
      str2fn(server.methods, options.onStart, false)(methodName);
    }
  };
  // event called after an interval method fires:
  const onEnd = (err, methodName, params) => {
    if (options.onEnd) {
      str2fn(server.methods, options.onEnd, false)(err, methodName, params);
    }
  };
  // create a laterjs interval schedule from an input:
  async.autoInject({
    // set up an array of params for the scheduled method:
    params(done) {
      const params = scheduleRequest.params ? scheduleRequest.params : [];
      // check for any parse errors that didn't throw an exception:
      // push a 'done' callback to the params we pass our server methods:
      params.push((err, result) => {
        if (err) {
          server.log(['hapi-method-scheduler', 'error'], { method: scheduleRequest.method, error: err });
        }
        server.log(['hapi-method-scheduler', 'info'], { method: scheduleRequest.method, result });
        onEnd(err, scheduleRequest.method, result);
      });
      return done(null, params);
    },
    // get the actual schedule method that will be executed at each interval:
    method(params, done) {
      const method = _.get(server.methods, scheduleRequest.method, undefined);
      if (!method) {
        return done(new Error(`Method ${scheduleRequest.method} not defined`));
      }
      if (method.length !== params.length) {
        return done(new Error(`Method ${scheduleRequest.method} takes ${method.length - 1} params`));
      }
      return done(null, method);
    },
    // get a laterjs interval schedule:
    interval(done) {
      const scheduleText = scheduleRequest.time ? scheduleRequest.time : scheduleRequest.cron;
      if (!scheduleText) {
        return done(new Error(`Method ${scheduleRequest.method} requires either a valid "time" or "cron" schedule`));
      }
      let interval;
      try {
        if (scheduleRequest.time) {
          interval = later.parse.text(scheduleText);
        } else {
          interval = later.parse.cron(scheduleText, true);
        }
        if (interval.error > -1) {
          server.log(['hapi-method-scheduler', 'error'], { message: 'Unable to parse schedule directive', method: scheduleRequest.method });
          return done(new Error('invalid schedule'));
        }
      } catch (exc) {
        server.log(['hapi-method-scheduler', 'error'], { message: 'Unable to parse schedule directive', method: scheduleRequest.method });
        return done(exc);
      }
      return done(null, interval);
    },
    // store all of it in methodExecutionData:
    addMethod(method, params, interval, done) {
      methodExecutionData.push({
        method,
        methodName: scheduleRequest.method,
        interval,
        params,
        runOnStart: scheduleRequest.runOnStart
      });
      return done();
    },
    // launch the interval
    setInterval(addMethod, done) {
      const method = server.methods.methodScheduler.getSchedule(scheduleRequest.method);
      method.executingSchedule = later.setInterval(() => {
        onStart(method.methodName);
        method.method.apply(null, method.params);
      }, method.interval);
      if (method.runOnStart) {
        onStart(method.methodName);
        method.method.apply(null, method.params);
      }
      done();
    }
  }, (err, results) => {
    if (err) {
      server.log(['hapi-method-scheduler', 'error'], err);
    }
  });
};
