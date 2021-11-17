import { shell } from 'electron';

import express from 'express';
import http from 'http';
import { Server } from 'node:http';
import { EventEmitter } from 'stream';
import * as Theme from './components/Theme';

const theme = Theme.default();
const head = `<head>
  <title>Oratio Authorization</title>
  <style>
    body {
      background-color: ${theme.palette.background.default};
      color: ${theme.palette.primary.main};
    }
  </style>
</head>`;

const authBaseURL = 'https://id.twitch.tv/oauth2/authorize';
// the permissions we need
const scopes = 'chat:edit chat:read';

interface AuthData {
  access_token: string;
  scopes: string;
  token_type: string;
}

export default class TwitchAuth extends EventEmitter {
  // will be -1 if not set yet
  port: number;

  // we have to register a redirect url for the twitch app, so
  // we can only use 10 max ports
  #validPorts: number[];

  #app: express.Express | null;

  #server: Server | null;

  #accessToken: string | null;

  #tokenType: string | null;

  constructor(validPorts: number[], public clientId: string) {
    super();
    this.#validPorts = validPorts;
    this.port = -1;
    this.clientId = clientId;
    this.#app = null;
    this.#server = null;
    this.#accessToken = null;
    this.#tokenType = null;

    // server is listening -> open page in browser
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.on('listening', (_port: number) => {
      this.openAuthPage();
    });
  }

  static redirectURI(port: number): string {
    return encodeURIComponent(`http://localhost:${port}/auth`);
  }

  fullAuthURI(port: number): string {
    return `${authBaseURL}\
?client_id=${this.clientId}\
&redirect_uri=${TwitchAuth.redirectURI(port)}\
&response_type=token\
&scope=${scopes}`;
  }

  openAuthPage() {
    // port not set if < 0
    if (this.port < 0) {
      return;
    }
    // navigate user to auth url in their default browser
    shell.openExternal(this.fullAuthURI(this.port));
  }

  async setUpLoopback() {
    this.#app = express();

    this.#app.get('/auth', (_req: express.Request, res: express.Response) => {
      res.set('Content-Type', 'text/html');
      // data is in the hash code of the address which is not sent to the server
      // so we need to redirect
      res.send(`
        ${head}
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            console.log('loc: ', window.location);
            const hashData = window.location.hash;
            window.location.href = '/auth-data?' + hashData.substring(1);
          });
        </script>
        `);
    });

    this.#app.get(
      '/auth-data',
      (
        req: express.Request<never, never, never, AuthData>,
        res: express.Response
      ) => {
        // received redirect from ourseves -> extract data from query params
        this.#accessToken = req.query.access_token;
        this.#tokenType = req.query.token_type;
        this.emit('receivedToken', this.#accessToken, this.#tokenType);

        res.set('Content-Type', 'text/html');
        res.send(`${head}
        <div style="margin: auto; width: 100%; text-align: center;">
          <h1>Authorization successful!</h1>
        </div>`);
      }
    );

    this.#server = http.createServer(this.#app);
    this.startServer(this.#server, 0);
  }

  startServer(server: http.Server, validPortIndex: number) {
    const onSuccess = () => {
      this.port = this.#validPorts[validPortIndex];
      console.log(`Auth loopback listening on http://localhost:${this.port}`);
      this.emit('listening', this.port);
    };

    const onError = (err: NodeJS.ErrnoException) => {
      server
        .removeListener('error', onError)
        .removeListener('listening', onSuccess);

      if (err.code === 'EADDRINUSE') {
        if (validPortIndex === this.#validPorts.length - 1) {
          this.emit('allValidPortsInUse');
        } else {
          this.startServer(server, validPortIndex + 1);
        }
      }
    };

    server
      .listen(this.#validPorts[validPortIndex])
      .on('error', onError)
      .on('listening', onSuccess);
  }

  async shutDown() {
    if (this.#server !== null) {
      this.#server.close();
    }
  }
}
