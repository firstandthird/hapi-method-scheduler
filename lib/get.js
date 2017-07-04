'use strict';
module.exports = (methodExecutionData, label) => {
  for (let i = 0; i < methodExecutionData.length; i++) {
    if (methodExecutionData[i].label === label) {
      return methodExecutionData[i];
    }
  }
};
