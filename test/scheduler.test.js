'use strict';
const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const scheduler = require('../index.js');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

lab.experiment('hapi-method-scheduler', () => {
  let server;

  lab.beforeEach(() => {
    server = new Hapi.Server({ port: 3000 });
  });

  lab.afterEach(async() => {
    await server.stop();
  });

  lab.test(' adds a method and calls it at regular intervals using cron syntax', async() => {
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
    Code.expect(numberOfTimesCalled).to.be.above(2);
  });

  lab.test(' adds a method and calls it with parameters at regular intervals ', async() => {
    let addResult = 0;
    server.method('add', (a, b) => {
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
    Code.expect(addResult).to.be.above(4);
  });
});
