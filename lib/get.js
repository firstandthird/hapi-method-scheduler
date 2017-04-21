'use strict';
module.exports = (methodExecutionData, methodName) => {
  for (let i = 0; i < methodExecutionData.length; i++) {
    if (methodExecutionData[i].methodName === methodName) {
      return methodExecutionData[i];
    }
  }
};
