const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.server');

const serverConfig = merge(baseConfig[1], {
  mode: 'production',
});

const clientConfig = merge(baseConfig[0], {
  mode: 'production',
});

module.exports = [clientConfig, serverConfig];
