import React, { useRef } from 'react';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { Howl } from 'howler';

const ipc = require('electron').ipcRenderer;

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      flexGrow: 1,
      backgroundColor: 'blue',
      height: '100vh',
      // padding: theme.spacing(4),
    },
    titlebar: {
      position: 'absolute',
      width: '100%',
      top: 0,
      '-webkit-app-region': 'drag',
      height: '35px',
    },
    text: {
      color: 'white',
      fontSize: '3rem',
      textAlign: 'center',
    },
  })
);
// eslint-disable-next-line react/display-name
const SpeechDisplay = React.forwardRef<HTMLSpanElement>((_props, ref) => {
  return <span ref={ref} />;
});

const speechSound = new Howl({
  src: ['../assets/sounds/plink_positive_wooden.mp3'],
  volume: 0.25,
});

export default function OBS() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechDisplay: any = useRef<HTMLSpanElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipc.on('speech', (_event: any, message: any) => {
    // eslint-disable-next-line no-console
    console.log(message);

    const speed = 100;
    let i = 0;

    const typewriter = () => {
      if (i < message.length) {
        speechSound.stop();
        if (message.charAt(i) !== ' ') {
          speechSound.play();
        }

        speechDisplay.current.innerHTML += message.charAt(i);
        // eslint-disable-next-line no-plusplus
        i++;
        setTimeout(typewriter, speed);
      } else {
        setTimeout(() => {
          speechDisplay.current.innerHTML = '';
        }, 4000);
      }
    };
    setTimeout(typewriter, 0);
  });

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <title>Oratio - OBS</title>
      <div className={classes.titlebar} />
      <div className={classes.text}>
        <SpeechDisplay ref={speechDisplay} />
      </div>
    </div>
  );
}
