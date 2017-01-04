"use strict";
var _ = require("lodash");
var Hapi = require("hapi");
var module = require("../index.js");

// an example of a method to export. the last param of your method will be a 'done' callback
// who's first param is any error message and second is the output of the method
function add(a, b, done){
  var result = a+b;
  done(null, result);
}

// another example, this one will be added to server.method.math
// to demonstrate how methods can be namespaced:
function mathAdd(a,b,done){
  console.log('MATHADD')
  try{
    var floatA = parseFloat(a);
    var floatB = parseFloat(b);
    var result = floatA + floatB;
    done(null,result);
  }catch(exc){
    done(exc);
  }
}

var server = new Hapi.Server( {
  debug : {
      log : ['info', 'error']
    },
});
server.method('add', add);
server.method('math.add', mathAdd)
server.connection({ port: 3000 });
server.register({
    register : module,
    options : {
      timezone: 'America/Los_Angeles',
      schedule: [
        // text-style scheduled task
        {
          method : 'math.add',
          time : 'every 1 second after 17:03 on Tuesday',
          params : [1,3]
        },
        // cron-style scheduled task:
        // {
        //   method : 'add',
        //   cron : "0/5 * * * * *",
        //   params : [20,20]
        // },
        // {
        //   method : 'add',
        //   cron : "0/20 * * * * *",
        //   params : [2,20],
        //   runOnStart: true
        // },
        // uncomment these if you want to test how it handles erroneous submissions:
        // test unparsable time:
        // {
        //   method : 'math.add',
        //   time : 'asljkdf;124ljk;',
        //   params : [21,21]
        // },
        // // test undefined server method:
        // {
        //   method : 'asdf.sdfdf',
        //   time : 'every 4 seconds',
        //   params : [2,2]
        // },
        // // test no time specified:
        // {
        //   method : 'add',
        //   params : [20,20]
        // },

      ]
    }
  },
  function(err){
    server.log(['hapi-method-scheduler', 'info'], "module registered")
    if (err) {
      server.log(['hapi-method-scheduler', 'error'], err);
    }
    else{
      server.start(function () {
      });
    }
});
