import React, { useEffect } from 'react';
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
import { io } from 'socket.io-client';
import * as Theme from './Theme';

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
      padding: theme.spacing(4),
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
const handleOpenObs = async () => {
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
};

export default function Home() {
  const classes = useStyles();
  const { t } = useTranslation();
  const socket = io('http://localhost:3000');

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSpeechSendClicked = async (event: any) => {
    event.preventDefault();
    const { speech } = event.currentTarget.elements;
    // eslint-disable-next-line no-console
    console.log(speech.value);
    socket.emit('phraseSend', {
      phrase: speech.value,
      settings: {
        speed: parseInt(localStorage.getItem('textSpeed') || '75', 10),
        fontSize: parseInt(localStorage.getItem('fontSize') || '48', 10),
        fontColor: localStorage.getItem('fontColor') || '#ffffff',
        fontWeight: parseInt(localStorage.getItem('fontWeight') || '400', 10),
        soundFileName: localStorage.getItem('soundFileName'),
        volume: parseFloat(localStorage.getItem('volume') || '50') / 100,
        bubbleColor: localStorage.getItem('bubbleColor') || '#000',
      },
    });
    if (win !== undefined) {
      win.webContents.send('speech', speech.value);
    }
    speech.value = '';
  };

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
