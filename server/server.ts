import express from 'express';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from '../display/components/app';

const server = express();

server.set('view engine', 'ejs');

server.set('views', path.join(__dirname, '../dist/views'));

server.use('/', express.static(path.join(__dirname, '../dist/static')));

const manifest = fs.readFileSync(
  path.join(__dirname, '../dist/static/manifest.json'),
  'utf-8'
);
const assets = JSON.parse(manifest);

server.get('/', (req, res) => {
  const component = ReactDOMServer.renderToString(React.createElement(App));
  res.render('display', { assets, component });
});

module.exports.server = server;
