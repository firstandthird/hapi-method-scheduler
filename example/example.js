"use strict"
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
      schedule: [
        {
          method : 'math.add',
          time : 'every 4 seconds',
          params : [1,3]
        },
        {
          method : 'add',
          cron : "0/5 * * * * *",
          params : [20,20]
        },
        // test unparsable time:
        {
          method : 'math.add',
          time : 'asljkdf;124ljk;',
          params : [21,21]
        },
        // test undefined server method:
        {
          method : 'asdf.sdfdf',
          time : 'asljkdf;124ljk;',
          params : [2,2]
        },
        {
          method : 'add',
          params : [20,20]
        },

      ]
    }
  },
  function(err){
    server.log(['hapi-method-routes', 'info'], "module registered")
    if (err) {
      server.log(['hapi-method-routes', 'error'], err);
    }
    else{
      server.start(function () {
      });
    }
});
