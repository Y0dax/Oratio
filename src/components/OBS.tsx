import React, { useRef, useEffect, useReducer } from 'react';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { Howl } from 'howler';

const ipc = require('electron').ipcRenderer;

const DEFAULT_TIMEOUT = 4000;

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
    span: {
      display: 'block',
    },
  })
);
// eslint-disable-next-line react/display-name
const SpeechDisplay = React.forwardRef<HTMLSpanElement>((_props, ref) => {
  return <span ref={ref} />;
});

function uniqueHash() {
  const alpha =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = 8;
  let rtn = '';
  for (let i = 0; i < length; i += 1) {
    rtn += alpha.charAt(Math.floor(Math.random() * alpha.length));
  }
  return rtn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SpeechPhrase(props: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechDisplay: any = useRef<HTMLSpanElement>(null);
  const { message } = props;

  // TODO Test for performance impact of reading settings on every input
  const speed = parseInt(localStorage.getItem('textSpeed') || '75', 10);
  const fontSize = parseInt(localStorage.getItem('fontSize') || '48', 10);
  const fontColor = localStorage.getItem('fontColor') || '#ffffff';
  const fontWeight = parseInt(localStorage.getItem('fontWeight') || '400', 10);
  const soundFileName = localStorage.getItem('soundFileName');
  const speechSound = new Howl({
    src: [`../assets/sounds/${soundFileName}`],
    volume: parseFloat(localStorage.getItem('volume') || '50') / 100,
  });
  const timeBetweenChars: number = 150 - speed;

  // Account for the time to print a message so it doesn't disappear early
  const timeout: number = message.length * timeBetweenChars + DEFAULT_TIMEOUT;

  useEffect(() => {
    speechDisplay.current.style.fontSize = fontSize;
    speechDisplay.current.style.color = fontColor;
    speechDisplay.current.style.fontWeight = fontWeight;

    let i = 0;
    const typewriter = () => {
      if (i < message.length) {
        speechSound.stop();
        if (message.charAt(i) !== ' ') {
          speechSound.play();
        }

        // TODO: the reference object is initialized as null but sometimes comes
        // through as null here even though it is mounted on the component
        // hack to bypass this but should figure out why
        if (speechDisplay.current) {
          speechDisplay.current.innerHTML += message.charAt(i);
        }
        // eslint-disable-next-line no-plusplus
        i++;
        setTimeout(typewriter, timeBetweenChars);
      } else {
        setTimeout(() => {
          // TODO: the reference object is initialized as null but sometimes comes
          // through as null here even though it is mounted on the component
          // hack to bypass this but should figure out why
          if (speechDisplay.current) {
            speechDisplay.current.innerHTML = '';
          }
          props.dispatch({ type: 'shift' });
        }, timeout);
      }
    };
    setTimeout(typewriter, 0);
    // Only register timer interactions once per component regardless of state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = useStyles();
  return (
    <div className={classes.span}>
      <SpeechDisplay ref={speechDisplay} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reducer(state: any, action: any) {
  switch (action.type) {
    case 'push':
      return { phrases: [...state.phrases, action.phrase] };
    case 'shift':
      return { phrases: state.phrases.slice(1) };
    default:
      return state;
  }
}

export default function OBS() {
  const [state, dispatch] = useReducer(reducer, { phrases: [] });

  // Only register ipc speech callback once after component is mounted
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipc.on('speech', (_event: any, message: any) => {
      const key: string = uniqueHash();
      dispatch({ type: 'push', phrase: { message, key } });
    });
  }, []);

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <title>Oratio - OBS</title>
      <div className={classes.titlebar} />
      <div className={classes.text}>
        {state.phrases.map((phrase: { message: string; key: string }) => (
          <SpeechPhrase
            key={phrase.key}
            message={phrase.message}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
