import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from '../display/components/app';

const app = express();

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '../dist/views'));

app.use('/', express.static(path.join(__dirname, '../dist/static')));
app.use(
  '/assets/sounds',
  express.static(path.join(__dirname, '../assets/sounds'))
);

const manifest = fs.readFileSync(
  path.join(__dirname, '../dist/static/manifest.json'),
  'utf-8'
);

const assets = JSON.parse(manifest);

app.get('/', (req: express.Request, res: express.Response) => {
  const component = ReactDOMServer.renderToString(React.createElement(App));
  res.render('display', { assets, component });
});

const server = createServer(app);
const io = new Server(server);

io.on('connection', (socket: Socket) => {
  socket.on('phraseSend', (data) => {
    socket.broadcast.emit('phraseRender', data);
  });
});

module.exports.server = server;
