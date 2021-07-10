import React from 'react';

import {
  makeStyles,
  createStyles,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import { Button, Grid } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import openExplorer from 'open-file-explorer';
import * as Theme from './Theme';

// TODO not good to mix ES6 and ES5 syntax but standard import failed
// should find a way to consolidate this
const fs = require('fs');
const https = require('https');

export const emoteNameToUrl: { [key: string]: string } = {};
export const lowercaseToEmoteName: { [key: string]: string } = {};

const assetLoc =
  process.env.NODE_ENV === 'development'
    ? 'assets/emotes'
    : 'resources/assets/emotes';
function findFiles(dir: string, return_prefix: string): string[] {
  const files = [];
  for (const file of fs.readdirSync(dir)) {
    const stats = fs.statSync(`${dir}/${file}`);
    if (stats.isDirectory()) {
      for (const f of findFiles(`${dir}/${file}`, `${file}/`)) {
        files.push(f);
      }
    } else if (file !== '.DS_Store') {
      files.push(file);
    }
  }
  return files.map((f) => return_prefix + f);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clearObject(obj: any) {
  for (const k of Object.keys(obj)) {
    delete obj[k];
  }
}
// looks for emotes in assetLoc and puts them into the maps.
function reloadEmotes() {
  clearObject(emoteNameToUrl);
  clearObject(lowercaseToEmoteName);
  for (const file of findFiles(assetLoc, `${assetLoc}/`)) {
    const emoteName: string = file
      .substr(file.lastIndexOf('/') + 1)
      .split('.')[0];
    emoteNameToUrl[emoteName] = `../${escape(file)}`;
    lowercaseToEmoteName[emoteName.toLowerCase()] = emoteName;
  }
}
reloadEmotes();

/**
 * Downloads file from remote HTTPS host and puts its contents to the
 * specified location but adds the appropriate file extension from the MIME type.
 */
async function download(url: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    let fileInfo: { mime?: string; size?: number } = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = https.get(url, (response: any) => {
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
      resolve(filePathWithExtension);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.on('error', (err: any) => {
      fs.unlink(filePath, () => reject(err));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file.on('error', (err: any) => {
      fs.unlink(filePath, () => reject(err));
    });

    request.end();
  });
}

function fixEmoteURL(url_: string): string {
  let url = url_;
  if (url.startsWith('//')) url = `https:${url}`;
  // upgrade resolution
  url = url.replace(/\/2x$/i, '/3x');
  url = url.replace(/\/2\.0$/i, '/3.0');
  if (/frankerfacez_emote\/3\/1$/i.exec(url)) url = url.replace(/\/1$/, '/2');
  return url;
}

const emoteScrapeScript = `
button = document.createElement('button'); document.body.append(button); button.innerText = "copy emotes";
button.style = "display: float; width:100px; height:100px; background-color: cornflowerblue; z-index: 1000000; text-align: center; border-radius:10px";
button.onclick = () => { navigator.clipboard.writeText(JSON.stringify([...document.querySelectorAll('#all-emotes-group .group-header')].map(g => ({groupName: g.getAttribute('data-emote-channel'),
  emotes: Object.fromEntries([...g.querySelectorAll('.emote')].map(e => [e.getAttribute('data-emote'), e.querySelector('img').getAttribute('src')]))
}))));
button.innerText="emotes copied!"
};`;

async function fetchEmotes(
  emoteGroups: { groupName: string; emotes: { [name: string]: string } }[]
): Promise<Promise<string>[]> {
  const promises = [];
  for (const group of emoteGroups) {
    const groupDir = `${assetLoc}/${group.groupName}`;
    fs.mkdirSync(groupDir, { recursive: true });
    for (const [name, url] of Object.entries(group.emotes)) {
      const filePath = `${groupDir}/${name}`;
      if (url) {
        promises.push(download(fixEmoteURL(url), filePath));
      } else {
        // eslint-disable-next-line no-console
        console.warn('emote missing url: ', name);
      }
    }
  }
  return promises;
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
      margin: '5px',
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

export function Emote(attrs: { emoteName: string }) {
  const { emoteName } = attrs;
  const classes = useStyles();
  if (emoteName in emoteNameToUrl) {
    return (
      <img
        src={emoteNameToUrl[emoteName]}
        className={classes.emote}
        alt={emoteName}
      />
    );
  }
  return <span>{emoteName}</span>;
}

export default function Emotes() {
  const classes = useStyles();
  const { t } = useTranslation();

  function openEmoteDirectory() {
    openExplorer(assetLoc);
  }

  const [, updateState] = React.useState<Record<string, never>>();
  const forceUpdate = React.useCallback(() => updateState({}), []);
  function reloadEmotesAndUpdate() {
    reloadEmotes();
    forceUpdate();
  }

  const [copyButtonTitle, setCopyButtonTitle] = React.useState<string>(
    t('Copy Code')
  );
  function copyEmoteScrapeScript() {
    navigator.clipboard.writeText(emoteScrapeScript);
    setCopyButtonTitle(t('Code Copied!'));
  }

  const [importState, setImportState] = React.useState<string>('');
  async function importEmotesFromClipboard() {
    try {
      setImportState('import started');
      const emoteGroups = JSON.parse(await navigator.clipboard.readText());
      const promises = await fetchEmotes(
        emoteGroups
      );
      if (promises.length === 0) {
        setImportState('Did you forget step 3? JSON loaded but no emotes found.');
        return;
      }
      let numFinished = 0;
      const progressUpdate = (message: string) => {
        setImportState(`[${numFinished}/${promises.length}] ${message}`);
      };
      progressUpdate('Started downloads...');
      await Promise.all(
        promises.map((p) =>
          p.then((filePathWithExtension: string) => {
            numFinished += 1;
            progressUpdate(filePathWithExtension);
            return null;
          })
        )
      );
      progressUpdate('Done!');
    } catch (err) {
      setImportState(`error: ${err}`);
      throw err;
    }
    reloadEmotesAndUpdate();
  }

  const element = (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <div className={classes.content}>
          <h2>Emote Tools</h2>

          <Button
            id="open-emote-directory"
            variant="contained"
            className={classes.button}
            color="primary"
            onClick={openEmoteDirectory}
          >
            {t('Open Emote Directory')}
          </Button>
          <Button
            id="reload-emotes"
            variant="contained"
            className={classes.button}
            color="primary"
            onClick={reloadEmotesAndUpdate}
          >
            {t('Reload emotes')}
          </Button>

          <h2>Importing emotes</h2>
          <div>
            You can import/manage emotes manually using the buttons above and
            placing images into that directory.
          </div>
          <div>
            To import existing Twitch/BTTV/FFZ emotes you can do the following:
            <ol>
              <li>
                Install BTTV in your browser if you haven&rsquo;t already.
              </li>
              <li> Open your twitch channel page with chat. </li>
              <li> Open the BTTV emote panel by clicking the button to the left of the &rdquo;Chat&rdquo; Button and scroll though to load all the emotes. </li>
              <li>
                Open the browser console: Browser menu &gt; More Tools &gt; Web
                Developer Tools &gt; &rdquo;Console&rdquo; tab
              </li>
              <li>
                Note that pasting code into the browser console is not normal
                and you should trust or verify the script. See
                {' '}<a href="https://en.wikipedia.org/wiki/Self-XSS" target="_blank">Self-XSS</a>{' '}
                for more info.
              </li>
              <li>
                Click this button:
                <Button
                  id="script-copy"
                  variant="contained"
                  className={classes.button}
                  color="primary"
                  onClick={copyEmoteScrapeScript}
                >
                  {copyButtonTitle}
                </Button>
              </li>
              <li>
                If you trust the script, paste it in the console and hit enter.
              </li>
              <li>
                A &rdquo;Copy emotes&rdquo; button should have appeared on your
                twitch stream. Click it.
              </li>
              <li>
                Your clipboard should now contain a JSON string with emote
                groups.
              </li>
              <li>
                Click this button:
                <Button
                  id="open-preferences"
                  variant="contained"
                  className={classes.button}
                  color="primary"
                  onClick={importEmotesFromClipboard}
                >
                  {t('Import Emotes')}
                </Button>
                <span>{importState}</span>
              </li>
            </ol>
          </div>

          <h2>Emote preview</h2>
          <table>
            <tbody>
              {Object.keys(emoteNameToUrl)
                .sort()
                .map((name: string) => (
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
  return element;
}
