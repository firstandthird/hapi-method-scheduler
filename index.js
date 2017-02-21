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
  const methodExecutionData = [];
  // populate methodExecutionData, return an error if any are unworkable:
  for (let i = 0; i < options.schedule.length; i++) {
    const scheduleRequest = options.schedule[i];
    const method = _.get(server.methods, scheduleRequest.method, undefined);
    const params = scheduleRequest.params ? scheduleRequest.params : [];
    const scheduleText = scheduleRequest.time ? scheduleRequest.time : scheduleRequest.cron;

    if (!method) {
      return next(new Error(`Method ${scheduleRequest.method} not defined`));
    }

    if (!scheduleText) {
      return next(new Error(`Method ${scheduleRequest.method} requires either a valid "time" or "cron" schedule`));
    }

    // This doesn't seem to work with hapi-method-loader (Always comes back as -1 params which is impossible...)
    // if (method.length - 1 !== params.length) {
    //   return next(new Error(`Method ${scheduleRequest.method} takes ${method.length - 1} params`));
    // }

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
  }

  // if all our methods are set up correctly then we can now put them in the queue to run:
  server.on('start', () => {
    _.each(methodExecutionData, (i) => {
      // finally, set the methodExecutionData for our methods:
      later.setInterval(() => {
        onStart(i.methodName);
        i.method.apply(null, i.params);
      }, i.interval);

      if (i.runOnStart) {
        onStart(i.methodName);
        i.method.apply(null, i.params);
      }
    });
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
