const path = require("path");

module.exports = (config, env) => {
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      "#":path.resolve(__dirname, "src/packages"),
    }}
  return config;
};
