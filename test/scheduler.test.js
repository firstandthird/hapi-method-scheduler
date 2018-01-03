'use strict';
const Hapi = require('hapi');
const scheduler = require('../index.js');
const tap = require('tap');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

tap.test('adds a method and calls it at regular intervals using cron syntax', async(t) => {
  const server = new Hapi.Server({ port: 3000 });
  let numberOfTimesCalled = 0;
  server.method('countNumberOfTimesCalled', () => {
    numberOfTimesCalled ++;
    return numberOfTimesCalled;
  });
  await server.register({
    plugin: scheduler,
    options: {
      schedule: [
        {
          method: 'countNumberOfTimesCalled',
          cron: '* * * * * *' // 1 time per second
        }
      ]
    }
  });
  await server.start();
  await wait(5000);
  t.equal(numberOfTimesCalled > 2, true, 'calls the method at regular intervals');
  await server.stop();
  t.end();
});

tap.test('adds a method and calls it with parameters at regular intervals ', async(t) => {
  const server = new Hapi.Server({ port: 3000 });
  let addResult = 0;
  server.method('add', (a, b) => {
    t.equal(a, 1, 'passes function params correctly');
    t.equal(b, 3, 'passes function params correctly');
    addResult += a + b;
    return addResult;
  });
  await server.register({
    plugin: scheduler,
    options: {
      schedule: [
        {
          method: 'add(1, 3)',
          cron: '* * * * * *'
        }
      ]
    }
  });
  await server.start();
  await wait(4500);
  t.equal(addResult > 4, true, 'calls the function with the correct params');
  await server.stop();
  t.end();
});

tap.test('adds a method and calls it at a specified time using cron syntax', async(t) => {
  const server = new Hapi.Server({ port: 3000 });
  let numberOfTimesCalled = 0;
  server.method('countNumberOfTimesCalled', () => {
    numberOfTimesCalled ++;
    return numberOfTimesCalled;
  });
  await server.register({
    plugin: scheduler,
    options: {
      schedule: [
        {
          method: 'countNumberOfTimesCalled',
          cron: new Date(new Date().getTime() + 1000) // 1 second in the future
        }
      ]
    }
  });
  await server.start();
  await wait(5000);
  t.equal(numberOfTimesCalled, 1, 'calls the method at the specified time');
  await server.stop();
  t.end();
});

tap.test('supports runOnInit', async(t) => {
  const server = new Hapi.Server({ port: 3000 });
  let numberOfTimesCalled = 0;
  server.method('countNumberOfTimesCalled', () => {
    numberOfTimesCalled ++;
    return numberOfTimesCalled;
  });
  await server.register({
    plugin: scheduler,
    options: {
      schedule: [
        {
          method: 'countNumberOfTimesCalled',
          cron: new Date(new Date().getTime() + 60000), // 1 minute in the future
          runOnInit: true, // runs on init
        }
      ]
    }
  });
  await server.start();
  t.equal(numberOfTimesCalled, 1, 'calls the method when it is first added');
  await server.stop();
  t.end();
});

tap.test('can schedule a function manually by calling server.scheduleMethod', async(t) => {
  const server = new Hapi.Server({ port: 3000 });
  await server.register({
    plugin: scheduler,
    options: {
      schedule: []
    }
  });
  let numberOfTimesCalled = 0;
  server.method('countNumberOfTimesCalled', () => {
    numberOfTimesCalled ++;
    return numberOfTimesCalled;
  });
  await server.start();
  server.scheduleMethod(new Date(new Date().getTime() + 1000), 'countNumberOfTimesCalled');
  await wait(3000);
  t.equal(numberOfTimesCalled, 1, 'calls the method at the specified time');
  await server.stop();
  t.end();
});
