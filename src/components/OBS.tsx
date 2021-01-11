import React from 'react';
import Typed from 'typed.js';

import {
  makeStyles,
  createStyles,
  createMuiTheme,
} from '@material-ui/core/styles';

const ipc = require('electron').ipcRenderer;

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
    text: {
      color: 'black',
      fontSize: '4rem',
      textAlign: 'center',
    },
  })
);

let messages = '';
let typed: Typed | undefined;
// const typist = document.getElementById('speech');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipc.on('speech', (event: any, message: any) => {
  // eslint-disable-next-line no-console
  console.log(message); // logs out "Hello second window!"
  messages = message;
  if (typed === undefined) {
    typed = new Typed('#speech', {
      strings: [messages],
      typeSpeed: 100,
      startDelay: 0,
      loop: false,
      showCursor: false,
      contentType: 'html',
      onComplete: () => {
        setTimeout(() => {
          if (typed !== undefined) {
            typed.stop();
          }
        }, 2000);
      },
    });
  }
  typed.start();
  // .typeString(message).pauseFor(2500).deleteAll(10).start();
});

export default function OBS() {
  const classes = useStyles();
  return (
    <div>
      <span id="speech" className={classes.text} />
    </div>
  );
}
