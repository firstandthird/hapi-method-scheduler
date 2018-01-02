const tap = require('tap');
const Hapi = require('hapi');
const scheduler = require('../index.js');
const moment = require('moment-timezone');
const _ = require('lodash');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

tap.test(' adds a method and calls it at regular intervals using cron syntax', async(t) => {
  const server = new Hapi.Server({});
  numberOfTimesCalled = 0;
  await server.register({
    plugin: scheduler,
    options: {
      schedule: [
        {
          method: 'countNumberOfTimesCalled',
          cron: '0/20 * * * * *'
        }
      ]
    }
  });
  await server.start();
  await wait(3000);
  t.equal(numberOfTimesCalled > 0, true);
  t.end();
});

/*
  let server;
  let numberOfTimesCalled = 0;
  let addResult = 0;

  const countNumberOfTimesCalled = function () {
    numberOfTimesCalled ++;
    return numberOfTimesCalled;
  };
  const add = function (a, b) {
    addResult += a + b;
    return addResult;
  };

  lab.beforeEach(async() => {
    numberOfTimesCalled = 0;
    server = new Hapi.Server({ port: 3000 });
    server.method('add', add);
    server.method('countNumberOfTimesCalled', countNumberOfTimesCalled);
  });

  lab.afterEach(async() => {
    await server.stop();
  });

  lab.test(' adds a method and calls it with parameters at regular intervals ', async() => {
    await server.register({
      plugin: scheduler,
      options: {
        schedule: [
          {
            method: 'add',
            time: 'every 1 seconds',
            params: [1, 3]
          }
        ]
      }
    });
    await server.start();
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(2500);
    Code.expect(addResult).to.be.above(4);
  });

  lab.test(' adds a method as a complete call of the form "foo(param1, param2)" and calls it at regular intervals ', async() => {
    await server.register({
      plugin: scheduler,
      options: {
        schedule: [
          {
            method: 'add(1, 3)',
            time: 'every 1 seconds'
          }
        ]
      }
    });
    await server.start();
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(2000);
    Code.expect(addResult).to.be.above(4);
    addResult = 0;
  });

  lab.test(' supports onStart and onFinish hooks ', async() => {
    const eventCalls = {
      start: 0,
      end: 0
    };
    server.method('onStart', (methodName) => {
      Code.expect(methodName).to.equal('add');
      eventCalls.start++;
    });
    server.method('onEnd', (err, methodName, params) => {
      Code.expect(err).to.equal(null);
      Code.expect(methodName).to.equal('add');
      eventCalls.end ++;
      eventCalls.endParams = params;
    });
    await server.register({
      plugin: scheduler,
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
    });
    await server.start();
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(2500);
    Code.expect(eventCalls.start).to.be.above(1);
    Code.expect(eventCalls.end).to.be.above(1);
    Code.expect(eventCalls.endParams).to.be.above(4);
  });

  lab.test(' supports timezone', { timeout: 5000 }, async() => {
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
    await server.register({
      plugin: scheduler,
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
    });
    await server.start();
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(2500);
    Code.expect(addResult).to.be.above(4);
  });

  lab.test('runOnStart will execute the method when it is registered', { timeout: 3000 }, async() => {
    let calledOnStart = 0;
    server.method('callOnStart', async () => {
      calledOnStart++;
    });
    await server.register({
      plugin: scheduler,
      options: {
        schedule: [
          {
            method: 'callOnStart',
            time: 'every 10 days',
            runOnStart: true
          }
        ]
      }
    });
    await server.start();
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(2000);
    Code.expect(calledOnStart).to.equal(1);
  });
});
*/
