import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig,
  SpeakerAudioDestination,
} from 'microsoft-cognitiveservices-speech-sdk';
import uEmojiParser from 'universal-emoji-parser';
import { emoteNameToUrl } from './components/Emotes';

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
  // no style -> just insert the phrase without any markup
  if (styleName === 'none') {
    return phrase;
  }

  return `<mstts:express-as style="${styleName}">${phrase}</mstts:express-as>`;
};

const ssmlProsody = (
  pitch: number,
  rate: number,
  volume: number,
  contents: string
) => {
  return `<prosody pitch="${pitch}%" rate="${rate}" volume="${volume}">${contents}</prosody>`;
};

type EmojiObject = {
  category: string;
  char: string;
  fitzpatrick_scale: boolean;
  keywords: string[];
};

function replaceEmojiCodes(str: string): string {
  return str.replace(/:([^:\s]*):/g, (code: string) => {
    const emoji: EmojiObject | undefined =
      uEmojiParser.getEmojiObjectByCode(code);
    if (emoji) {
      return emoji.char;
    }

    return code;
  });
}

const XML_SPECIAL_TO_ESCAPE: { [key: string]: string } = {
  '"': '&quot;',
  "'": '&apos;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

const xmlEscape = (str: string) => {
  return str.replace(/["'&<>]/g, (c: string) => {
    return XML_SPECIAL_TO_ESCAPE[c];
  });
};

export type TTSSettings = {
  apiKey: string;
  region: string;
  skipEmotes: boolean;
};

export type TTSVoiceSettings = {
  voiceLang: string;
  voiceName: string;
  voiceStyle: string;
  // -100 -- 100 (gets added to default pitch in %)
  voicePitch: number;
  // 0-3 relative to normal rate
  voiceRate: number;
  // 0-100%
  voiceVolume: number;
};

export async function playTTS(
  ttsSettings: TTSSettings,
  voiceSettings: TTSVoiceSettings,
  ttsPlaying: React.MutableRefObject<boolean>,
  phrase: string
) {
  // TODO should fetch these of a queue or sth. so we get a reliable delay between phrases
  // (e.g. waiting[] in state and then q it when an audio is already playing and fetch one
  //  off the end in onAudioEnd with a constant delay)
  if (ttsPlaying.current) {
    const TTS_WAIT_WHILE_PLAYING_DELAY_MS = 250;
    setTimeout(() => {
      playTTS(ttsSettings, voiceSettings, ttsPlaying, phrase);
    }, TTS_WAIT_WHILE_PLAYING_DELAY_MS);
    return;
  }

  // TODO process phrase into words/emotes etc. before sending it to the browser source server
  let finalPhrase = phrase;
  if (ttsSettings.skipEmotes) {
    const words = phrase.split(' ');
    finalPhrase = words
      .filter((word) => {
        return !(word in emoteNameToUrl);
      })
      .join(' ');
  }
  // TODO check we have all neccessary settings
  const speechConfig = SpeechConfig.fromSubscription(
    ttsSettings.apiKey,
    ttsSettings.region
  );

  const player = new SpeakerAudioDestination();
  // setting the volume is broken
  // player.volume = 0;
  player.onAudioEnd = () => {
    ttsPlaying.current = false;
  };
  const audioConfig = AudioConfig.fromSpeakerOutput(player);

  const ssml = ssmlBase(
    ssmlVoice(
      voiceSettings.voiceName,
      ssmlStyle(
        voiceSettings.voiceStyle,
        ssmlProsody(
          voiceSettings.voicePitch,
          voiceSettings.voiceRate,
          voiceSettings.voiceVolume,
          xmlEscape(replaceEmojiCodes(finalPhrase))
        )
      )
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
        ttsPlaying.current = true;
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
