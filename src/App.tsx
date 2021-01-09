import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
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

function InputDisplay() {
  const classes = useStyles();
  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <form noValidate autoComplete="off">
          <Grid container direction="row" spacing={3}>
            <Grid item xs={12}>
              <TextField
                id="speech-input"
                label="Speech"
                variant="outlined"
                fullWidth
                multiline
              />
            </Grid>
            <Grid container item xs={12} justify="flex-end">
              <Button
                variant="contained"
                color="primary"
                className={classes.button}
              >
                Send <SendIcon className={classes.send} />
              </Button>
            </Grid>
          </Grid>
        </form>
      </div>
      <div>
        <div className={classes.hello}>
          <MicOffIcon className={classes.icon} />
        </div>
        <h1 className={classes.header}>Project Oratio</h1>
      </div>
    </MuiThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={InputDisplay} />
      </Switch>
    </Router>
  );
}
