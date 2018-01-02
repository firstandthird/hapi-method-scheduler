const CronJob = require('cron').CronJob;
const str2fn = require('str2fn');

const register = async function(server, options) {
  server.decorate('server', 'scheduleMethod', (cronString, methodStringOrFn, timezone, runOnInit) => {
    // this will throw an error if cronString isn't valid, which should be handled by caller:
    const cronJob = new CronJob(cronString, async() => {
      str2fn(server.methods, methodStringOrFn);
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
