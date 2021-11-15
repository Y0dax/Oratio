import React, { useEffect } from 'react';
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
import { BrowserWindow, remote } from 'electron';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import * as tmi from 'tmi.js';
import * as Theme from './Theme';

import { lowercaseToEmoteName } from './Emotes';

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      // flexGrow: 1,
      // height: '100vh',
      background: theme.palette.background.default,
      color: 'white',
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
    bottomButtons: {
      marginTop: '40px',
    },
    browserSource: {
      flexGrow: 1,
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
    win.loadURL(`file://${__dirname}/index.html#/obs`);

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

  connectionStatusSetter: ((value: string) => void) | null;

  channelStatusSetter: ((value: string) => void) | null;

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
    this.connectionStatusSetter = null;
    this.channelStatusSetter = null;

    // setup connection events
    // channel events are triggered for __every__ user so we rely on failure/success
    // of changeChannel instead
    this.client.on('connected', () => {
      if (this.connectionStatusSetter !== null) {
        this.connectionStatusSetter('OK');
      }
    });
    this.client.on('connecting', () => {
      if (this.connectionStatusSetter !== null) {
        this.connectionStatusSetter('CONNECTING');
      }
    });
    this.client.on('disconnected', () => {
      if (this.connectionStatusSetter !== null) {
        this.connectionStatusSetter('DISCONNECTED');
      }
    });
    this.client.on('reconnect', () => {
      if (this.connectionStatusSetter !== null) {
        this.connectionStatusSetter('RECONNECTING');
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
      console.log('-------ERROR------- connecting');
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
    if (this.channelStatusSetter !== null) {
      this.channelStatusSetter(`#${channel}`);
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
    return channels.length > 0 ? channels[0] : 'NONE';
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
  // using the set* functions will trigger a re-render of this component
  // meaning this function will be re-executed
  // so that's why it's better to have this as a separate component
  const [serverStatus, setServerStatus] = React.useState(
    chatInstance.connectionStatus()
  );
  const [channelStatus, setChannelStatus] = React.useState(
    chatInstance.channelStatus()
  );
  chatInstance.connectionStatusSetter = setServerStatus;
  chatInstance.channelStatusSetter = setChannelStatus;

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
        volume: parseFloat(localStorage.getItem('volume') || '50') / 100,
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
  const oAuthToken = localStorage.getItem('oAuthToken');
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
              <Grid container item xs={12} justify-content="flex-end">
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
              </Grid>
            </Grid>
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
            <Grid
              container
              spacing={3}
              alignContent="flex-end"
              justify-content="flex-end"
              className={classes.bottomButtons}
            >
              {/* <Grid container item justify-content="flex-end" xs={12}> */}
              <div className={classes.browserSource}>
                Browser source running at:{' '}
                <a
                  href="http://localhost:4563"
                  target="_blank"
                  rel="noreferrer"
                >
                  http://localhost:4563
                </a>
              </div>
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
              {/* </Grid> */}
            </Grid>
          </div>
        </div>
      </div>
    </MuiThemeProvider>
  );
}
