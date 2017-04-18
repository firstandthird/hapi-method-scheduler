'use strict';

// see http://bunkat.github.io/later/parsers.html#cron
// and http://bunkat.github.io/later/parsers.html#text
// for acceptable formats. this plugin always assumes a seconds field
// is present for cron.
exports.register = function(server, options, next) {
  // this will hold the method, params and interval for each method we want to run:
  const methodExecutionData = [];

  // get the interval schedule for a method by name of the method:
  const getSchedule = require('./lib/get.js');
  // stop an interval schedule from running:
  const stopSchedule = require('./lib/stop.js')
  // create and launch an interval schedule for a method:
  const startSchedule = require('./lib/start.js');

  // register all the server methods:
  server.on('start', () => {
    server.method('methodScheduler.getSchedule', (methodName) => getSchedule(methodExecutionData, methodName));

    server.method('methodScheduler.stopSchedule', (methodName) => stopSchedule(server, methodExecutionData, methodName));

    server.method('methodScheduler.startSchedule', (methodName) => startSchedule(server, methodExecutionData, options, methodName));

    // register any methods that were passed in params:
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
