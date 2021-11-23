import React from 'react';
import { ipcRenderer } from 'electron';

import {
  makeStyles,
  createStyles,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import { Button, Grid } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import red from '@material-ui/core/colors/red';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import openExplorer from 'open-file-explorer';
import * as https from 'https';
import * as fs from 'fs';
import * as Theme from './Theme';
import TwitchApi, { Emote as EmoteCommon } from './TwitchApi';

export const emoteNameToUrl: { [key: string]: string } = {};
export const lowercaseToEmoteName: { [key: string]: string } = {};
let asyncLoadingFinished = false;

// path relative to resources/app.asar
// app.getAppPath():
// Oratio\release\win-unpacked\resources\app.asar
// somehow that's not true for AudioSelector.tsx
// there 'resources/assets/sounds' is needed???
// ectron/node part has paths relative to the exe
// which is in Oratio\release\win-unpacked where 'resources' is as well
// WTF????
// is this some kind of webpack config issue? because it would be insane if
// this was default behaviour
const assetLoc =
  process.env.NODE_ENV === 'development'
    ? 'assets/emotes'
    : 'resources/assets/emotes';
export const emoteLibPath = `${assetLoc}/emotes.json`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clearObject(obj: any) {
  for (const k of Object.keys(obj)) {
    delete obj[k];
  }
}

function loadEmoteLib() {
  clearObject(emoteNameToUrl);
  clearObject(lowercaseToEmoteName);

  const emotes: { [name: string]: string } = JSON.parse(
    localStorage.getItem('emoteNameToUrl') ?? '{}'
  );
  for (const [k, v] of Object.entries(emotes)) {
    emoteNameToUrl[k] = v;
  }

  for (const emoteName of Object.keys(emoteNameToUrl)) {
    lowercaseToEmoteName[emoteName.toLowerCase()] = emoteName;
  }
}

(async () => {
  loadEmoteLib();
  asyncLoadingFinished = true;
})();

// const charEscapes: { [char: string]: string } = {
//   ';': '__semicol__',
//   ':': '__colon__',
//   '\\': '__bslash__',
//   '/': '__fslash__',
//   '<': '__lt__',
//   '>': '__gt__',
//   '|': '__bar__',
//   '&': '__amper__',
//   '*': '__aster__',
// };

// function escapeEmoteFileName(name: string): string {
//   // let result = '';
//   // for (const char of name) {
//   //   if (char in charEscapes) {
//   //     result += charEscapes[char];
//   //   } else {
//   //     result += char;
//   //   }
//   // }
//   let result: string = name;
//   for (const [char, escape] of Object.entries(charEscapes)) {
//     result = result.replaceAll(char, escape);
//   }

//   return result;
// }

// function unescapeEmoteFileName(name: string): string {
//   let result: string = name;
//   for (const [char, escape] of Object.entries(charEscapes)) {
//     result = result.replaceAll(escape, char);
//   }

//   return result;
// }

async function importEmoteLibFromDisk() {
  clearObject(emoteNameToUrl);
  clearObject(lowercaseToEmoteName);

  fs.mkdirSync(assetLoc, { recursive: true });
  let data: { [name: string]: string };
  try {
    data = JSON.parse(fs.readFileSync(emoteLibPath, 'utf-8'));
  } catch (e) {
    return;
  }

  for (const [name, filePath] of Object.entries(data)) {
    emoteNameToUrl[name] = encodeURI(filePath);
    lowercaseToEmoteName[name.toLowerCase()] = name;
  }

  localStorage.setItem('emoteNameToUrl', JSON.stringify(emoteNameToUrl));
}

async function exportEmoteLib(): Promise<boolean> {
  fs.mkdirSync(assetLoc, { recursive: true });
  try {
    fs.writeFileSync(emoteLibPath, JSON.stringify(emoteNameToUrl));
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Downloads file from remote HTTPS host and puts its contents to the
 * specified location but adds the appropriate file extension from the MIME type.
 */
async function startDownload(
  emote: EmoteCommon,
  groupDir: string,
  agent: https.Agent
): Promise<[EmoteCommon, string]> {
  return new Promise((resolve, reject) => {
    // ids might clash, but not inside groupdirs
    const filePath = `${groupDir}/${emote.id}`;
    const file = fs.createWriteStream(filePath);
    let fileInfo: { mime?: string; size?: number } = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = https.get(emote.url, { agent }, (response: any) => {
      if (response.statusCode !== 200) {
        reject(
          new Error(`Failed to get '${emote.url}' (${response.statusCode})`)
        );
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
      try {
        fs.renameSync(filePath, filePathWithExtension);
        resolve([emote, filePathWithExtension]);
      } catch (e) {
        reject(new Error(`Failed to rename file: ${e}`));
      }
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

async function fetchEmotes(
  groupName: string,
  emotes: EmoteCommon[],
  agent: https.Agent
): Promise<Promise<[EmoteCommon, string]>[]> {
  const promises = [];
  const groupDir = `${assetLoc}/${groupName}`;
  fs.mkdirSync(groupDir, { recursive: true });
  for (const emote of emotes) {
    if (emote.url) {
      promises.push(startDownload(emote, groupDir, agent));
    } else {
      // eslint-disable-next-line no-console
      console.warn('emote missing url: ', emote.name);
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
      verticalAlign: 'middle',
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

  // otherwise we might get an incomplete set of our emote lib
  if (!asyncLoadingFinished) {
    loadEmoteLib();
  }

  function openEmoteDirectory() {
    openExplorer(assetLoc);
  }

  const [, updateState] = React.useState<Record<string, never>>();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const { TWITCH_CLIENT_ID } = process.env;
  // users can only change this by going back to maing settings so only
  // refreshing it here is fine;
  const hasAuth = localStorage.getItem('twitchAuth') === '1';
  const channelName = localStorage.getItem('channelName');
  const canGetEmotes =
    TWITCH_CLIENT_ID && hasAuth && channelName && channelName.length > 3;

  const [channelEmotes, setChannelEmotes] = React.useState<{
    value: string;
    valid: boolean;
  }>({ value: '', valid: false });

  const [importState, setImportState] = React.useState<string>('');
  const [importStateGlobal, setImportStateGlobal] = React.useState<string>('');
  const [importStateChannel, setImportStateChannel] =
    React.useState<string>('');
  async function downloadAvailableEmotes(
    channel: string | null,
    global?: boolean
  ) {
    // channel === null -> we get all available emotes for the current user
    // otherwise we only get the twitch emotes of that channel
    if (channel !== null && global) {
      throw new Error('channel and global parameters are mutually exclusive!');
    }

    // select correct state setting function
    let setState: (value: string) => void;
    if (!global) {
      setState = channel === null ? setImportState : setImportStateChannel;
    } else {
      setState = setImportStateGlobal;
    }

    try {
      if (!canGetEmotes) {
        setState("Missing authorization! Can't start emote download!");
        return;
      }

      setState('Import started');

      const authToken = ipcRenderer.sendSync('getTwitchToken', channelName);
      if (authToken === null) {
        setState('Could not get authorization! Re-authorization needed!');
        return;
      }

      const tw = new TwitchApi(
        // button can't be pressed if either of these are null
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        TWITCH_CLIENT_ID!,
        authToken
      );

      // also checked by canGetEmotes
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const chName = channel ?? channelName!;
      const userId = global ? null : await tw.getUserId(chName);
      if (userId === null && !global) {
        setState('Could not retrieve user id from twitch servers!');
        return;
      }

      const allEmotes: [groupName: string, emotes: EmoteCommon[]][] = [];
      // get all emotes of current user
      if (channel === null) {
        // get EmoteGroups object and convert it to [groupName, emotes] using
        // Object.entries
        if (global === true) {
          allEmotes.push(...Object.entries(await tw.getGlobalEmotes()));
        } else {
          // will not be null see the if right after userId
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          allEmotes.push(...Object.entries(await tw.getChannelEmotes(userId!)));
        }
      } else {
        allEmotes.push(
          // will not be null see the if right after userId
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ...Object.entries(await tw.getTwitchChannelEmotesConverted(userId!))
        );
      }

      const agent = new https.Agent({ maxSockets: 25 });
      const promises: Promise<[EmoteCommon, string]>[] = [];
      for (const [groupName, emotes] of allEmotes) {
        let newGroupName = groupName;
        if (groupName.endsWith('Channel')) {
          // Channel 7 chars
          const channelStartIndex = groupName.length - 7;
          newGroupName = `${chName}_${groupName.slice(0, channelStartIndex)}`;
        }
        // eslint-disable-next-line no-await-in-loop
        promises.push(...(await fetchEmotes(newGroupName, emotes, agent)));
      }
      if (promises.length === 0) {
        setState('Error: Emote APIs returned no emotes!');
        return;
      }

      let numFinished = 0;
      const progressUpdate = (message: string) => {
        setState(`[${numFinished}/${promises.length}] ${message}`);
      };
      progressUpdate('Started downloads...');
      await Promise.all(
        promises.map((p) =>
          p.then((data) => {
            const [emote, filePathWithExtension] = data;
            numFinished += 1;
            progressUpdate(emote.name);

            // add to emote map
            // html paths are relative to resources/app.asar that's why we
            // need '../'
            // node/electron paths though are relative to the exe which is
            // where 'resources' lives as well
            // so filePathWithExtension currently is the electron path and
            // now we need to remove 'resources' from the url (not in a dev env though)
            // and add '../'
            emoteNameToUrl[emote.name] = `../${encodeURI(
              filePathWithExtension.replace(/^resources\//, '')
            )}`;
            lowercaseToEmoteName[emote.name.toLowerCase()] = emote.name;
            return null;
          })
        )
      );

      localStorage.setItem('emoteNameToUrl', JSON.stringify(emoteNameToUrl));
      if (await exportEmoteLib()) {
        progressUpdate('Exported emote lib!');
      } else {
        progressUpdate('Failed to export emote lib!');
      }
    } catch (err) {
      setState(`Error: ${err}`);
      throw err;
    }
    forceUpdate();
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
            onClick={async () => {
              importEmoteLibFromDisk();
              forceUpdate();
            }}
          >
            {t('Reload emotes')}
          </Button>
          <Button
            id="clear-emotes"
            variant="contained"
            className={classes.button}
            style={{ backgroundColor: red[300] }}
            onClick={async () => {
              clearObject(emoteNameToUrl);
              clearObject(lowercaseToEmoteName);
              localStorage.setItem(
                'emoteNameToUrl',
                JSON.stringify(emoteNameToUrl)
              );
              forceUpdate();
            }}
          >
            {t('Clear emotes')}
          </Button>

          <p>{t('Reload emotes explanation')}</p>
          <p>{t('Clear emotes explanation')}</p>

          <h2>{t('Importing emotes')}</h2>
          <p>{t('Import emotes explanation')}</p>

          <Grid container direction="row" spacing={3}>
            <Grid
              container
              item
              xs={12}
              justifyContent="flex-start"
              alignItems="center"
            >
              <Button
                id="get-emotes"
                variant="contained"
                // className={classes.button}
                color="primary"
                disabled={!canGetEmotes}
                onClick={() => {
                  downloadAvailableEmotes(null, true);
                }}
              >
                {canGetEmotes
                  ? t('Refresh global emotes!')
                  : t('Not authorized!')}
              </Button>
              <span style={{ paddingLeft: '1em' }}>{importStateGlobal}</span>
            </Grid>
          </Grid>

          <Grid container direction="row" spacing={3}>
            <Grid
              container
              item
              xs={12}
              justifyContent="flex-start"
              alignItems="center"
            >
              <Button
                id="get-emotes"
                variant="contained"
                // className={classes.button}
                color="primary"
                disabled={!canGetEmotes}
                onClick={() => {
                  downloadAvailableEmotes(null, false);
                }}
              >
                {canGetEmotes
                  ? t('Refresh your channel emotes!')
                  : t('Not authorized!')}
              </Button>
              <span style={{ paddingLeft: '1em' }}>{importState}</span>
            </Grid>
          </Grid>

          <p>{t('Twitch channel explanation')}</p>

          <Grid container direction="row" spacing={1}>
            <Grid
              container
              item
              // grid has 12 cols -> we can use to fill an entire row
              // so we don't have to create a new one
              // or use an empty col with a width of 6cols
              xs={6}
              justifyContent="flex-start"
              alignItems="center"
            >
              <TextField
                id="channel-name"
                fullWidth
                label={t('Twitch channel name')}
                helperText={`${
                  channelEmotes.valid ? t('Valid') : t('Missing or invalid')
                }`}
                value={channelEmotes.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const trimmed = e.target.value.trim();
                  // twitch channel names are at least 4 chars
                  setChannelEmotes({
                    value: trimmed,
                    valid: trimmed.length > 3,
                  });
                }}
              />
            </Grid>
            <Grid
              item
              // or use an empty col with a width of 6cols
              xs={6}
            />
            <Grid
              container
              item
              // grid has 12 cols -> we can use to fill an entire row
              // so we don't have to create a new one
              xs={12}
              justifyContent="flex-start"
              alignItems="center"
            >
              <Button
                id="get-emotes-channel"
                variant="contained"
                // className={classes.button}
                color="primary"
                disabled={!canGetEmotes || !channelEmotes.valid}
                onClick={() => {
                  downloadAvailableEmotes(channelEmotes.value);
                }}
              >
                {canGetEmotes ? t('Add Emotes!') : t('Not authorized!')}
              </Button>
              <span style={{ paddingLeft: '1em' }}>{importStateChannel}</span>
            </Grid>
          </Grid>

          <h2>{t('Emote Previews')}</h2>
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
