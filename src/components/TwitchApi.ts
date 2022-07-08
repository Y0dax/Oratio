import https from 'https';

export interface User {
  id: number;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

// twitch emoticon url format:
// https://static-cdn.jtvnw.net/emoticons/v2/<id>/<format>/<theme_mode>/<scale>
// scale: 1.0 (small), 2.0 (medium), 3.0 (large)
// theme_mode: light, dark
// format: static, animated
export interface TwitchEmote {
  id: string;
  name: string;
  images: { url_1x: string; url_2x: string; url_3x: string };
  format: string[];
  scale: string[];
  theme_mode: string[];
}

// does not include an url, the format is:
// https://cdn.betterttv.net/emote/${id}/${version}
// size range: 1-3
export interface BTTVEmote {
  id: string;
  code: string;
  imageType: string;
  userId: string;
}

export interface FFZEmote {
  id: number;
  name: string;
  height: number;
  width: number;
  public: boolean;
  hidden: boolean;
  modifier: boolean;
  offset: number | null;
  margins: number | null;
  css: string | null;
  owner: unknown;
  urls: { 1: string; 2?: string; 4?: string };
  status: number;
  usage_count: number;
  created_at: string;
  last_updated: string;
}

export interface FFZEmoteSet {
  id: number;
  _type: string | null;
  title: string;
  css: string | null;
  emoticons: FFZEmote[];
}

export interface SevenTVEmote {
  id: string;
  name: string;
  owner: unknown;
  visibility: number;
  visibility_simple: string[];
  mime: string;
  status: number;
  tags: string[];
  width: number[];
  height: number[];
  // emote size number, emote url
  urls: [string, string][];
}

export interface Emote {
  id: string;
  name: string;
  url: string;
}

export interface EmoteGroupsGlobal {
  twitchGlobal: Emote[];
  bttvGlobal: Emote[];
  ffzGlobal: Emote[];
  sevenTVGlobal: Emote[];
}

export interface EmoteGroupsChannel {
  twitchChannel: Emote[];
  bttvChannel: Emote[];
  ffzChannel: Emote[];
  sevenTVChannel: Emote[];
}

export default class TwitchApi {
  readonly baseURI: string = 'https://api.twitch.tv/helix';

  readonly baseURIBTTV: string = 'https://api.betterttv.net/3';

  readonly baseURIFFZ: string = 'https://api.frankerfacez.com/v1';

  readonly baseURI7TV: string = 'https://api.7tv.app/v2';

  readonly tokenType: string = 'Bearer';

  #authHeaders: { Authorization: string; 'Client-Id': string };

  constructor(
    public clientId: string,
    public authToken: string,
    // callback for when we get a 401: Unauthorized response
    public authFailedCallback: () => void
  ) {
    this.clientId = clientId;
    this.authToken = authToken;
    this.authFailedCallback = authFailedCallback;
    this.#authHeaders = {
      Authorization: `${this.tokenType} ${authToken}`,
      'Client-Id': clientId,
    };
  }

  async apiRequest(url: string | URL, twitch: boolean): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {};
      // only need the default headers twich api calls
      if (twitch) {
        options.headers = this.#authHeaders;
      }

      const req = https.request(url.toString(), options, (res) => {
        const data: Uint8Array[] = [];

        // push chunk into data array when we receive it
        res.on('data', (chunk) => {
          data.push(chunk);
        });

        res.on('end', () => {
          // sending data finished
          const result = JSON.parse(Buffer.concat(data).toString());
          this.checkStatus(result);
          resolve(result);
        });

        res.on('error', (error) => {
          reject(error);
        });
      });
      req.end();
    });
  }

  checkStatus(data: { [key: string]: unknown }) {
    if (data.status === 401 || data.status === '401') {
      this.authFailedCallback();
    }
  }

  async getUsersByLogin(logins: [string]): Promise<User[]> {
    const url = new URL(`${this.baseURI}/users`);
    for (const login of logins) {
      url.searchParams.append('login', login);
    }

    const users = (await this.apiRequest(url, true)) as {
      data?: User[];
    };
    if (users.data) {
      return users.data;
    }
    return [];
  }

  async getUserId(login: string): Promise<number | null> {
    const users = await this.getUsersByLogin([login]);
    if (users.length > 0) {
      return users[0].id;
    }
    return null;
  }

  async getGlobalEmotesTwitch(): Promise<TwitchEmote[]> {
    const url = `${this.baseURI}/chat/emotes/global`;
    const resp = (await this.apiRequest(url, true)) as { data?: TwitchEmote[] };
    if (resp.data) {
      return resp.data;
    }
    return [];
  }

  async getChannelEmotesTwitch(user_id: number): Promise<TwitchEmote[]> {
    const url = `${this.baseURI}/chat/emotes?broadcaster_id=${user_id}`;
    const resp = (await this.apiRequest(url, true)) as { data?: TwitchEmote[] };
    if (resp.data) {
      return resp.data;
    }
    return [];
  }

  async getGlobalEmotesBTTV(): Promise<BTTVEmote[]> {
    const url = `${this.baseURIBTTV}/cached/emotes/global`;
    const resp = (await this.apiRequest(url, false)) as BTTVEmote[];
    if (resp) {
      return resp;
    }
    return [];
  }

  async getChannelEmotesBTTV(user_id: number): Promise<BTTVEmote[]> {
    const url = `${this.baseURIBTTV}/cached/users/twitch/${user_id}`;
    const resp = (await this.apiRequest(url, false)) as {
      channelEmotes?: BTTVEmote[];
      sharedEmotes: BTTVEmote[];
    };
    // user might not exist on bttv
    if (resp && resp.channelEmotes) {
      const emotes: BTTVEmote[] = [...resp.channelEmotes, ...resp.sharedEmotes];
      return emotes;
    }
    return [];
  }

  async getGlobalEmotesFFZ(): Promise<FFZEmote[]> {
    const url = `${this.baseURIFFZ}/set/global`;
    const resp = (await this.apiRequest(url, false)) as {
      sets?: { [setId: string]: FFZEmoteSet };
    };
    if (resp.sets) {
      // collect all the emotes of all the sets
      let emotes: FFZEmote[] = [];
      for (const [, set] of Object.entries(resp.sets)) {
        emotes = emotes.concat(set.emoticons);
      }

      return emotes;
    }
    return [];
  }

  async getChannelEmotesFFZ(user_id: number): Promise<FFZEmote[]> {
    const url = `${this.baseURIFFZ}/room/id/${user_id}`;
    const resp = (await this.apiRequest(url, false)) as {
      sets?: { [setId: string]: FFZEmoteSet };
    };
    if (resp.sets) {
      // collect all the emotes of all the sets
      let emotes: FFZEmote[] = [];
      for (const [, set] of Object.entries(resp.sets)) {
        emotes = emotes.concat(set.emoticons);
      }

      return emotes;
    }
    return [];
  }

  async getGlobalEmotes7TV(): Promise<SevenTVEmote[]> {
    const url = `${this.baseURI7TV}/emotes/global`;
    const resp = (await this.apiRequest(url, false)) as
      | SevenTVEmote[]
      | undefined;
    if (resp) {
      return resp;
    }
    return [];
  }

  async getChannelEmotes7TV(user_id: number): Promise<SevenTVEmote[]> {
    const url = `${this.baseURI7TV}/users/${user_id}/emotes`;
    const resp = (await this.apiRequest(url, false)) as
      | SevenTVEmote[]
      | unknown;
    // will return 'status', 'message' and 'reason' on error
    if (Array.isArray(resp)) {
      return resp;
    }
    return [];
  }

  // NOTE: currently we just choose the largest __available__ size
  // we could also choose the same size every time 3x/3.0/4x..
  // since the api just returns the upscaled image
  // TODO ^
  static bttvEmoteToURL(emote: BTTVEmote): string {
    // alwasy get biggest version (3x)
    return `https://cdn.betterttv.net/emote/${emote.id}/3x`;
  }

  static convertTwitchEmote(emote: TwitchEmote): Emote {
    // https://static-cdn.jtvnw.net/emoticons/v2/<id>/<format>/<theme_mode>/<scale>
    // scale: 1.0 (small), 2.0 (medium), 3.0 (large)
    // theme_mode: light, dark
    // format: static, animated
    // alway choose biggest scale
    // prefer dark themed
    const themeMode = 'dark';
    // assuming format.length > 1 means there is an animated version
    const url = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/\
${emote.format.length > 1 ? 'animated' : 'static'}/\
${themeMode}/${emote.scale[emote.scale.length - 1]}`;

    return { id: emote.id, name: emote.name, url };
  }

  static convertBTTVEmote(emote: BTTVEmote): Emote {
    return {
      id: emote.id,
      name: emote.code,
      url: TwitchApi.bttvEmoteToURL(emote),
    };
  }

  static convertFFZEmote(emote: FFZEmote): Emote {
    // prioritize by size
    const url = emote.urls['4'] || emote.urls['2'] || emote.urls['1'];
    // url is missing the protocol part
    return { id: emote.id.toString(), name: emote.name, url: `https:${url}` };
  }

  static convert7TVEmote(emote: SevenTVEmote): Emote {
    // prioritize by size
    // [size number, url]
    const url = emote.urls[emote.urls.length - 1][1];
    return { id: emote.id, name: emote.name, url };
  }

  async getGlobalEmotes(): Promise<EmoteGroupsGlobal> {
    const allEmotes: EmoteGroupsGlobal = {
      // get global emotes, convert them to our common emote
      twitchGlobal: (await this.getGlobalEmotesTwitch()).map(
        TwitchApi.convertTwitchEmote
      ),
      bttvGlobal: (await this.getGlobalEmotesBTTV()).map(
        TwitchApi.convertBTTVEmote
      ),
      ffzGlobal: (await this.getGlobalEmotesFFZ()).map(
        TwitchApi.convertFFZEmote
      ),
      sevenTVGlobal: (await this.getGlobalEmotes7TV()).map(
        TwitchApi.convert7TVEmote
      ),
    };

    return allEmotes;
  }

  async getChannelEmotes(user_id: number): Promise<EmoteGroupsChannel> {
    const allEmotes: EmoteGroupsChannel = {
      twitchChannel: (await this.getChannelEmotesTwitch(user_id)).map(
        TwitchApi.convertTwitchEmote
      ),
      bttvChannel: (await this.getChannelEmotesBTTV(user_id)).map(
        TwitchApi.convertBTTVEmote
      ),
      ffzChannel: (await this.getChannelEmotesFFZ(user_id)).map(
        TwitchApi.convertFFZEmote
      ),
      sevenTVChannel: (await this.getChannelEmotes7TV(user_id)).map(
        TwitchApi.convert7TVEmote
      ),
    };

    return allEmotes;
  }

  async getTwitchChannelEmotesConverted(
    user_id: number
  ): Promise<{ twitchChannel: Emote[] }> {
    return {
      twitchChannel: (await this.getChannelEmotesTwitch(user_id)).map(
        TwitchApi.convertTwitchEmote
      ),
    };
  }
}
