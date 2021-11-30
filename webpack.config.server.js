const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CopyPlugin = require('copy-webpack-plugin');

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

  // this works but bundles all the dependencies (with dupes) into server.js
  // we have to do this, since I could not find a way to share dependencies
  // between the main electron bundle and the forked process that is the
  // server (this config)
  // we could write common deps into a separate module/"dll" but I don't know
  // how to do that using webpack (in separate configs otherwise we could
  // use multiple entries with dependOn a shared module) and since the file is
  // local anyways the gains would be minor (~1MiB size + the load-up of that)
  externals: [],
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, 'src/server'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
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
  plugins: [new CleanWebpackPlugin(), new WebpackManifestPlugin()],
};

module.exports = [clientConfig, serverConfig];
