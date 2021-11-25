import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ServerStyleSheets } from '@material-ui/core/styles';
import uEmojiParser from 'universal-emoji-parser';
import App from './display/components/app';

const app = express();

app.set('view engine', 'ejs');
// production bundle does not link the ejs module for some reason
// eslint-disable-next-line no-underscore-dangle
app.engine('ejs', require('ejs').__express);

const isDevEnv = process.env.NODE_ENV === 'development';
// if (isDevEnv) {
//   app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header(
//       'Access-Control-Allow-Headers',
//       'Origin, X-Requested-With, Content-Type, Accept'
//     );
//     console.log('adding CORS headers');
//     next();
//   });
// }

const resourcePath =
  isDevEnv || process.env.DEBUG_PROD === 'true' ? '' : '/resources';

app.set(
  'views',
  path.join(__dirname, `../..${resourcePath}/assets/dist/views`)
);

app.use(
  '/',
  express.static(
    path.join(__dirname, `../..${resourcePath}/assets/dist/static`)
  )
);
app.use(
  '/assets/sounds',
  express.static(path.join(__dirname, `../..${resourcePath}/assets/sounds`))
);
app.use(
  '/assets/emotes',
  express.static(path.join(__dirname, `../..${resourcePath}/assets/emotes`))
);

const manifest = fs.readFileSync(
  path.join(__dirname, `../..${resourcePath}/assets/dist/static/manifest.json`),
  'utf-8'
);

const assets = JSON.parse(manifest);

// The request arg is not needed here but trips up lint and type checks
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
app.get('/', (req: express.Request, res: express.Response) => {
  const sheets = new ServerStyleSheets();
  const component = ReactDOMServer.renderToString(
    sheets.collect(React.createElement(App))
  );
  const css = sheets.toString();
  res.render('display', { assets, component, css });
});

// Client bundle throws a lot of errors attempting to package static emote libraries
// The server node environment can handle the static files in the bundle
app.get('/emotes', (req: express.Request, res: express.Response) => {
  const emojiString = req.query.string;
  const emojiElement = uEmojiParser.parse(emojiString);
  let result = false;

  if (emojiString !== emojiElement) {
    result = true;
  }

  res.json({
    value: emojiElement,
    found: result,
  });
});

const server = createServer(app);
const io = new Server(server, {
  // TODO IMPORTANT is this only needed in dev env?
  cors: { origin: 'http://localhost:1212', methods: ['GET', 'POST'] },
});

io.on('connection', (socket: Socket) => {
  socket.on('phraseSend', (data) => {
    socket.broadcast.emit('phraseRender', data);
  });
});

export default server;
