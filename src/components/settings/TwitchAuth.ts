import { remote } from 'electron';

import express from 'express';
import { Server } from 'node:http';
import { EventEmitter } from 'stream';

const TWITCH_CLIENT_ID = remote.getGlobal('TWITCH_CLIENT_ID');
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

  constructor(public port: number) {
    super();
    this.port = port;
    this.#app = null;
    this.#server = null;
    this.#redirectURI = encodeURIComponent(`http://localhost:${port}/auth`);
    this.#fullAuthURI = `${authBaseURL}\
?client_id=${TWITCH_CLIENT_ID}\
&redirect_uri=${this.#redirectURI}\
&response_type=token\
&scope=${scopes}`;
    this.#accessToken = null;
    this.#tokenType = null;
  }

  openAuthPage() {
    // navigate user to auth url in their default browser
    remote.require('electron').shell.openExternal(this.#fullAuthURI);
  }

  async setUpLoopback() {
    this.#app = express();

    this.#app.get('/auth', (req: express.Request, res: express.Response) => {
      console.log('get on auth');
      res.set('Content-Type', 'text/html');
      // data is in the hash code of the address which is not sent to the server
      // so we need to redirect
      res.send(`
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
        res.send(`<h2>Authorization successful!</h2>`);
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
