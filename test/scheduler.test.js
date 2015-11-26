// this test takes about 20 seconds to run

var Code = require('code');   // assertion library
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var Hapi = require('hapi');
var module = require("../index.js");


lab.experiment('hapi-method-scheduler', function() {
  var server;
  var numberOfTimesCalled = 0;
  var addResult = 0;

  var countNumberOfTimesCalled = function (done){
    console.log("countNumberOfTimesCalled()")
    numberOfTimesCalled ++;
    done(null, numberOfTimesCalled);
  }
  var add = function (a, b, done){
    console.log(" add called with %s, %s", a, b);
    addResult += a+b;
    done(null, addResult);
  }

  lab.beforeEach(function(done) {
    server = new Hapi.Server();
    server.method('add', add);
    server.method('countNumberOfTimesCalled', countNumberOfTimesCalled);
    server.connection({ port: 3000 });
    done();
  });

  lab.afterEach(function(done){
    server.stop(done);
  })
  lab.test(' adds a method and calls it at regular intervals using later.js syntax', function(done){
    numberOfTimesCalled = 0;
    server.register({
      register : module,
      options : {
        schedule: [
          {
            method : 'countNumberOfTimesCalled',
            time : 'every 1 seconds'
          }
        ]
      }
    },
    function(err){
      server.start(function(){
        setTimeout(function checkOutput(){
          Code.expect(numberOfTimesCalled).to.equal(6);
          done();
        }, 7000);
      });
    });
  });

  lab.test(' adds a method and calls it at regular intervals using cron syntax', function(done){
    numberOfTimesCalled = 0;
    server.register({
      register : module,
      options : {
        schedule: [
          {
            method : 'countNumberOfTimesCalled',
            cron : "0/20 * * * * *"
          }
        ]
      }
    },
    function(err){
      server.start(function(){
        setTimeout(function(){
          console.log("%s calls", numberOfTimesCalled)
          Code.expect(numberOfTimesCalled).to.be.above(5).and.to.be.below(8);
          done();
        }, 6000);
      });
    });
  });

  lab.test(' adds a method and calls it with parameters at regular intervals ', function(done){
    server.register({
      register : module,
      options : {
        schedule: [
          {
            method : 'add',
            time : 'every 1 seconds',
            params : [1,3]
          }
        ]
      }
    },
    function(err){
      server.start(function(){
        setTimeout(function checkOutput(){
          Code.expect(addResult).to.equal(24);
          done();
        }, 7000);
      });
    });
  });

});
