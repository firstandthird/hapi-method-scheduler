'use strict';
const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const scheduler = require('../index.js');
const moment = require('moment-timezone');
const _ = require('lodash');

lab.experiment('hapi-method-scheduler', () => {
  let server;
  let numberOfTimesCalled = 0;
  let addResult = 0;

  const countNumberOfTimesCalled = function (done) {
    numberOfTimesCalled ++;
    done(null, numberOfTimesCalled);
  };
  const add = function (a, b, done) {
    addResult += a + b;
    done(null, addResult);
  };

  lab.beforeEach((done) => {
    server = new Hapi.Server();
    server.method('add', add);
    server.method('countNumberOfTimesCalled', countNumberOfTimesCalled);
    server.connection({ port: 3000 });
    done();
  });

  lab.afterEach((done) => {
    server.stop(done);
  });

  lab.test(' adds a method and calls it at regular intervals using later.js syntax', (done) => {
    numberOfTimesCalled = 0;
    server.register({
      register: scheduler,
      options: {
        schedule: [
          {
            method: 'countNumberOfTimesCalled',
            time: 'every 1 seconds'
          }
        ]
      }
    },
    (err) => {
      if (err) {
        throw err;
      }
      server.start(() => {
        setTimeout(() => {
          Code.expect(numberOfTimesCalled).to.equal(2);
          done();
        }, 2500);
      });
    });
  });

  lab.test(' can stop an added method', (done) => {
    numberOfTimesCalled = 0;
    server.register({
      register: scheduler,
      options: {
        schedule: [
          {
            method: 'countNumberOfTimesCalled',
            time: 'every 1 seconds'
          }
        ]
      }
    },
    (err) => {
      if (err) {
        throw err;
      }
      server.start(() => {
        setTimeout(() => {
          server.methods.methodScheduler.stopSchedule('countNumberOfTimesCalled');
          setTimeout(() => {
            Code.expect(numberOfTimesCalled).to.equal(3);
            done();
          }, 2500);
        }, 100);
      });
    });
  });

  lab.test(' adds a method and calls it at regular intervals using cron syntax', (done) => {
    numberOfTimesCalled = 0;
    server.register({
      register: scheduler,
      options: {
        schedule: [
          {
            method: 'countNumberOfTimesCalled',
            cron: '0/20 * * * * *'
          }
        ]
      }
    },
    (err) => {
      if (err) {
        throw err;
      }
      server.start(() => {
        setTimeout(() => {
          Code.expect(numberOfTimesCalled).to.be.above(2);
          done();
        }, 3000);
      });
    });
  });

  lab.test(' adds a method and calls it with parameters at regular intervals ', (done) => {
    server.register({
      register: scheduler,
      options: {
        schedule: [
          {
            method: 'add',
            time: 'every 1 seconds',
            params: [1, 3]
          }
        ]
      }
    },
    (err) => {
      if (err) {
        throw err;
      }
      server.start(() => {
        setTimeout(() => {
          Code.expect(addResult).to.be.above(4);
          done();
        }, 2200);
      });
    });
  });

  lab.test(' supports onStart and onFinish hooks ', (done) => {
    let count = 0;
    server.method('onStart', (methodName) => {
      Code.expect(methodName).to.equal('add');
      count++;
    });
    server.method('onEnd', (err, methodName, params) => {
      Code.expect(err).to.equal(null);
      Code.expect(methodName).to.equal('add');
      count += params;
    });
    server.register({
      register: scheduler,
      options: {
        onStart: 'onStart',
        onEnd: 'onEnd',
        schedule: [
          {
            method: 'add',
            time: 'every 1 seconds',
            params: [1, 3]
          }
        ]
      }
    },
    (err) => {
      if (err) {
        throw err;
      }
      server.start(() => {
        setTimeout(() => {
          Code.expect(count).to.equal(42);
          done();
        }, 2500);
      });
    });
  });

  lab.test(' supports timezone', { timeout: 5000 }, (done) => {
    const getOffset = (zoneName) => {
      const now = new Date();
      const zone = moment.tz.zone(zoneName);
      return zone.offset(now);
    };
    const getMinutes = (val) => {
      const mins = new Date().getMinutes() + val;
      if (mins < 10) {
        return `0${mins}`;
      }
      return mins;
    };
    const localTimezone = moment.tz.guess();
    const localOffset = getOffset(localTimezone);
    // get a future time zone+ offset in minutes:
    // if this won't work try manually setting to a future timezone
    let futureZone;
    let futureOffset;
    const allTimezones = _.values(moment.tz._names);
    for (let i = 0; i < allTimezones.length; i++) {
      futureZone = allTimezones[i];
      futureOffset = getOffset(futureZone);
      if (futureOffset - localOffset === 60) {
        break;
      }
    }
    const string = `after ${new Date().getHours()}:${getMinutes(1)}`;
    server.register({
      register: scheduler,
      options: {
        timezone: futureZone,
        schedule: [
          {
            method: 'add',
            time: string,
            params: [1, 3]
          }
        ]
      }
    },
    (err) => {
      if (err) {
        throw err;
      }
      server.start(() => {
        setTimeout(() => {
          Code.expect(addResult).to.be.above(4);
          done();
        }, 2200);
      });
    });
  });
});
