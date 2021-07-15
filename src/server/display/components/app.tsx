import React, { useRef, useEffect, useReducer } from 'react';
import ReactDOM from 'react-dom';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { Howl } from 'howler';
import { io } from 'socket.io-client';

const socket = io();
const DEFAULT_TIMEOUT = 4000;

const useStyles = makeStyles(() =>
  createStyles({
    root: () => ({
      flexGrow: 1,
      height: '100vh',
      // padding: theme.spacing(4),
    }),
    textTable: () => ({
      display: 'table',
      height: '100%',
    }),
    text: () => ({
      color: 'white',
      fontSize: '3rem',
      textAlign: 'left',
      display: 'table-cell',
      verticalAlign: 'bottom',
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bubble: (props: any) => ({
      backgroundColor: props.bubbleColor,
      fontFamily: "'Baloo Da 2', cursive",
      padding: '20px',
      border: '3px solid #a9a9a9',
      borderRadius: '8px',
    }),
    span: () => ({
      display: 'block',
    }),
    hidden: () => ({
      display: 'none',
    }),
    emote: {
      display: 'inline-block',
      width: 'auto',
      height: 'auto',
      'max-height': '2em',
      'max-width': '1000px',
    },
  })
);

// eslint-disable-next-line react/display-name
const SpeechDisplay = React.forwardRef<HTMLSpanElement>((_props, ref) => {
  const classes = useStyles(_props);
  return <span ref={ref} className={classes.span} />;
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

// Get emote element from the server as the client bundle fails to load them
const emoteRequest = async (value: string) => {
  const url = new URL('http://localhost:4563/emotes');
  url.searchParams.append('string', value);
  const response = await fetch(url.toString());
  return response.json();
};

// const emoteNameToUrl = JSON.parse(localStorage.getItem('emoteNameToUrl') || '');
let emoteNameToUrl: { [key: string]: string } = {};

function Emote(attrs: { emoteName: string }) {
  const { emoteName } = attrs;
  const classes = useStyles({
    emote: {
      display: 'inline-block',
      width: 'auto',
      height: 'auto',
      'max-height': '2em',
      'max-width': '1000px',
    },
  });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SpeechPhrase(props: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechDisplay: any = useRef<HTMLSpanElement>(null);
  const { message, settings } = props;

  // TODO Test for performance impact of reading settings on every input
  const { speed } = settings;
  const { fontSize } = settings;
  const { fontColor } = settings;
  const { fontWeight } = settings;
  const { soundFileName } = settings;
  emoteNameToUrl = settings.emoteNameToUrl;

  const speechSound = new Howl({
    src: [`../assets/sounds/${soundFileName}`],
    volume: settings.volume,
  });
  // const regex = /:([^:]+):/g;
  // const emojis = [...message.matchAll(regex)];
  const timeBetweenChars: number = 150 - speed;
  const emojiRegex = /:([^:]+):/g;
  const emojis = [...message.matchAll(emojiRegex)];
  const emotes = [...message.matchAll(/\w+/g)].filter(
    (e) => e[0] in emoteNameToUrl
  );

  // Account for the time to print a message so it doesn't disappear early
  const timeout: number =
    message.length * timeBetweenChars +
    (message.length > 0 ? DEFAULT_TIMEOUT : 0);

  useEffect(() => {
    speechDisplay.current.style.fontSize = fontSize;
    speechDisplay.current.style.color = fontColor;
    speechDisplay.current.style.fontWeight = fontWeight;

    let i = 0;
    const typewriter = () => {
      if (i < message.length) {
        speechSound.stop();

        // TODO: Audio play does not seem to come through on browser load
        if (message.charAt(i) !== ' ') {
          speechSound.play();
        }

        if (speechDisplay.current) {
          // Check whether this character is the start of an emoji or emote.
          const foundEmoji = emojis.find((emoji) => emoji.index === i);
          const foundEmote = emotes.find((emote) => emote.index === i);
          if (foundEmoji) {
            const emojiString = foundEmoji[0];
            i += emojiString.length;

            emoteRequest(emojiString)
              .then((data) => {
                if (data.found) {
                  speechDisplay.current.innerHTML += data.value;
                } // else {
                //   playSound = false;
                // }
                return emojiString;
              })
              .catch((error) => {
                throw error;
              });
          } else if (foundEmote) {
            const emoteName = foundEmote[0];
            const emoteContainer = document.createElement('span');
            ReactDOM.render(<Emote emoteName={emoteName} />, emoteContainer);
            speechDisplay.current.appendChild(emoteContainer);
            i += emoteName.length;
          } else {
            // TODO: Doublecheck escaping.
            speechDisplay.current.innerHTML += message.charAt(i);
            i += 1;
          }
        }
        // eslint-disable-next-line no-plusplus
        // i++;
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

  return <SpeechDisplay ref={speechDisplay} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reducer(state: any, action: any) {
  switch (action.type) {
    case 'push':
      return {
        phrases: [...state.phrases, action.phrase],
        settings: action.settings,
      };
    case 'shift':
      return { phrases: state.phrases.slice(1), settings: state.settings };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { phrases: [], settings: {} });

  useEffect(() => {
    socket.on('phraseRender', (data) => {
      const key: string = uniqueHash();
      const message: string = data.phrase;
      dispatch({
        type: 'push',
        phrase: { message, key },
        settings: data.settings,
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const classes = useStyles({ bubbleColor: state.settings.bubbleColor });
  return (
    <div className={classes.root}>
      <div className={classes.textTable}>
        <div className={classes.text}>
          <div
            className={
              state.phrases.length <= 0 ? classes.hidden : classes.bubble
            }
          >
            {state.phrases.map((phrase: { message: string; key: string }) => {
              return (
                <SpeechPhrase
                  key={phrase.key}
                  message={phrase.message}
                  dispatch={dispatch}
                  settings={state.settings}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}