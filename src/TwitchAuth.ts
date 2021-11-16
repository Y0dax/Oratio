import { shell } from 'electron';

import express from 'express';
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
  #app: express.Express | null;

  #server: Server | null;

  #redirectURI: string;

  #fullAuthURI: string;

  #accessToken: string | null;

  #tokenType: string | null;

  constructor(public port: number, public clientId: string) {
    super();
    this.port = port;
    this.clientId = clientId;
    this.#app = null;
    this.#server = null;
    this.#redirectURI = encodeURIComponent(`http://localhost:${port}/auth`);
    this.#fullAuthURI = `${authBaseURL}\
?client_id=${this.clientId}\
&redirect_uri=${this.#redirectURI}\
&response_type=token\
&scope=${scopes}`;
    this.#accessToken = null;
    this.#tokenType = null;
  }

  openAuthPage() {
    // navigate user to auth url in their default browser
    shell.openExternal(this.#fullAuthURI);
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

    this.#server = this.#app.listen(this.port, () => {
      console.log(`Auth loopback listening on http://localhost:${this.port}`);
    });
  }

  async shutDown() {
    if (this.#server !== null) {
      this.#server.close();
    }
  }
}
