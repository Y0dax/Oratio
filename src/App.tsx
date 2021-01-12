import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import {
  MuiThemeProvider,
  makeStyles,
  createStyles,
  createMuiTheme,
} from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import MicOffIcon from '@material-ui/icons/MicOff';
import { BrowserWindow, remote } from 'electron';
import OBS from './components/OBS';

// Or Create your Own theme:
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#39c7cc',
    },
    secondary: {
      main: '#E33E7F',
    },
  },
});

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      flexGrow: 1,
      height: '100vh',
      background:
        'linear-gradient(200.96deg, #fedc2a -29.09%, #dd5789 51.77%, #7a2c9e 129.35%)',
      color: 'white',
    },
    content: {
      padding: theme.spacing(4),
    },
    button: {
      padding: theme.spacing(2),
      textAlign: 'center',
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
    send: {
      marginLeft: '5px',
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
      backgroundColor: 'blue',
      height: 600,
      width: 800,
      frame: false,
      title: 'Oratio OBS Display',
      // focusable: false,
      // transparent: true,
      webPreferences: {
        nodeIntegration: true,
        devTools: true,
      },
    });
    win.loadURL(`file://${__dirname}/index.html#/obs`);

    win.on('closed', () => {
      win = undefined;
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleSpeechSendClicked = async (event: any) => {
  event.preventDefault();
  const { speech } = event.currentTarget.elements;
  // eslint-disable-next-line no-console
  console.log(speech.value);
  if (win !== undefined) {
    win.webContents.send('speech', speech.value);
    speech.value = '';
  }
};

function InputDisplay() {
  const classes = useStyles();
  document.body.style.background =
    'linear-gradient(200.96deg,#fedc2a -29.09%, #dd5789 51.77%,#7a2c9e 129.35%);';
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
                  label="Speech"
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
                  Send <SendIcon className={classes.send} />
                </Button>
              </Grid>
            </Grid>
          </form>
          <div>
            <div className={classes.hello}>
              <MicOffIcon className={classes.icon} />
            </div>
            <h1 className={classes.header}>Project Oratio</h1>
            <Grid container spacing={3} alignContent="flex-end">
              <Grid container item justify="flex-end" xs={12}>
                <Button
                  id="open-obs"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleOpenObs}
                >
                  Open OBS display
                </Button>
              </Grid>
            </Grid>
          </div>
        </div>
      </div>
    </MuiThemeProvider>
  );
}

export default class App extends React.Component {
  constructor(props: never) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route path="/home" component={InputDisplay} />
          <Route path="/obs" component={OBS} />
        </Switch>
      </Router>
    );
  }
}
