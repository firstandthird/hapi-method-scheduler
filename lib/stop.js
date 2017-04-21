'use strict';
module.exports = (server, methodExecutionData, methodName) => {
  const method = server.methods.methodScheduler.getSchedule(methodName);
  method.executingSchedule.clear();
  methodExecutionData = methodExecutionData.filter((el) => el !== method);
};
