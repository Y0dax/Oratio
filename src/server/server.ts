import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import uEmojiParser from 'universal-emoji-parser';
import App from './display/components/app';

const app = express();

app.set('view engine', 'ejs');
// production bundle does not link the ejs module for some reason
// eslint-disable-next-line no-underscore-dangle
app.engine('ejs', require('ejs').__express);

app.set('views', path.join(__dirname, '../../assets/dist/views'));

app.use('/', express.static(path.join(__dirname, '../../assets/dist/static')));
app.use(
  '/assets/sounds',
  express.static(path.join(__dirname, '../../assets/sounds'))
);
app.use(
  '/assets/emotes',
  express.static(path.join(__dirname, '../../assets/emotes'))
);

const manifest = fs.readFileSync(
  path.join(__dirname, '../../assets/dist/static/manifest.json'),
  'utf-8'
);

const assets = JSON.parse(manifest);

// The request arg is not needed here but trips up lint and type checks
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
app.get('/', (req: express.Request, res: express.Response) => {
  const component = ReactDOMServer.renderToString(React.createElement(App));
  res.render('display', { assets, component });
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
const io = new Server(server);

io.on('connection', (socket: Socket) => {
  socket.on('phraseSend', (data) => {
    socket.broadcast.emit('phraseRender', data);
  });
});

export default server;
