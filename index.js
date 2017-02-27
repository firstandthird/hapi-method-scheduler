'use strict';
const _ = require('lodash');
const str2fn = require('str2fn');
const later = require('later');

// see http://bunkat.github.io/later/parsers.html#cron
// and http://bunkat.github.io/later/parsers.html#text
// for acceptable formats. this plugin always assumes a seconds field
// is present for cron.
exports.register = function(server, options, next) {
  // in order to use options.timezone you must override later.setTimeout:
  if (options.timezone) {
    require('later-timezone').timezone(later, options.timezone);
  }

  const onStart = (methodName) => {
    if (options.onStart) {
      str2fn(server.methods, options.onStart, false)(methodName);
    }
  };
  const onEnd = (err, methodName, params) => {
    if (options.onEnd) {
      str2fn(server.methods, options.onEnd, false)(err, methodName, params);
    }
  };

  // this will hold the method, params and interval for each method we want to run:
  let methodExecutionData = [];

  // create a laterjs interval schedule from an input:
  const createScheduleFromRequest = (scheduleRequest) => {
    const method = _.get(server.methods, scheduleRequest.method, undefined);
    const params = scheduleRequest.params ? scheduleRequest.params : [];
    const scheduleText = scheduleRequest.time ? scheduleRequest.time : scheduleRequest.cron;
    if (!method) {
      return next(new Error(`Method ${scheduleRequest.method} not defined`));
    }

    if (!scheduleText) {
      return next(new Error(`Method ${scheduleRequest.method} requires either a valid "time" or "cron" schedule`));
    }

    if (method.length - 1 !== params.length) {
      return next(new Error(`Method ${scheduleRequest.method} takes ${method.length - 1} params`));
    }
    // see docs for later.js if confused:
    try {
      let interval;
      if (scheduleRequest.time) {
        interval = later.parse.text(scheduleText);
      } else {
        interval = later.parse.cron(scheduleText, true);
      }
      if (interval.error > -1) {
        server.log(['hapi-method-scheduler', 'error'], { message: 'Unable to parse schedule directive', method: scheduleRequest.method });
        return next(new Error('invalid schedule'));
      }
      methodExecutionData.push({
        method,
        methodName: scheduleRequest.method,
        interval,
        params,
        runOnStart: scheduleRequest.runOnStart
      });
    } catch (exc) {
      server.log(['hapi-method-scheduler', 'error'], { message: 'Unable to parse schedule directive', method: scheduleRequest.method, error: exc });
      next(exc);
      return;
    }
    // check for any parse errors that didn't throw an exception:
    // push a 'done' callback to the params we pass our server methods:
    params.push((err, result) => {
      if (err) {
        server.log(['hapi-method-scheduler', 'error'], { method: scheduleRequest.method, error: err });
      }
      server.log(['hapi-method-scheduler', 'info'], { method: scheduleRequest.method, result });
      onEnd(err, scheduleRequest.method, result);
    });
  };

  // if all our methods are set up correctly then we can now put them in the queue to run:
  server.on('start', () => {
    server.method('methodScheduler.getSchedule', (methodName) => {
      for (let i = 0; i < methodExecutionData.length; i++) {
        if (methodExecutionData[i].methodName === methodName) {
          return methodExecutionData[i];
        }
      }
    });
    server.method('methodScheduler.stopSchedule', (methodName) => {
      const method = server.methods.methodScheduler.getSchedule(methodName);
      method.executingSchedule.clear();
      methodExecutionData = methodExecutionData.filter((el) => el !== method);
    });
    server.method('methodScheduler.startSchedule', (methodSpec) => {
      createScheduleFromRequest(methodSpec);
      const method = server.methods.methodScheduler.getSchedule(methodSpec.method);
      method.executingSchedule = later.setInterval(() => {
        onStart(method.methodName);
        method.method.apply(null, method.params);
      }, method.interval);
      if (method.runOnStart) {
        onStart(method.methodName);
        method.method.apply(null, method.params);
      }
    });
    if (Array.isArray(options.schedule)) {
      options.schedule.forEach((i) => {
        server.methods.methodScheduler.startSchedule(i);
      });
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
