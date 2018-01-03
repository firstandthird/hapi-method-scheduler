const CronJob = require('cron').CronJob;
const str2fn = require('str2fn');

const register = (server, options) => {
  const allJobs = [];
  server.decorate('server', 'scheduleMethod', (cronString, methodStringOrFn, runOnInit) => {
    // this will throw an error if cronString isn't valid, which should be handled by caller:
    const job = new CronJob(cronString, async() => {
      try {
        // params are included in method string:
        await str2fn.execute(methodStringOrFn, server.methods);
      } catch (e) {
        server.log(['hapi-method-scheduler', 'error'], e);
      }
    }, null, true, options.timezone, {}, runOnInit); // options.timezone can be left undefined
    allJobs.push(job);
    return job;
  });

  // must stop all jobs in order for node.exe to properly exit:
  server.events.on('stop', () => {
    allJobs.forEach((job) => {
      job.stop();
    });
  });

  options.schedule.forEach((scheduleDirective) => {
    server.scheduleMethod(scheduleDirective.cron, scheduleDirective.method, scheduleDirective.runOnInit);
  });
};

exports.plugin = {
  name: 'hapi-method-scheduler',
  register,
  once: true,
  pkg: require('./package.json')
};
