import React, { useEffect, useState, useRef, useReducer } from 'react';
import { remote } from 'electron';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { Button, Grid, IconButton, MenuItem, Select } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import DeleteIcon from '@material-ui/icons/Delete';
import { useTranslation } from 'react-i18next';
import hotkeys from 'hotkeys-js';
import * as Theme from '../Theme';

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      margin: theme.spacing(1),
      minWidth: '100%',
    },
    button: {
      padding: theme.spacing(2),
      textAlign: 'center',
    },
    fullWidth: {
      minWidth: '100%',
    },
    bindings: {
      margin: theme.spacing(0),
      padding: theme.spacing(0),
    },
    styleSelect: {
      minWidth: '80%',
    },
  })
);

export const voiceStyles: { [key: string]: string } = {
  'advertisement-upbeat':
    'Expresses an excited and high-energy tone for promoting a product or service.',
  affectionate:
    'Expresses a warm and affectionate tone, with higher pitch and vocal energy. The speaker is in a state of ' +
    'attracting the attention of the listener. The personality of the speaker is often endearing in nature.',
  angry: 'Expresses an angry and annoyed tone.',
  assistant: 'Expresses a warm and relaxed tone for digital assistants.',
  calm:
    'Expresses a cool, collected, and composed attitude when speaking. Tone, pitch, and prosody are ' +
    'more uniform compared to other types of speech.',
  chat: 'Expresses a casual and relaxed tone.',
  cheerful: 'Expresses a positive and happy tone.',
  customerservice:
    'Expresses a friendly and helpful tone for customer support.',
  depressed:
    'Expresses a melancholic and despondent tone with lower pitch and energy.',
  disgruntled:
    'Expresses a disdainful and complaining tone. Speech of this emotion displays displeasure and contempt.',
  embarrassed:
    'Expresses an uncertain and hesitant tone when the speaker is feeling uncomfortable.',
  empathetic: 'Expresses a sense of caring and understanding.',
  envious:
    'Expresses a tone of admiration when you desire something that someone else has.',
  excited:
    'Expresses an upbeat and hopeful tone. It sounds like something great is happening and the speaker is really happy about that.',
  fearful:
    'Expresses a scared and nervous tone, with higher pitch, higher vocal energy, and faster rate. The speaker is in a state of tension and unease.',
  friendly:
    'Expresses a pleasant, inviting, and warm tone. It sounds sincere and caring.',
  gentle:
    'Expresses a mild, polite, and pleasant tone, with lower pitch and vocal energy.',
  hopeful:
    'Expresses a warm and yearning tone. It sounds like something good will happen to the speaker.',
  lyrical: 'Expresses emotions in a melodic and sentimental way.',
  'narration-professional':
    'Expresses a professional, objective tone for content reading.',
  'narration-relaxed':
    'Express a soothing and melodious tone for content reading.',
  newscast: 'Expresses a formal and professional tone for narrating news.',
  'newscast-casual':
    'Expresses a versatile and casual tone for general news delivery.',
  'newscast-formal':
    'Expresses a formal, confident, and authoritative tone for news delivery.',
  'poetry-reading':
    'Expresses an emotional and rhythmic tone while reading a poem.',
  sad: 'Expresses a sorrowful tone.',
  serious:
    'Expresses a strict and commanding tone. Speaker often sounds stiffer and much less relaxed with firm cadence.',
  shouting:
    'Speaks like from a far distant or outside and to make self be clearly heard.',
  'sports-commentary':
    'Expresses a relaxed and interesting tone for broadcasting a sports event.',
  'sports-commentary-excited':
    'Expresses an intensive and energetic tone for broadcasting exciting moments in a sports event.',
  whispering: 'Speaks very softly and make a quiet and gentle sound.',
  terrified:
    'Expresses a very scared tone, with faster pace and a shakier voice. It sounds like the speaker is in an unsteady and frantic status.',
  unfriendly: 'Expresses a cold and indifferent tone.',
};

export default function KeybindConfig() {
  const { t } = useTranslation();
  const classes = useStyles();

  // useEffect(() => {
  //   const window = remote.BrowserWindow.getFocusedWindow();
  //   if (window) {
  //     window.webContents.on(
  //       'before-input-event',
  //       (event, input: Electron.Input) => {
  //         if (input.control) {
  //           console.log('CTRL');
  //         }
  //         if (input.shift) {
  //           console.log('SHIFT');
  //         }
  //         if (input.alt) {
  //           console.log('ALT');
  //         }
  //         console.log('pressing: ', input.key);
  //       }
  //     );
  //   } else {
  //     console.log('GETTING WINDOW FAIL!');
  //   }
  // }, []);
  function reducer(
    state: { [keys: string]: string },
    action: { type: string; keys: string; action: string }
  ): { [keys: string]: string } {
    const result: { [keys: string]: string } = { ...state };
    switch (action.type) {
      case 'add':
        result[action.keys] = action.action;
        break;
      case 'remove':
        console.log(result);
        console.log('deleting', action.keys);
        delete result[action.keys];
        console.log(result);
        break;
      default:
        console.error('Unknwon action');
    }

    return result;
  }

  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [keyBindings, changeBindings] = useReducer(reducer, {});
  const [watching, setWatching] = useState<boolean>(false);
  const stopWatching = useRef(() => {});
  const startWatching = useRef(() => {});

  useEffect(() => {
    let window = remote.BrowserWindow.getFocusedWindow();
    // create look-up table for keycode to keyname
    const keyCodeToKeyName: { [key: number]: string } = {};
    for (const [keyName, keyCode] of Object.entries(hotkeys.keyMap)) {
      keyCodeToKeyName[keyCode] = keyName;
    }
    for (const [keyName, keyCode] of Object.entries(hotkeys.modifier)) {
      keyCodeToKeyName[keyCode] = keyName;
    }
    let allPressedKeys: string[] = [];

    function watchKeys(event: Electron.Event, input: Electron.Input) {
      const newPressed = hotkeys
        .getPressedKeyCodes()
        .map((value: number) => {
          // special keys/modifiers are in keyCodeToKeyName for other keycodes
          // we can use the code point (utf-16)
          return keyCodeToKeyName[value] || String.fromCharCode(value);
        })
        .filter((value: string) => !allPressedKeys.includes(value));

      allPressedKeys = allPressedKeys.concat(newPressed);
      setPressedKeys(allPressedKeys);

      event.preventDefault();
      return false;
    }

    if (!window) {
      const allWindows = remote.BrowserWindow.getAllWindows();
      if (allWindows.length > 0) {
        // use first window found
        [window] = allWindows;
      }
    }
    if (window) {
      startWatching.current = () => {
        window?.webContents.on('before-input-event', watchKeys);
        setWatching(true);
      };
      stopWatching.current = () => {
        window?.webContents.removeListener('before-input-event', watchKeys);
        setWatching(false);
        allPressedKeys = [];
      };
    } else {
      console.log('GETTING WINDOW FAIL!');
    }

    // NOTE: IMPORANT! we need to call hotkeys at least once - even without any key binding
    // in order for getPresssedKeyCodes to work
    hotkeys('', () => {});
  }, []);

  return (
    <>
      <h2>Keybindings</h2>
      <Grid container direction="row" spacing={3}>
        <Grid item xs={4}>
          <Button
            id="toggle-watching"
            variant="contained"
            color="primary"
            className={`${classes.button} ${classes.fullWidth}`}
            onClick={() => {
              if (watching) {
                stopWatching.current();
                setWatching(false);
                changeBindings({
                  type: 'add',
                  keys: pressedKeys.join('+'),
                  action: 'style cheerful',
                });
                setPressedKeys([]);
              } else {
                startWatching.current();
                setWatching(true);
              }
            }}
          >
            {watching ? t('Save binding') : t('Add binding')}
          </Button>
        </Grid>
        {watching && (
          <Grid item xs={6} container alignItems="center">
            Pressed: {pressedKeys.join('+')}
          </Grid>
        )}
      </Grid>
      <Grid
        container
        direction="row"
        wrap="nowrap"
        style={{ marginTop: '1rem' }}
      >
        <Grid container alignItems="center" item xs={5}>
          {t('Keys')}
        </Grid>
        <Grid container alignItems="center" item xs={4}>
          {t('Style')}
        </Grid>
        <Grid container alignItems="center" item xs={3}>
          {t('Actions')}
        </Grid>
      </Grid>
      {Object.entries(keyBindings).map(([keys, action]) => (
        <Grid
          container
          direction="row"
          wrap="nowrap"
          key={keys}
          className={classes.bindings}
        >
          <Grid container alignItems="center" item xs={5}>
            {keys}
          </Grid>
          <Grid container alignItems="center" item xs={4}>
            <Select
              id="binding-style-select"
              value={action}
              className={classes.styleSelect}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                changeBindings({
                  type: 'add',
                  keys,
                  action: e.target.value,
                });
              }}
            >
              {Object.keys(voiceStyles).map((style: string) => (
                <MenuItem key={style} value={style}>
                  {style}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={3}>
            <IconButton
              aria-label="delete"
              style={{ color: red[500] }}
              onClick={() => {
                changeBindings({ type: 'remove', keys, action });
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </>
  );
}
