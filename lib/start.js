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
    if (options.onStart !== undefined) {
      str2fn(server.methods, options.onStart, false)(methodName);
    }
  };
  // event called after an interval method fires:
  const onEnd = (err, methodName, params) => {
    if (options.onEnd !== undefined) {
      str2fn(server.methods, options.onEnd, false)(err, methodName, params);
    }
  };
  // create a laterjs interval schedule from an input:
  async.autoInject({
    // make sure there is no name collision with another method:
    label(done) {
      const label = scheduleRequest.label || scheduleRequest.method;
      if (server.methods.methodScheduler.getSchedule(label)) {
        return done(`A method with the name ${label} has already been scheduled`);
      }
      done(null, label);
    },
    // set up an array of params for the scheduled method:
    params(label, done) {
      return done(null, scheduleRequest.params ? scheduleRequest.params : []);
    },
    // get the actual schedule method that will be executed at each interval:
    method(params, done) {
      // if the method is a method call in the form "method('test')" then execute that as the method
      if (scheduleRequest.method.indexOf('(') > 0 && scheduleRequest.method[scheduleRequest.method.length - 1]) {
        return done(null, () => {
          str2fn.execute(scheduleRequest.method, server.methods, scheduleRequest.context || {}, params[params.length - 1]);
        });
      }
      const method = _.get(server.methods, scheduleRequest.method, undefined);
      if (!method) {
        return done(new Error(`Method ${scheduleRequest.method} not defined`));
      }
      if (!options.noParamsLength && method.length !== params.length) {
        server.log(['hapi-method-scheduler', 'warning'], `Method ${scheduleRequest.method} takes ${method.length} params, ${params.length} given`);
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
    addMethod(label, method, params, interval, done) {
      methodExecutionData.push({
        method,
        label,
        methodName: scheduleRequest.method,
        interval,
        params,
        runOnStart: scheduleRequest.runOnStart
      });
      return done();
    },
    // launch the interval
    setInterval(label, addMethod, done) {
      const method = server.methods.methodScheduler.getSchedule(label);
      method.executingSchedule = later.setInterval(() => {
        onStart(label);
        try {
          const result = method.method.apply(null, method.params);
          onEnd(null, label, result);
        } catch (e) {
          onEnd(e, label);
        }
      }, method.interval);
      if (method.runOnStart) {
        onStart(label);
        try {
          const result = method.method.apply(null, method.params);
          onEnd(null, label, result);
        } catch (e) {
          onEnd(e, label);
        }
      }
      done();
    }
  }, (err, results) => {
    if (err) {
      server.log(['hapi-method-scheduler', 'error'], err);
    }
  });
};
