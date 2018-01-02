const CronJob = require('cron').CronJob;
const str2fn = require('str2fn');

const register = async function(server, options) {
  server.decorate('server', 'scheduleMethod', (cronString, methodStringOrFn, runOnInit) => {
    // this will throw an error if cronString isn't valid, which should be handled by caller:
    const cronJob = new CronJob(cronString, async() => {
      try {
        // params are included in method string:
        str2fn.execute(methodStringOrFn, server.methods);
      } catch (e) {
        server.log(['hapi-method-scheduler', 'error'], e);
      }
    }, null, true, options.timezone, {}, runOnInit);
  });
  options.schedule.forEach((scheduleDirective) => {
    server.scheduleMethod(scheduleDirective.cron, scheduleDirective.method);
  });
};

exports.plugin = {
  register,
  once: true,
  pkg: require('./package.json')
};
