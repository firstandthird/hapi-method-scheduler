"use strict";
var _ = require("lodash");
var Hapi = require("hapi");
var module = require("../index.js");

// an example of a method to export. the last param of your method will be a 'done' callback
// who's first param is any error message and second is the output of the method
function add(a, b) {
  var result = a+b;
  return result;
}

// another example, this one will be added to server.method.math
// to demonstrate how methods can be namespaced:
function mathAdd(a,b,done){
  console.log('MATHADD')
  try{
    var floatA = parseFloat(a);
    var floatB = parseFloat(b);
    var result = floatA + floatB;
    return result;
  }catch(exc){
    throw exc;
  }
}

const f = async () => {
  const server = new Hapi.Server( {
    debug : {
        log : ['info', 'error']
      },
    port: 3000
  });
  server.method('add', add);
  server.method('math.add', mathAdd)
  await server.register({
    plugin: module,
    options: {
      timezone: 'America/Los_Angeles',
      schedule: [
        // text-style scheduled task
        {
          method : 'math.add',
          time : 'every 1 second after 17:25 on Tuesday',
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
  });
  server.log(['hapi-method-scheduler', 'info'], "module registered")
  await server.start();
};

f();
