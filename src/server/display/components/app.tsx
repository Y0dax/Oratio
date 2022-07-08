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
      height: '100%',
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      // so we don't get a scrollbar; this will not actually hide any content
      // since it would've been outside the window anyway
      overflow: 'hidden',
    }),
    text: () => ({
      color: 'white',
      fontSize: '3rem',
      fontFamily: "'Baloo Da 2', cursive",
      wordBreak: 'break-word',
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bubble: (props: any) => ({
      backgroundColor: props.bubbleColor,
      padding: '20px',
      border: '3px solid #a9a9a9',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      bottom: 0,
      left: 0,
    }),
    span: () => ({
      display: 'block',
    }),
    emoji: {
      verticalAlign: 'middle',
    },
    hidden: () => ({
      display: 'none',
    }),
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
      verticalAlign: 'middle',
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

// TODO: figure out a way to remove all this duplicate code and merge it
// with src/components/OBS.tsx; my webpack knowledge is not good enough

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SpeechPhrase(props: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechDisplay: any = useRef<HTMLSpanElement>(null);
  const { message, settings } = props;
  const classes = useStyles(props);

  // TODO Test for performance impact of reading settings on every input
  const { speed } = settings;
  // TODO changing fontsize does not work!
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
  // sometimes the regular emoji codes can be followed by optional modifiers
  // that start with a double colon, but uEmojiParser doesn't support them
  // since twitter/github etc. dont use them
  const emojiRegex = /:([^:\s]*):/g;
  const emojis = [...message.matchAll(emojiRegex)];
  const emotes = [...message.matchAll(/\w+/g)].filter(
    (e) => e[0] in emoteNameToUrl
  );

  const timePerChar = 40; // avg reading speed is 25 letters/s -> 40ms/letter
  const clamp = (num: number, min: number, max: number) =>
    Math.min(Math.max(num, min), max);
  // increase time on screen based on message length after it's done animating
  // max of an extra 15s
  const timeout: number =
    DEFAULT_TIMEOUT + clamp(timePerChar * message.length, 0, 15000);

  useEffect(() => {
    speechDisplay.current.style.fontSize = fontSize;
    speechDisplay.current.style.color = fontColor;
    speechDisplay.current.style.fontWeight = fontWeight;

    // `i` is the message character index
    let i = 0;
    let wasOnScreen = false;
    // so we don't trigger multiple "shift" actions
    let sentRemoveAction = false;

    // watch for intersection events for our speechDisplay so we know
    // when it enters and leaves the viewport
    const observer = new IntersectionObserver(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (entries, _observer) => {
        entries.forEach((entry) => {
          if (entry.target === speechDisplay.current) {
            if (!wasOnScreen) {
              if (entry.isIntersecting && entry.intersectionRatio >= 1) {
                // element was fully visible on the viewport
                wasOnScreen = true;
              }
            } else if (
              !entry.isIntersecting &&
              // NOTE: an intersection with the viewport only triggers on the thresholds
              // that were passed in the options obj, so techinchally don't have to check
              // this
              entry.intersectionRatio <= 0 &&
              !sentRemoveAction &&
              i >= message.length
            ) {
              // was fully displayed on screen but reached the top of the viewport, where
              // now no portion of the element is visible anymore
              sentRemoveAction = true;
              props.dispatchRef.current({
                type: 'remove',
                id: props.runningId,
              });
            }
          }
        });
      },
      {
        // watch for intersection with viewport
        root: null,
        // margins around root intersection
        rootMargin: '0px',
        // event will only fire for these thresholds:
        // 1 -> fire event once 100% of the elemnt is shown
        threshold: [1, 0],
      }
    );

    // TODO: can the speechDisplay.current ref still be null here?
    observer.observe(speechDisplay.current);

    let currentTextFragment: HTMLSpanElement | null = null;
    const typewriter = () => {
      if (i < message.length) {
        speechSound.stop();

        // TODO: Audio play does not seem to come through on browser load
        if (message.charAt(i) !== ' ') {
          speechSound.play();
        }

        // Check whether this character is the start of an emoji or emote.
        const foundEmoji = emojis.find((emoji) => emoji.index === i);
        const foundEmote = emotes.find((emote) => emote.index === i);
        if (foundEmoji) {
          // end previous text fragment
          currentTextFragment = null;

          const emojiString = foundEmoji[0];
          i += emojiString.length;

          emoteRequest(emojiString)
            .then((data) => {
              if (data.found) {
                const emojiContainer = document.createElement('span');
                emojiContainer.innerHTML = data.value;
                emojiContainer.children[0].classList.add(classes.emoji);
                speechDisplay.current.appendChild(emojiContainer);
              } else {
                // no emoji found -> output it as normal text, which is probably
                // better than not outputting anything at all
                const tempTextContainer = document.createElement('span');
                tempTextContainer.textContent = emojiString;
                speechDisplay.current.appendChild(tempTextContainer);
              }
              return emojiString;
            })
            .catch((error) => {
              throw error;
            });
        } else if (foundEmote) {
          // end previous text fragment
          currentTextFragment = null;

          const emoteName = foundEmote[0];
          const emoteContainer = document.createElement('span');
          ReactDOM.render(<Emote emoteName={emoteName} />, emoteContainer);
          speechDisplay.current.appendChild(emoteContainer);
          i += emoteName.length;
        } else {
          // we put the text into its own element so we can use textContent
          if (currentTextFragment === null) {
            currentTextFragment = document.createElement('span');
            speechDisplay.current.appendChild(currentTextFragment);
          }

          // TODO: Doublecheck escaping.
          currentTextFragment.textContent += message.charAt(i);
          i += 1;
        }

        setTimeout(typewriter, timeBetweenChars);
      } else {
        // message done "animating" queue the removal
        setTimeout(() => {
          if (!sentRemoveAction) {
            sentRemoveAction = true;
            props.dispatchRef.current({ type: 'remove', id: props.runningId });
          }
        }, timeout);
      }
    };
    setTimeout(typewriter, 0);
    // Only register timer interactions once per component regardless of state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <SpeechDisplay ref={speechDisplay} />;
}

interface Phrase {
  message: string;
  key: string;
  runningId: number;
}

type State = {
  phrases: Phrase[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: { [name: string]: any };
};

// TODO keep SpeechSynthesizer alive between calls? but then onAudioEnd does not work
export default function App() {
  // state will only update on a re-render...
  const stateRef: React.MutableRefObject<State> = useRef({
    phrases: [],
    settings: {},
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function reducer(state: any, action: any) {
    let result: State;
    switch (action.type) {
      case 'push':
        result = {
          phrases: [...state.phrases, action.phrase],
          settings: action.settings,
        };
        break;
      case 'shift':
        result = {
          phrases: state.phrases.slice(1),
          settings: state.settings,
        };
        break;
      case 'remove': {
        result = {
          phrases: state.phrases.filter(
            (phrase: Phrase) => phrase.runningId !== action.id
          ),
          settings: state.settings,
        };
        break;
      }
      default:
        result = state;
        break;
    }

    // this react architecture turns such a simple thing into an absolute clusterfuck
    stateRef.current = result;

    return result;
  }

  const [state, dispatch] = useReducer(reducer, { phrases: [], settings: {} });
  // useRef can be thought of as a instance variable for functional components
  // phrase ids waiting for removal (since older ids are still alive)
  const waiting: React.MutableRefObject<{ [id: number]: boolean }> = useRef({});
  const wrappedDispatch = useRef((action: { type: string; id?: number }) => {
    if (action.type === 'remove') {
      // we know id will not be undefined when action==="shift"
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const id: number = action.id!;
      // state will only update on re-render and since this is a closure we will be
      // using the initial state forever -> use a Ref
      const oldest =
        stateRef.current.phrases.length > 0
          ? stateRef.current.phrases[0].runningId
          : id;
      if (id > oldest) {
        // we don't allow removing phrases that aren't the last phrase, so we keep
        // track of items that are waiting for removal
        waiting.current[id] = true;
      } else {
        const youngerSibling = id + 1;
        const removeNext = waiting.current[youngerSibling];
        if (removeNext === true) {
          const REMOVE_DELAY = 500; // ms
          // remove next younger sibling that is waiting with a delay
          // we call ourselves so other waiting siblings will get removed as well
          setTimeout(() => {
            wrappedDispatch.current({ type: 'remove', id: youngerSibling });
          }, REMOVE_DELAY);
          // remove element from waiting q
          delete waiting.current[youngerSibling];
        }

        dispatch({ type: 'shift' });
      }
    } else {
      dispatch(action);
    }
  });

  // useEffect runs after the first render
  useEffect(() => {
    let runningId = 0;
    socket.on('phraseRender', (data) => {
      const key: string = uniqueHash();
      const message: string = data.phrase;
      dispatch({
        type: 'push',
        phrase: { message, key, runningId },
        settings: data.settings,
      });

      runningId += 1;
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const classes = useStyles({ bubbleColor: state.settings.bubbleColor });
  return (
    <div className={classes.root}>
      <div
        className={`${
          state.phrases.length <= 0 ? classes.hidden : classes.bubble
        } ${classes.text}`}
      >
        {state.phrases.map((phrase: Phrase) => {
          return (
            <SpeechPhrase
              key={phrase.key}
              runningId={phrase.runningId}
              message={phrase.message}
              dispatchRef={wrappedDispatch}
              settings={state.settings}
            />
          );
        })}
      </div>
    </div>
  );
}
