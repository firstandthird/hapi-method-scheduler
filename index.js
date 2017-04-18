'use strict';

// see http://bunkat.github.io/later/parsers.html#cron
// and http://bunkat.github.io/later/parsers.html#text
// for acceptable formats. this plugin always assumes a seconds field
// is present for cron.
exports.register = function(server, options, next) {
  // this will hold the method, params and interval for each method we want to run:
  const methodExecutionData = [];

  server.on('start', () => {
    // create and launch an interval schedule for a method:
    server.method('methodScheduler.startSchedule', (methodName) => require('./lib/start.js')(server, methodExecutionData, options, methodName));

    // stop an interval schedule from running:
    server.method('methodScheduler.stopSchedule', (methodName) => require('./lib/stop.js')(server, methodExecutionData, methodName));

    // get the interval schedule for a method by name of the method:
    server.method('methodScheduler.getSchedule', (methodName) => require('./lib/get.js')(methodExecutionData, methodName));

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
