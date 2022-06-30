import * as tmi from 'tmi.js';

export default class ChatInteraction {
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
