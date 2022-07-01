import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {
  MuiThemeProvider,
  makeStyles,
  createStyles,
} from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import MicOffIcon from '@material-ui/icons/MicOff';
import SettingsIcon from '@material-ui/icons/Settings';
import WavesIcon from '@material-ui/icons/Waves';
import SpeedIcon from '@material-ui/icons/Speed';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {
  FormControl,
  IconButton,
  InputLabel,
  Select,
  Menu,
} from '@material-ui/core';
import MUIMenuItem from '@material-ui/core/MenuItem';
import { red, green } from '@material-ui/core/colors';
import { BrowserWindow, remote, ipcRenderer, MenuItem } from 'electron';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import hotkeys from 'hotkeys-js';
import * as Theme from './Theme';
import SliderWithIcon from './settings/SliderWithIcon';
import { lowercaseToEmoteName, emoteNameToUrl } from './Emotes';
import VolumeSlider from './settings/VolumeSlider';
import { voiceStyles } from './settings/KeybindConfig';
import ChatStatus from './ChatStatus';
import ChatInteraction from '../TwitchChat';
import { TTSSettings, playTTS } from '../TTSAzure';
import VoiceConfigBar, { VoiceConfig } from './VoiceConfigBar';

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      // flexGrow: 1,
      // height: '100vh',
      background: theme.palette.background.default,
      color: 'white',
      // disable scroll bar on home screen
      overflow: 'hidden',
    },
    content: {
      margin: theme.spacing(4),
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
      fontSize: '8rem',
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
    formControl: {
      margin: theme.spacing(0),
      minWidth: '100%',
    },
  })
);

let win: BrowserWindow | undefined;
async function handleOpenObs() {
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

    if (process.env.NODE_ENV === 'development') {
      win.loadURL(
        `http://localhost:${
          process.env.PORT || '1212'
        }/dist/index_injected.html#/obs`
      );
    } else {
      win.loadURL(`file://${__dirname}/index_injected.html#/obs`);
    }

    win.on('closed', () => {
      win = undefined;
    });
  }
}

const localStorageVoiceStyle = 'ttsVoiceStyle';
const localStorageVoiceVolume = 'ttsVoiceVolume';
const localStorageVoicePitch = 'ttsVoicePitch';
const localStorageVoiceRate = 'ttsVoiceRate';

const chat: ChatInteraction = new ChatInteraction(
  localStorage.getItem('channelName'),
  null,
  process.env.TWITCH_CLIENT_ID || null,
  {
    mirrorFromChat: localStorage.getItem('mirrorFromChat') === '1',
    mirrorToChat: localStorage.getItem('mirrorToChat') === '1',
  }
);

export default function Home() {
  const classes = useStyles();
  const { t } = useTranslation();
  const socket = io(
    `http://localhost:${localStorage.getItem('serverPort') || '4563'}`
  );

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  });

  const [ttsActive, setTTSActive] = React.useState(
    localStorage.getItem('ttsActive') === '1'
  );
  const [textSoundMuted, setTextSoundMuted] = React.useState(
    localStorage.getItem('textSoundMuted') === '1'
  );

  // these can't change between renders
  const ttsSettingsPermanent: React.MutableRefObject<TTSSettings> = useRef({
    apiKey: ipcRenderer.sendSync('getAzureKey') || '',
    region: localStorage.getItem('azureRegion') || '',
    skipEmotes: localStorage.getItem('ttsSkipEmotes') === '1',
  });

  const [voiceStyle, setVoiceStyle] = React.useState(
    localStorage.getItem(localStorageVoiceStyle) || ''
  );
  const [voiceVolume, setVoiceVolume] = React.useState(
    parseInt(localStorage.getItem(localStorageVoiceVolume) || '100', 10)
  );
  const [voicePitch, setVoicePitch] = React.useState(
    parseFloat(localStorage.getItem(localStorageVoicePitch) || '0')
  );
  const [voiceRate, setVoiceRate] = React.useState(
    parseFloat(localStorage.getItem(localStorageVoiceRate) || '1')
  );

  // these can't change between renders
  const voiceLang = localStorage.getItem('azureVoiceLang') || '';
  const voiceName = localStorage.getItem('azureVoiceName') || '';

  function getCurrentSettings(): VoiceConfig {
    return {
      style: voiceStyle,
      volume: voiceVolume,
      pitch: voicePitch,
      rate: voiceRate,
    };
  }

  function handleConfigLoad(name: string, value: VoiceConfig) {
    setVoiceStyle(value.style);
    setVoiceVolume(value.volume);
    setVoicePitch(value.pitch);
    setVoiceRate(value.rate);
  }

  const ttsPlaying = useRef(false);
  const channelName = useRef(localStorage.getItem('channelName'));
  const oAuthToken = useRef(
    ipcRenderer.sendSync('getTwitchToken', channelName.current)
  );

  // wrap in a ref so a re-render doesn't delete our history
  const textHistory: React.MutableRefObject<string[]> = useRef([]);
  let textHistoryPos: number = textHistory.current.length;

  const addToHistory = (text: string) => {
    const curTextHistory = textHistory.current;
    if (curTextHistory[curTextHistory.length - 1] !== text) {
      curTextHistory.push(text);
      if (curTextHistory.length >= 100) {
        curTextHistory.shift();
      }
      textHistoryPos = curTextHistory.length;
    }
  };

  const sendSpeech = async (phrase: string, from_chat: boolean) => {
    if (phrase.trim() === '') return;
    socket.emit('phraseSend', {
      phrase,
      settings: {
        speed: parseInt(localStorage.getItem('textSpeed') || '75', 10),
        fontSize: parseInt(localStorage.getItem('fontSize') || '48', 10),
        fontColor: localStorage.getItem('fontColor') || '#ffffff',
        fontWeight: parseInt(localStorage.getItem('fontWeight') || '400', 10),
        soundFileName: localStorage.getItem('soundFileName'),
        volume: textSoundMuted
          ? 0
          : parseFloat(localStorage.getItem('volume') || '50') / 100,
        bubbleColor: localStorage.getItem('bubbleColor') || '#000',
        emoteNameToUrl: JSON.parse(
          localStorage.getItem('emoteNameToUrl') || ''
        ),
      },
    });
    // post the same message in twitch chat
    if (!from_chat && chat.mirrorToChat) {
      chat.sendToChat(phrase);
    }
    if (win !== undefined) {
      win.webContents.send('speech', phrase);
    }

    // play TTS
    if (ttsActive) {
      playTTS(
        {
          apiKey: ttsSettingsPermanent.current.apiKey,
          region: ttsSettingsPermanent.current.region,
          skipEmotes: ttsSettingsPermanent.current.skipEmotes,
        },
        {
          voiceLang,
          voiceName,
          voiceStyle,
          voiceVolume,
          voicePitch,
          voiceRate,
        },
        ttsPlaying,
        phrase
      );
    }

    addToHistory(phrase);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSpeechSendClicked = async (event: any) => {
    event.preventDefault();
    const { speech } = event.currentTarget.elements;
    await sendSpeech(speech.value, false);
    speech.value = '';
  };

  useEffect(() => {
    // currently this component only really udpates after the user comes back
    // from the preferences page so it's fine to have this here for now
    chat.updateIdentity(channelName.current, oAuthToken.current);
    chat.mirrorFromChat = localStorage.getItem('mirrorFromChat') === '1';
    chat.mirrorToChat = localStorage.getItem('mirrorToChat') === '1';
    chat.setOnChatEvent(sendSpeech);

    // for devenv
    // TODO technichally this can cause problems where a phrase is queued up and the user
    // goes to preferences and back which will result in the queued up phrase being
    // played before the other can finish
    ttsPlaying.current = false;

    // set up keybindings
    const keyBindings: { [keys: string]: string } = JSON.parse(
      localStorage.getItem('ttsKeybindings') || '{}'
    );
    for (const [keys, style] of Object.entries(keyBindings)) {
      hotkeys(keys, (event, handler) => {
        setVoiceStyle(style);
        // prevent default event
        return false;
      });
    }

    // return function that gets run when unmounting to unbind hotkeys
    return () => {
      for (const keys of Object.keys(keyBindings)) {
        hotkeys.unbind(keys);
      }
    };
  }, []);

  // Tab-complete
  let tabCompleteStart = 0;
  let tabCompletePrefixLow = '';
  let tabCompleteOptions: string[] = [];
  let tabCompleteOptionIndex = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleTextBoxKeypress(event: any) {
    // Autocomplete
    if (event.key === 'Tab') {
      event.preventDefault(); // do not go to the next element.\
      const textField = event.target;
      const text = textField.value;
      const { selectionStart } = textField;
      const words = [...text.matchAll(/\w+/g)].filter(
        (word) => word.index < selectionStart
      );
      if (!words.length) {
        // console.log('northing to autocomplete');
        return;
      }

      const word = words[words.length - 1];
      const prefixLow = word[0].toLowerCase();
      if (
        // Is this a different tab-complete than before?
        !(
          word.index === tabCompleteStart &&
          tabCompletePrefixLow.length &&
          prefixLow.startsWith(tabCompletePrefixLow)
        )
      ) {
        tabCompleteStart = word.index;
        tabCompletePrefixLow = prefixLow;
        tabCompleteOptions = Object.entries(lowercaseToEmoteName)
          .filter(([emoteLow]) => emoteLow.startsWith(prefixLow))
          .map(([, emoteName]) => `${emoteName} `);
        if (tabCompleteOptions.length === 0) {
          // no prefix match found. try substring matching.
          tabCompleteOptions = Object.entries(lowercaseToEmoteName)
            .filter(([emoteLow]) => emoteLow.indexOf(prefixLow) !== -1)
            .map(([, emoteName]) => `${emoteName} `);
        }
        tabCompleteOptions.sort();
        tabCompleteOptionIndex = 0;
      } else {
        const optionCount = tabCompleteOptions.length;
        tabCompleteOptionIndex =
          (tabCompleteOptionIndex + (event.shiftKey ? -1 : 1) + optionCount) %
          optionCount;
      }

      if (tabCompleteOptions.length === 0) {
        // console.log('no matching autocomplete options for: ', prefixLow);
        return;
      }

      const option = tabCompleteOptions[tabCompleteOptionIndex];
      tabCompletePrefixLow = option.toLowerCase().slice(0, option.length - 1);
      textField.value =
        text.slice(0, tabCompleteStart) + option + text.slice(selectionStart);
      textField.selectionStart = tabCompleteStart + option.length;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault(); // do not go to the next element.
      if (textHistoryPos > 0) {
        textHistoryPos -= 1;
      }
      event.target.value = textHistory.current[textHistoryPos] || '';
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault(); // do not go to the next element.

      if (textHistoryPos <= textHistory.current.length - 1) {
        textHistoryPos += 1;
      }
      event.target.value = textHistory.current[textHistoryPos] || '';
    }
  }

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
                  onKeyDown={handleTextBoxKeypress}
                  fullWidth
                  autoFocus
                />
              </Grid>
              <Grid container item xs={12} justify-content="flex-start">
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
                <FormControlLabel
                  control={
                    <Checkbox
                      style={
                        ttsActive ? { color: green[500] } : { color: red[500] }
                      }
                      checked={ttsActive}
                      disabled={
                        ttsSettingsPermanent.current.apiKey === undefined ||
                        ttsSettingsPermanent.current.apiKey === ''
                      }
                      onChange={(event) => {
                        setTTSActive(event.currentTarget.checked);
                        localStorage.setItem(
                          'ttsActive',
                          event.currentTarget.checked ? '1' : '0'
                        );
                      }}
                    />
                  }
                  label={t('TTS active')}
                  labelPlacement="start"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      style={
                        textSoundMuted
                          ? { color: green[500] }
                          : { color: red[500] }
                      }
                      checked={textSoundMuted}
                      onChange={(event) => {
                        setTextSoundMuted(event.currentTarget.checked);
                        localStorage.setItem(
                          'textSoundMuted',
                          event.currentTarget.checked ? '1' : '0'
                        );
                      }}
                    />
                  }
                  label={t('Mute text sound')}
                  labelPlacement="start"
                />
              </Grid>
            </Grid>
            {ttsActive && (
              // TODO extract this into its own component
              <>
                <Grid container direction="row" spacing={3}>
                  <Grid item xs={5} container alignItems="center">
                    <Typography variant="h5" component="h1">
                      {t('TTS Settings')}
                    </Typography>
                  </Grid>
                  <VoiceConfigBar
                    getCurrentSettings={getCurrentSettings}
                    configLoadCallback={handleConfigLoad}
                  />
                </Grid>
                <Grid container direction="row" spacing={3}>
                  <Grid item xs={6}>
                    <FormControl className={classes.formControl}>
                      <InputLabel id="azure-voice-style-label">
                        {t('Voice style')}
                      </InputLabel>
                      <Select
                        labelId="azure-voice-style-label"
                        id="azure-voice-style"
                        value={voiceStyle}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const value = e.target.value;
                          setVoiceStyle(value);
                          localStorage.setItem('ttsVoiceStyle', value);
                        }}
                      >
                        <MUIMenuItem key="none" value="none">
                          none
                        </MUIMenuItem>
                        {Object.entries(voiceStyles).map(
                          ([name, _description]: [string, string]) => (
                            <MUIMenuItem key={name} value={name}>
                              {name}
                            </MUIMenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <VolumeSlider
                      value={voiceVolume}
                      label={t('Volume')}
                      valueDisplay="auto"
                      onChange={(event, value) => {
                        setVoiceVolume(value as number);
                        localStorage.setItem(
                          localStorageVoiceVolume,
                          value.toString()
                        );
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid container direction="row" spacing={3}>
                  <Grid item xs={6}>
                    <SliderWithIcon
                      value={voicePitch}
                      label={t('Pitch (+/- in %)')}
                      min={-100}
                      max={100}
                      step={1}
                      onChange={(event, value) => {
                        setVoicePitch(value as number);
                        localStorage.setItem(
                          localStorageVoicePitch,
                          value.toString()
                        );
                      }}
                      icon={<WavesIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <SliderWithIcon
                      value={voiceRate}
                      label={t('Rate')}
                      min={0}
                      max={3}
                      step={0.01}
                      onChange={(event, value) => {
                        setVoiceRate(value as number);
                        localStorage.setItem(
                          localStorageVoiceRate,
                          value.toString()
                        );
                      }}
                      icon={<SpeedIcon />}
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </form>
          {(chat.mirrorFromChat || chat.mirrorToChat) && (
            <ChatStatus
              chatInstance={chat}
              channelName={channelName.current}
              oAuthToken={oAuthToken.current}
            />
          )}
          <div>
            <div className={classes.hello}>
              <MicOffIcon className={classes.icon} />
            </div>
            <h1 className={classes.header}>Project Oratio</h1>
            <Grid container direction="row" spacing={3} alignItems="center">
              <Grid item xs={12}>
                Browser source running at:
                <a
                  href="http://localhost:4563"
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: '5px' }}
                >
                  http://localhost:4563
                </a>
              </Grid>
            </Grid>
            <Grid container direction="row" spacing={3} alignItems="center">
              <Grid item xs={12}>
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
              </Grid>
            </Grid>
          </div>
        </div>
      </div>
    </MuiThemeProvider>
  );
}
