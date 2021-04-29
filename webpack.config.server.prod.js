const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.server');

module.exports = merge(baseConfig, {
  mode: 'production',
});
