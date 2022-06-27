const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const serverConfig = {
  name: 'server',
  entry: {
    // server: [path.resolve(__dirname, 'src/server', 'server.ts')],
    // server: ['core-js', 'regenerator-runtime/runtime', path.resolve(__dirname, 'src/server', 'server.ts')],
    server: ['core-js', path.resolve(__dirname, 'src/server', 'server.ts')],
  },
  mode: 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'assets/dist'),
    filename: '[name].js',
    publicPath: '',
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
    modules: [
      path.join(__dirname, 'src/server'),
      path.resolve(__dirname, 'node_modules'),
    ], // 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: 'babel-loader',
        // exclude node_modules so we don't transpile core-js with babel
        // exclude: /node_modules/,
        exclude: [/\bcore-js\b/, /\bwebpack\/buildin\b/],
        options: {
          // modules: cjs basically does the same as plugin-transform-modules-commonjs
          presets: [
            [
              '@babel/preset-env',
              {
                modules: 'cjs',
                useBuiltIns: 'usage',
                corejs: '3.10.1',
              },
            ],
            '@babel/preset-typescript',
            '@babel/preset-react',
          ],
          // plugins: [
          //   // transforms import/export to require etc. but fails at runtime:
          //   // Error: Cannot find module './objectWithoutPropertiesLoose.js'
          //   '@babel/plugin-transform-modules-commonjs',
          //   '@babel/plugin-transform-runtime',
          //   '@babel/plugin-proposal-export-default-from',
          // ],
          targets: { node: '12.18' },
          // allows import/export if present otherwise treated as script -> does not work
          sourceType: 'unambiguous',
        },
      },
      // {
      //   test: /\.tsx?$/,
      //   loader: 'ts-loader',
      //   exclude: /node_modules/,
      // }
    ],
  },

  target: 'node',
  node: {
    // __dirname: false,
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
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
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
