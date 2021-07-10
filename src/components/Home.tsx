import React from 'react';
import { Link } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import {
  MuiThemeProvider,
  makeStyles,
  createStyles,
} from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import MicOffIcon from '@material-ui/icons/MicOff';
import SettingsIcon from '@material-ui/icons/Settings';
import { BrowserWindow, remote } from 'electron';
import { useTranslation } from 'react-i18next';
import * as Theme from './Theme';

import { lowercaseToEmoteName } from './Emotes';

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      flexGrow: 1,
      height: '100vh',
      background: theme.palette.background.default,
      color: 'white',
    },
    content: {
      margin: theme.spacing(4),
    },
    button: {
      padding: theme.spacing(2),
      textAlign: 'center',
    },
    preferences: {
      marginRight: '10px',
    },
    link: {
      textDecoration: 'none',
    },
    icon: {
      fontSize: '10rem',
      // boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    },
    header: {
      textAlign: 'center',
    },
    hello: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '20px 0',
    },
    buttonIcon: {
      marginLeft: '5px',
      marginRight: '5px',
    },
    bottomButtons: {
      marginTop: '40px',
    },
  })
);

let win: BrowserWindow | undefined;
async function handleOpenObs() {
  // electron.ipcRenderer.on();
  // BrowserWindow is just the type import, remote.BrowserWindow is the value
  // const win: BrowserWindow = new remote.BrowserWindow({ .. })
  if (win === undefined) {
    win = new remote.BrowserWindow({
      // backgroundColor: 'blue',
      height: 600,
      width: 800,
      title: 'Oratio OBS Display',
      autoHideMenuBar: true,
      // focusable: false,
      // transparent: true,
      webPreferences: {
        nodeIntegration: true,
        // devTools: true,
        // Soffscreen: true,
      },
    });
    win.loadURL(`file://${__dirname}/index.html#/obs`);
    // win.webContents.setFrameRate(60);

    // win.webContents.on('paint', (event, dirty, image) => {
    //   // updateBitmap(dirty, image.getBitmap())
    //   fs.writeFile('ex.png', image.toPNG(), (err: Error) => {
    //     if (err) throw err;
    //     // eslint-disable-next-line no-console
    //     // console.log('The file has been saved!');
    //   });
    // });

    win.on('closed', () => {
      win = undefined;
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSpeechSendClicked(event: any) {
  event.preventDefault();
  const { speech } = event.currentTarget.elements;
  // eslint-disable-next-line no-console
  console.log(speech.value);
  if (win !== undefined) {
    win.webContents.send('speech', speech.value);
    speech.value = '';
  }
}

export default function Home() {
  const classes = useStyles();
  const { t } = useTranslation();

  // Tab-complete
  let tabCompleteStart = 0;
  let tabCompletePrefixLow = '';
  let tabCompleteOptions: string[] = [];
  let tabCompleteOptionIndex = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleTabComplete(event: any) {
    if (event.key !== 'Tab') return;
    event.preventDefault(); // do not go to the next element.

    const textField = event.target;
    const text = textField.value;
    const { selectionStart } = textField;
    const words = [...text.matchAll(/\w+/g)].filter(
      (word) => word.index < selectionStart
    );
    if (!words.length) {
      // console.log('northing to autocomplete');
      return;
    }

    const word = words[words.length - 1];
    const prefixLow = word[0].toLowerCase();
    if (
      // Is this a different tab-complete than before?
      !(
        word.index === tabCompleteStart &&
        tabCompletePrefixLow.length &&
        prefixLow.startsWith(tabCompletePrefixLow)
      )
    ) {
      tabCompleteStart = word.index;
      tabCompletePrefixLow = prefixLow;
      tabCompleteOptions = Object.entries(lowercaseToEmoteName)
        .filter(([emoteLow, _]) => emoteLow.startsWith(prefixLow))
        .map(([_, emoteName]) => `${emoteName} `);
      if (tabCompleteOptions.length === 0) {
        // no prefix match found. try substring matching.
        tabCompleteOptions = Object.entries(lowercaseToEmoteName)
          .filter(([emoteLow, _]) => emoteLow.indexOf(prefixLow) !== -1)
          .map(([_, emoteName]) => `${emoteName} `);
      }
      tabCompleteOptions.sort();
      tabCompleteOptionIndex = 0;
    } else {
      const optionCount = tabCompleteOptions.length;
      tabCompleteOptionIndex =
        (tabCompleteOptionIndex + (event.shiftKey ? -1 : 1) + optionCount) %
        optionCount;
    }

    if (tabCompleteOptions.length === 0) {
      // console.log('no matching autocomplete options for: ', prefixLow);
      return;
    }

    const option = tabCompleteOptions[tabCompleteOptionIndex];
    tabCompletePrefixLow = option.toLowerCase().slice(0, option.length - 1);
    textField.value =
      text.slice(0, tabCompleteStart) + option + text.slice(selectionStart);
    textField.selectionStart = tabCompleteStart + option.length;
  }

  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <div className={classes.content}>
          <form
            noValidate
            autoComplete="off"
            onSubmit={handleSpeechSendClicked}
          >
            <Grid container direction="row" spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="speech"
                  id="speech-input"
                  label={t('Speech')}
                  variant="outlined"
                  onKeyDown={handleTabComplete}
                  fullWidth
                  autoFocus
                />
              </Grid>
              <Grid container item xs={12} justify="flex-end">
                <Button
                  id="send-text"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  type="submit"
                  // disabled
                >
                  {t('Send')} <SendIcon className={classes.buttonIcon} />
                </Button>
              </Grid>
            </Grid>
          </form>
          <div>
            <div className={classes.hello}>
              <MicOffIcon className={classes.icon} />
            </div>
            <h1 className={classes.header}>Project Oratio</h1>
            <Grid
              container
              spacing={3}
              alignContent="flex-end"
              justify="flex-end"
              className={classes.bottomButtons}
            >
              {/* <Grid container item justify="flex-end" xs={12}> */}
              <Link to="/preferences" className={classes.link}>
                <Button
                  id="open-preferences"
                  variant="outlined"
                  color="secondary"
                  className={`${classes.button} ${classes.preferences}`}
                >
                  <SettingsIcon className={classes.buttonIcon} />{' '}
                  {t('Preferences')}
                </Button>
              </Link>

              <Button
                id="open-obs"
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={handleOpenObs}
              >
                {t('Open OBS Display')}
              </Button>
              {/* </Grid> */}
            </Grid>
          </div>
        </div>
      </div>
    </MuiThemeProvider>
  );
}
