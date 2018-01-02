const CronJob = require('cron').CronJob;
const str2fn = require('str2fn');

const register = (server, options) => {
  /* eslint-disable arrow-body-style */
  server.decorate('server', 'scheduleMethod', (cronString, methodStringOrFn, runOnInit) => {
    // this will throw an error if cronString isn't valid, which should be handled by caller:
    return new CronJob(cronString, async() => {
      try {
        // params are included in method string:
        await str2fn.execute(methodStringOrFn, server.methods);
      } catch (e) {
        server.log(['hapi-method-scheduler', 'error'], e);
      }
    }, null, true, options.timezone, {}, runOnInit); // options.timezone can be left undefined
  });
  /* eslint-enable arrow-body-style */
  options.schedule.forEach((scheduleDirective) => {
    server.scheduleMethod(scheduleDirective.cron, scheduleDirective.method, scheduleDirective.runOnInit);
  });
};

exports.plugin = {
  register,
  once: true,
  pkg: require('./package.json')
};
