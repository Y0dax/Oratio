import React from 'react';

import {
  makeStyles,
  createStyles,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import { Button, Grid } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Theme from './Theme';

// TODO not good to mix ES6 and ES5 syntax but standard import failed
// should find a way to consolidate this
const fs = require('fs');
const https = require('https');

export const emoteNameToUrl = {};
export const lowercaseToEmoteName = {};

const assetLoc =
  process.env.NODE_ENV === 'development'
    ? 'assets/emotes'
    : 'resources/assets/emotes';
function findFiles(dir: string, return_prefix: string) {
  const files = [];
  for (const file of fs.readdirSync(dir)) {
    const stats = fs.statSync(`${dir}/${file}`);
    if (stats.isDirectory()) {
      for (const f of findFiles(`${dir}/${file}`, `${file}/`)) {
        files.push(f);
      }
    } else if (file != '.DS_Store') {
      files.push(file);
    }
  }
  return files.map((f) => return_prefix + f);
}

function clearObject(obj) {
  for (const k in obj) {
    delete obj[k];
  }
}
// looks for emotes in assetLoc and puts them into the maps.
function reloadEmotes() {
  clearObject(emoteNameToUrl);
  clearObject(lowercaseToEmoteName);
  for (const file of findFiles(assetLoc, `${assetLoc}/`)) {
    const emoteName = file.substr(file.lastIndexOf('/') + 1).split('.')[0];
    emoteNameToUrl[emoteName] = `../${escape(file)}`;
  }
  console.log(emoteNameToUrl);
}
reloadEmotes();

/**
 * Downloads file from remote HTTPS host and puts its contents to the
 * specified location but adds the appropriate file extension from the MIME type.
 */
async function download(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    let fileInfo = null;

    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }

      fileInfo = {
        mime: response.headers['content-type'],
        size: parseInt(response.headers['content-length'], 10),
      };

      response.pipe(file);
    });

    // The destination stream is ended by the time it's called
    file.on('finish', () => {
      const extension = (fileInfo.mime || '/png').split('/')[1];
      const filePathWithExtension = `${filePath}.${extension}`;
      fs.renameSync(filePath, filePathWithExtension);
      console.log(`downloaded emote: ${url} -> ${filePath}`);
      resolve(filePathWithExtension);
    });

    request.on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });

    file.on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });

    request.end();
  });
}

function fix_emote_url(url) {
  if (url.startsWith('//')) url = `https:${url}`;
  // upgrade resolution
  url = url.replace(/\/2x$/i, '/3x');
  url = url.replace(/\/2\.0$/i, '/3.0');
  if (/frankerfacez_emote\/3\/1$/i.exec(url)) url = url.replace(/\/1$/, '/2');
  return url;
}

/*
Was generated from a twitch page using this:
x=JSON.stringify([...document.querySelectorAll('#all-emotes-group .group-header')].map(g => ({groupName: g.getAttribute('data-emote-channel'),
  emotes: Object.fromEntries([...g.querySelectorAll('.emote')].map(e => [e.getAttribute('data-emote'), e.querySelector('img').getAttribute('src')]))
})))
*/
async function fetchEmotes(emoteGroups) {
  const fileInfoPromises = [];
  for (const group of emoteGroups) {
    const groupDir = `${assetLoc}/${group.groupName}`;
    fs.mkdirSync(groupDir, { recursive: true });
    for (const [name, url] of Object.entries(group.emotes)) {
      const filePath = `${groupDir}/${name}`;
      fileInfoPromises.push(download(fix_emote_url(url), filePath));
    }
  }
  await Promise.all(fileInfoPromises);
}

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      flexGrow: 1,
      background: theme.palette.background.default,
      color: 'white',
      padding: theme.spacing(4),
    },
    content: {},
    text: {
      color: 'white',
      fontSize: '3rem',
      textAlign: 'center',
    },
    button: {
      padding: theme.spacing(2),
      textAlign: 'center',
    },
    link: {
      textDecoration: 'none',
    },
    bottomButtons: {
      marginTop: '40px',
    },

    emote: {
      display: 'inline-block',
      width: 'auto',
      height: 'auto',
      'max-height': '2em',
      'max-width': '1000px',
    },
  })
);

export function Emote(attrs) {
  const { emoteName } = attrs;
  const classes = useStyles();
  if (emoteName in emoteNameToUrl) {
    return <img src={emoteNameToUrl[emoteName]} className={classes.emote} />;
  }
  console.log(emoteName);
  return <span>{emoteName}</span>;
}

export default function Emotes() {
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <div className={classes.content}>
          <h2>Emote preview</h2>
          <table>
            <tbody>
              {Object.entries(emoteNameToUrl).map(([name, path]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>
                    <Emote emoteName={name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Grid
            container
            direction="row"
            spacing={3}
            className={classes.bottomButtons}
          >
            <Grid item xs={4}>
              <Link to="/preferences" className={classes.link}>
                <Button
                  id="open-preferences"
                  variant="contained"
                  className={classes.button}
                  color="primary"
                >
                  {t('Back')}
                </Button>
              </Link>
            </Grid>
          </Grid>
        </div>
      </div>
    </MuiThemeProvider>
  );
}
