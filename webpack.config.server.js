const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  name: 'server',
  entry: {
    server: path.resolve(__dirname, 'server', 'server.ts'),
  },
  mode: 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'assets/dist'),
    filename: '[name].js',
  },
  externals: [nodeExternals()],
  resolve: {
    extensions: ['.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
      },
    ],
  },
  target: 'node',
  node: {
    __dirname: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ context: 'server', from: 'views', to: 'views' }],
    }),
  ],
};
