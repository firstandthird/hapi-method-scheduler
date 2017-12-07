'use strict';
const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const scheduler = require('../index.js');

lab.experiment('hapi-method-scheduler: stop method', { timeout: 5000 }, () => {
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

  lab.beforeEach( async() => {
    numberOfTimesCalled = 0;
    server = new Hapi.Server({ port: 3000 });
    server.method('add', add);
    server.method('countNumberOfTimesCalled', countNumberOfTimesCalled);
  });

  lab.afterEach( async() => {
    await server.stop();
  });

  lab.test(' can stop an added method', async() => {
    numberOfTimesCalled = 0;
    await server.register({
      plugin: scheduler,
      options: {
        schedule: [
          {
            method: 'countNumberOfTimesCalled',
            time: 'every 1 seconds'
          }
        ]
      }
    });
    await server.start();
    server.methods.methodScheduler.stopSchedule('countNumberOfTimesCalled');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(2000);
  });
});

lab.experiment('hapi-method-scheduler: get and add method', { timeout: 5000 }, () => {
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

  lab.test(' can add a scheduled method after registered', async() => {
    numberOfTimesCalled = 0;
    await server.register({
      plugin: scheduler,
      options: {}
    });
    await server.start();
    server.methods.methodScheduler.startSchedule({
      method: 'countNumberOfTimesCalled',
      time: 'every 1 seconds'
    });
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(2000);
  });

  lab.test(' can get an existing method schedule', async () => {
    numberOfTimesCalled = 0;
    await server.register({
      plugin: scheduler,
      options: {
        schedule: [
          {
            method: 'countNumberOfTimesCalled',
            time: 'every 1 seconds'
          }
        ]
      }
    });
    await server.start();
    const method = server.methods.methodScheduler.getSchedule('countNumberOfTimesCalled');
    Code.expect(typeof method).to.equal('object');
    Code.expect(typeof method.method).to.equal('function');
    Code.expect(typeof method.executingSchedule).to.equal('object');
  });

  lab.test('can assign multiple copies of the same method with different labels', { timeout: 5000 }, async() => {
    numberOfTimesCalled = 0;
    await server.register({
      plugin: scheduler,
      options: {}
    });
    await server.start();
    server.methods.methodScheduler.startSchedule({
      label: 'label1',
      method: 'countNumberOfTimesCalled',
      time: 'every 1 seconds'
    });
    server.methods.methodScheduler.startSchedule({
      label: 'label2',
      method: 'countNumberOfTimesCalled',
      time: 'every 1 seconds'
    });
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(2500);
    Code.expect(numberOfTimesCalled).to.be.greaterThan(4);
  });

  lab.test('throws error if you register multiple functions with the same label', { timeout: 5000 }, async() => {
    numberOfTimesCalled = 0;
    await server.register({
      plugin: scheduler,
      options: {}
    });
    await server.start();
    server.methods.methodScheduler.startSchedule({
      label: 'label1',
      method: 'countNumberOfTimesCalled',
      time: 'every 1 seconds'
    });
    server.methods.methodScheduler.startSchedule({
      label: 'label1',
      method: 'countNumberOfTimesCalled',
      time: 'every 1 seconds'
    });
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(2000);
  });
});
