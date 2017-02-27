'use strict';
const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const scheduler = require('../index.js');

lab.experiment('hapi-method-scheduler: stop method', () => {
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
    numberOfTimesCalled = 0;
    server = new Hapi.Server();
    server.method('add', add);
    server.method('countNumberOfTimesCalled', countNumberOfTimesCalled);
    server.connection({ port: 3000 });
    done();
  });

  lab.afterEach((done) => {
    server.stop(done);
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
        server.methods.methodScheduler.stopSchedule('countNumberOfTimesCalled');
        setTimeout(() => {
          Code.expect(numberOfTimesCalled).to.equal(0);
          done();
        }, 3000);
      });
    });
  });
});

lab.experiment('hapi-method-scheduler: get and add method', () => {
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
    numberOfTimesCalled = 0;
    server = new Hapi.Server();
    server.method('add', add);
    server.method('countNumberOfTimesCalled', countNumberOfTimesCalled);
    server.connection({ port: 3000 });
    done();
  });

  lab.afterEach((done) => {
    server.stop(done);
  });

  lab.test(' can add a scheduled method after registered', (done) => {
    numberOfTimesCalled = 0;
    server.register({
      register: scheduler,
      options: {}
    },
    (err) => {
      if (err) {
        throw err;
      }
      server.start(() => {
        server.methods.methodScheduler.startSchedule({
          method: 'countNumberOfTimesCalled',
          time: 'every 1 seconds'
        });
        setTimeout(() => {
          Code.expect(numberOfTimesCalled).to.equal(2);
          done();
        }, 2500);
      });
    });
  });
  lab.test(' can get an existing method schedule', (done) => {
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
        const method = server.methods.methodScheduler.getSchedule('countNumberOfTimesCalled');
        Code.expect(typeof method).to.equal('object');
        Code.expect(typeof method.method).to.equal('function');
        Code.expect(typeof method.executingSchedule).to.equal('object');
        done();
      });
    });
  });
});
