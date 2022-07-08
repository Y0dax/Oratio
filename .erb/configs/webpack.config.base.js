/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';
import { dependencies as externals } from '../../src/package.json';


export const getCSP = () => {
  const isDevEnv = process.env.NODE_ENV !== 'production';
  // we need 'unsafe-inline' for style-src since MUI (at least v4) does not provide
  // a good alternative
  // 'unsafe-eval' for script-src is needed in dev mode for the devtool/sourcemap rebuilds
  // NOTE: omitting the protocol means it will use "the current protocol"
  // -> works in dev env (since we use the dev server with http) but not in prod
  //    where file:// is used
  return `script-src 'self' http://localhost:4563 ${isDevEnv ? "'unsafe-eval'" : ''};
default-src 'self' http://localhost:4563;
style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' http://localhost:4563 ws://localhost:4563 wss://irc-ws.chat.twitch.tv https://*.tts.speech.microsoft.com wss://*.tts.speech.microsoft.com;
media-src 'self' blob: https://*.tts.speech.microsoft.com;
img-src 'self' data:`;
};

export default {
  externals: [...Object.keys(externals || {})],

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
    ],
  },

  output: {
    path: path.join(__dirname, '../../src'),
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, '../src'), 'node_modules'],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      TWITCH_CLIENT_ID: '2f58s8a4cjlbel33rm48kutmmdh2sm',
    }),
  ],
};
