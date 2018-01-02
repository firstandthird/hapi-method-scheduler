const register = (server, options) => {
  server.expose('countNumberOfTimesCalled', () => {
    options.numberOfTimesCalled ++;
    return options.numberOfTimesCalled;
  });
};

exports.plugin = {
  register,
  once: true,
  pkg: require('../package.json')
};
