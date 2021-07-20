const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const serverConfig = {
  name: 'server',
  entry: {
    server: path.resolve(__dirname, 'src/server', 'server.ts'),
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
      patterns: [{ context: 'src/server', from: 'views', to: 'views' }],
    }),
  ],
};

const clientConfig = {
  name: 'display',
  entry: {
    display: path.resolve(__dirname, 'src/server/display/display.tsx'),
  },
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    hot: true,
    proxy: {
        '*': {
            target: 'http://localhost:61299',
        }
    },
    port: 8080,
    host: '0.0.0.0',
    hot: true,
  },
  output: {
    path: path.resolve(`${__dirname}/assets/dist/static`),
    filename: '[name].js',
    publicPath: '',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  target: 'web',
  plugins: [new CleanWebpackPlugin(), new WebpackManifestPlugin(), new webpack.HotModuleReplacementPlugin({
  // Options...
})],
};

module.exports = [clientConfig, serverConfig];
