import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import {
  MuiThemeProvider,
  makeStyles,
  createStyles,
} from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import MicOffIcon from '@material-ui/icons/MicOff';
import SettingsIcon from '@material-ui/icons/Settings';
import RefreshIcon from '@material-ui/icons/Refresh';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { FormControl, InputLabel, Select } from '@material-ui/core';
import MUIMenuItem from '@material-ui/core/MenuItem';
import { red, green } from '@material-ui/core/colors';
import { BrowserWindow, remote, ipcRenderer, MenuItem } from 'electron';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig,
  SpeakerAudioDestination,
} from 'microsoft-cognitiveservices-speech-sdk';
import * as tmi from 'tmi.js';
import * as Theme from './Theme';
import { lowercaseToEmoteName, emoteNameToUrl } from './Emotes';

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
    buttonIcon: {
      marginLeft: '5px',
      marginRight: '5px',
    },
    formControl: {
      margin: theme.spacing(1),
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

class ChatInteraction {
  client: tmi.Client;

  connected: boolean;

  #connecting: boolean;

  #mirrorFromChat: boolean;

  #mirrorToChat: boolean;

  #currentChatListener: ((message: string, from_chat: boolean) => void) | null;

  #oAuthToken: string | null;

  #channel: string | null;

  connectionStatusCallback: ((value: string) => void) | null;

  channelStatusCallback: ((value: string) => void) | null;

  constructor(
    channel: string | null,
    oAuthToken: string | null,
    clientId: string | null,
    {
      mirrorFromChat,
      mirrorToChat,
    }: { mirrorFromChat: boolean; mirrorToChat: boolean }
  ) {
    this.#channel = null;
    this.#oAuthToken = null;
    this.#mirrorFromChat = false;
    this.#mirrorToChat = false;
    const clientOptions: tmi.Options = {
      options: {
        // tmi.js still uses old twitch v5 api which is deprecated and not
        // allowed to be used by apps with new client ids
        // so we have to disable getting emote sets, which doesn't really
        // matter since the emote sets are twitch only anyway
        skipUpdatingEmotesets: true,
      },
      connection: {
        secure: true,
        reconnect: true,
      },
    };
    // will use tmi.js default clientId if clientId is null
    if (clientId !== null) {
      // we assign options above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clientOptions.options!.clientId = clientId;
    }
    this.client = new tmi.Client(clientOptions);
    this.#connecting = false;
    this.connected = false;
    this.#currentChatListener = null;
    this.connectionStatusCallback = null;
    this.channelStatusCallback = null;

    // setup connection events
    // channel events are triggered for __every__ user so we rely on failure/success
    // of changeChannel instead
    // string values used below are the i18next translation keys
    this.client.on('connected', () => {
      if (this.connectionStatusCallback !== null) {
        this.connectionStatusCallback('ChatStatus OK');
      }
    });
    this.client.on('connecting', () => {
      if (this.connectionStatusCallback !== null) {
        this.connectionStatusCallback('ChatStatus Connecting');
      }
    });
    this.client.on('disconnected', () => {
      if (this.connectionStatusCallback !== null) {
        this.connectionStatusCallback('ChatStatus Disconnected');
      }
    });
    this.client.on('reconnect', () => {
      if (this.connectionStatusCallback !== null) {
        this.connectionStatusCallback('ChatStatus Reconnecting');
      }
    });
    this.updateIdentity(channel, oAuthToken);
    // order important since setting mirror* might need to connect/disconnect
    this.mirrorFromChat = mirrorFromChat;
    this.mirrorToChat = mirrorToChat;
  }

  get mirrorFromChat() {
    return this.#mirrorFromChat;
  }

  set mirrorFromChat(value: boolean) {
    if (this.#mirrorFromChat !== value) {
      this.#mirrorFromChat = value;

      const needConnection = this.#mirrorFromChat || this.#mirrorToChat;
      if (!this.connected && needConnection) {
        this.connect();
      } else if (this.connected && !needConnection) {
        this.disconnect();
      }
    }
  }

  get mirrorToChat() {
    return this.#mirrorToChat;
  }

  set mirrorToChat(value: boolean) {
    if (this.#mirrorToChat !== value) {
      this.#mirrorToChat = value;

      const needConnection = this.#mirrorFromChat || this.#mirrorToChat;
      if (!this.connected && needConnection) {
        this.connect();
      } else if (this.connected && !needConnection) {
        this.disconnect();
      }
    }
  }

  async updateIdentity(channel: string | null, oAuthToken: string | null) {
    // nothing changed
    if (channel === this.#channel && this.#oAuthToken === oAuthToken) {
      return;
    }

    const hasChannel = channel !== null && channel.trim().length > 0;
    if (!hasChannel) {
      await this.disconnect();
      return;
    }

    const hasAuth = oAuthToken !== null && oAuthToken.trim().length > 0;
    if (
      !hasAuth &&
      this.#oAuthToken !== null &&
      (this.connected || this.#connecting)
    ) {
      // no auth token passed but we were connected or in the process of connecting
      // with one so disconnect here
      await this.disconnect();
      return;
    }
    if (hasAuth && this.#oAuthToken !== oAuthToken) {
      if (this.connected || this.#connecting) {
        await this.disconnect();
      }

      // re-connect with new identity
      this.client.getOptions().identity = {
        // we already checked for null when computing hasChannel
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        username: channel!,
        // same here
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        password: oAuthToken!,
      };

      await this.connect();
    }

    try {
      // changeChannel connects if not already
      // we know channel is not null due to hasChannel check above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.changeChannel(channel!);
    } catch (e) {
      console.log('no connection changing channels: ', e);
    }
  }

  async connect() {
    while (this.#connecting) {
      // sleep for 100 ms
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.connected) {
      return;
    }

    try {
      this.#connecting = true;
      await this.client.connect();
      this.#connecting = false;
      this.connected = true;
    } catch (e) {
      console.warn('-------ERROR------- connecting');
      this.#connecting = false;
      this.connected = false;
    }
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      await this.client.disconnect();
      this.#connecting = false;
      this.connected = false;
    } catch (e) {
      // exception gets thrown when Promise gets rejected
      // only gets rejected if already closed
      this.connected = false;
    }
  }

  private async changeChannel(channel: string): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }

    const channels = this.client.getChannels();
    if (channels.length === 0) {
      try {
        await this.client.join(channel);
      } catch (e) {
        this.#channel = null;
        return false;
      }
      // channel changed
    } else if (channels[0] !== `#${channel}`) {
      try {
        await this.client.part(channels[0]);
        await this.client.join(channel);
      } catch (e) {
        this.#channel = null;
        return false;
      }
    }

    this.#channel = channel;
    if (this.channelStatusCallback !== null) {
      this.channelStatusCallback(`#${channel}`);
    }
    return true;
  }

  static async retryNTimes(
    func: () => void,
    retries: number
  ): Promise<boolean> {
    let success = false;
    let tries = 0;
    while (tries < retries) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await func();
        success = true;
        break;
      } catch (_) {
        tries += 1;
      }
    }

    return success;
  }

  setOnChatEvent(
    sendMessageFunc: (message: string, from_chat: boolean) => void
  ) {
    if (this.#currentChatListener === null) {
      // use chat event instead of message so we don't respond to whisper and action messages (/me ..)
      this.client.on(
        'chat',
        (
          _channel: string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tags: { [key: string]: any },
          message: string,
          self: boolean
        ) => {
          // only mirror streamer's messages and discard the ones we sent mirrored to chat
          // ourselves
          // it seems like self is only true for the messages sent using the tmi.js not
          // the ones that were typed into chat etc.
          if (
            !self &&
            this.#currentChatListener !== null &&
            this.#channel === tags.username &&
            this.#mirrorFromChat
          ) {
            this.#currentChatListener(message, true);
          }
        }
      );
    }

    this.#currentChatListener = sendMessageFunc;
  }

  async sendToChat(message: string) {
    if (message.trim().length === 0) {
      return;
    }
    if (!this.connected || this.#channel === null) {
      return;
    }

    try {
      await this.client.say(this.#channel, message);
    } catch (e) {
      console.log('Error: ', e);
    }
  }

  connectionStatus(): string {
    let connectionStatus: string;
    if (this.connected) {
      connectionStatus = 'OK';
    } else if (this.#connecting) {
      connectionStatus = 'CONNECTING';
    } else {
      connectionStatus = 'DISCONNECTED';
    }

    return connectionStatus;
  }

  channelStatus(): string {
    const channels = this.client.getChannels();
    // string for NoChannel is a translation key
    return channels.length > 0 ? channels[0] : 'ChatStatus NoChannel';
  }
}

const chat: ChatInteraction = new ChatInteraction(
  localStorage.getItem('channelName'),
  null,
  process.env.TWITCH_CLIENT_ID || null,
  {
    mirrorFromChat: localStorage.getItem('mirrorFromChat') === '1',
    mirrorToChat: localStorage.getItem('mirrorToChat') === '1',
  }
);

function ChatStatus({
  chatInstance,
  channelName,
  oAuthToken,
}: {
  chatInstance: ChatInteraction;
  channelName: string | null;
  oAuthToken: string | null;
}) {
  const { t } = useTranslation();
  // using the set* functions will trigger a re-render of this component
  // meaning this function will be re-executed
  // so that's why it's better to have this as a separate component
  const [serverStatus, setServerStatus] = React.useState(
    chatInstance.connectionStatus()
  );
  const [channelStatus, setChannelStatus] = React.useState(
    chatInstance.channelStatus()
  );
  chatInstance.connectionStatusCallback = (value: string) => {
    // so we can use react version of i18next otherwise, translations
    // won't change after changing them in settings (until restart)
    setServerStatus(t(value));
  };
  chatInstance.channelStatusCallback = (value: string) => {
    if (value.length > 0 && value[0] === '#') {
      setChannelStatus(value);
    } else {
      setChannelStatus(t(value));
    }
  };

  return (
    <Grid container direction="row" spacing={0} style={{ marginTop: '1em' }}>
      <Grid item xs={12}>
        <Typography variant="h5" component="h1">
          Chat Status
        </Typography>
      </Grid>
      <Grid container item xs={12} alignItems="center">
        Server: {serverStatus}
        <IconButton
          id="reconnect-chat"
          color="primary"
          aria-label="reconnect to server"
          onClick={() => {
            chatInstance.disconnect();
            chatInstance.connect();
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Grid>
      <Grid container item xs={12} alignItems="center">
        Channel: {channelStatus}
        <IconButton
          id="rejoin-channel"
          color="primary"
          aria-label="rejoin channel"
          onClick={() => {
            chatInstance.updateIdentity(channelName, oAuthToken);
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}

const voiceStyles: { [key: string]: string } = {
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

const ssmlBase = (contents: string) => {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    ${contents}
</speak>`;
};
const ssmlVoice = (voiceName: string, contents: string) => {
  return `<voice name="${voiceName}">${contents}</voice>`;
};
const ssmlStyle = (styleName: string, phrase: string) => {
  return `<mstts:express-as style="${styleName}">${phrase}</mstts:express-as>`;
};

async function playTTS(ttsState: React.MutableRefObject<any>, phrase: string) {
  // TODO should fetch these of a queue or sth. so we get a reliable delay between phrases
  // (e.g. waiting[] in state and then q it when an audio is already playing and fetch one
  //  off the end in onAudioEnd with a constant delay)
  if (ttsState.current.playing) {
    const TTS_WAIT_WHILE_PLAYING_DELAY_MS = 250;
    console.log('waiting on tts');// nocheckin
    setTimeout(() => {
      playTTS(ttsState, phrase);
    }, TTS_WAIT_WHILE_PLAYING_DELAY_MS);
    return;
  }

  // TODO process phrase into words/emotes etc. before sending it to the browser source server
  let finalPhrase = phrase;
  if (ttsState.current.skipEmotes) {
    const words = phrase.split(' ');
    finalPhrase = words
      .filter((word) => {
        return !(word in emoteNameToUrl);
      })
      .join(' ');
  }
  // TODO check we have all neccessary settings
  const speechConfig = SpeechConfig.fromSubscription(
    ttsState.current.apiKey,
    ttsState.current.region
  );

  const player = new SpeakerAudioDestination();
  // setting the volume is broken
  // player.volume = 0;
  player.onAudioEnd = () => {
    ttsState.current.playing = false;
  };
  const audioConfig = AudioConfig.fromSpeakerOutput(player);

  const ssml = ssmlBase(
    ssmlVoice(
      ttsState.current.voiceName,
      // no style -> just insert the phrase without any markup
      ttsState.current.voiceStyle === 'none'
        ? finalPhrase
        : ssmlStyle(ttsState.current.voiceStyle, finalPhrase)
    )
  );

  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
  synthesizer.speakSsmlAsync(
    ssml,
    (result) => {
      if (result) {
        if (result.errorDetails) {
          console.error(result.errorDetails);
        }
        ttsState.current.playing = true;
        synthesizer.close();
        return result.audioData;
      }
      return undefined;
    },
    (error) => {
      console.log(error);
      synthesizer.close();
    }
  );
}

export default function Home() {
  const classes = useStyles();
  const { t } = useTranslation();
  const socket = io(
    `http://localhost:${localStorage.getItem('serverPort') || '4563'}`
  );

  const ttsState = useRef({
    apiKey: ipcRenderer.sendSync('getAzureKey'),
    region: localStorage.getItem('azureRegion') || '',
    voiceLang: localStorage.getItem('azureVoiceLang') || '',
    voiceName: localStorage.getItem('azureVoiceName') || '',
    voiceStyle: localStorage.getItem('ttsVoiceStyle') || '',
    skipEmotes: localStorage.getItem('ttsSkipEmotes') === '1',
    playing: false,
  });
  // only needed for dev env for code reloading
  useEffect(() => {
    console.log('resetting playing');
    ttsState.current.playing = false;
  }, []);
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
  const [voiceStyle, setVoiceStyle] = React.useState(
    localStorage.getItem('ttsVoiceStyle') || ''
  );

  const textHistory: string[] = [];
  let textHistoryPos: number = textHistory.length;

  const addToHistory = (text: string) => {
    if (textHistory[textHistory.length - 1] !== text) {
      textHistory.push(text);
      if (textHistory.length >= 100) {
        textHistory.shift();
      }
      textHistoryPos = textHistory.length;
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
      playTTS(ttsState, phrase);
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

  // currently this component only really udpates after the user comes back
  // from the preferences page so it's fine to have this here for now
  const channelName = localStorage.getItem('channelName');
  const oAuthToken = ipcRenderer.sendSync('getTwitchToken', channelName);
  chat.updateIdentity(channelName, oAuthToken);
  chat.mirrorFromChat = localStorage.getItem('mirrorFromChat') === '1';
  chat.mirrorToChat = localStorage.getItem('mirrorToChat') === '1';
  chat.setOnChatEvent(sendSpeech);

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
      event.target.value = textHistory[textHistoryPos] || '';
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault(); // do not go to the next element.

      if (textHistoryPos <= textHistory.length - 1) {
        textHistoryPos += 1;
      }
      event.target.value = textHistory[textHistoryPos] || '';
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
                        ttsState.current.apiKey === undefined ||
                        ttsState.current.apiKey === ''
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
              <Grid container direction="row" spacing={3}>
                <Grid item xs={3}>
                  <FormControl className={classes.formControl}>
                    <InputLabel id="azure-voice-style-label">
                      {t('Voice style')}
                    </InputLabel>
                    <Select
                      labelId="azure-voice-style-label"
                      id="azure-voice-style"
                      value={voiceStyle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setVoiceStyle(value);
                        localStorage.setItem('ttsVoicestyle', value);
                        ttsState.current.voiceStyle = value;
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
              </Grid>
            )}
          </form>
          {(chat.mirrorFromChat || chat.mirrorToChat) && (
            <ChatStatus
              chatInstance={chat}
              channelName={channelName}
              oAuthToken={oAuthToken}
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
