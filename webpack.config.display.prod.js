const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.display');

module.exports = merge(baseConfig, {
  mode: 'production',
});
