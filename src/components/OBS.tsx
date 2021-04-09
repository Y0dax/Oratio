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

export default function OBS() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechDisplay: any = useRef<HTMLSpanElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipc.on('speech', (_event: any, message: any) => {
    // TODO Test for performance impact of reading settings on every input
    const speed = parseInt(localStorage.getItem('textSpeed') || '75', 10);
    const fontSize = parseInt(localStorage.getItem('fontSize') || '48', 10);
    const fontColor = localStorage.getItem('fontColor') || '#ffffff';
    const fontWeight = parseInt(
      localStorage.getItem('fontWeight') || '400',
      10
    );
    const speechSound = new Howl({
      src: ['../assets/sounds/plink_positive_wooden.mp3'],
      volume: parseFloat(localStorage.getItem('volume') || '50') / 100,
    });

    let i = 0;
    speechDisplay.current.style.fontSize = `${fontSize}px`;
    speechDisplay.current.style.color = fontColor;
    speechDisplay.current.style.fontWeight = fontWeight;

    const typewriter = () => {
      if (i < message.length) {
        speechSound.stop();
        if (message.charAt(i) !== ' ') {
          speechSound.play();
        }

        speechDisplay.current.innerHTML += message.charAt(i);
        // eslint-disable-next-line no-plusplus
        i++;
        setTimeout(typewriter, 150 - speed);
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
