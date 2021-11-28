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
// dev:
// server.js folder (__dirname):  \Oratio\assets\dist
// server process.cwd():  \Oratio
// prod:
// server.js folder (__dirname):  \Oratio\release\win-unpacked\resources\assets\dist
// server proces.cwd():  \Oratio\release\win-unpacked (where Oratio.exe is)
const assetsPath = '..';

app.set('views', path.join(__dirname, `${assetsPath}/dist/views`));

app.use('/', express.static(path.join(__dirname, `${assetsPath}/dist/static`)));
app.use(
  '/assets/sounds',
  express.static(path.join(__dirname, `${assetsPath}/sounds`))
);
app.use(
  '/assets/emotes',
  express.static(path.join(__dirname, `${assetsPath}/emotes`))
);

const manifest = fs.readFileSync(
  path.join(__dirname, `${assetsPath}/dist/static/manifest.json`),
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
  res.render('display', { assets, component, css, isDevEnv });
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

process.on('message', (m) => {
  if (m.action === 'listen') {
    const port = m.port || 4563;
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } else if (m.action === 'stop') {
    server.close();
    process.exit(0);
  }
});

export default server;
