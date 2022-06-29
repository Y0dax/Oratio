import { ipcRenderer } from 'electron';
import React, { useEffect } from 'react';
import {
  makeStyles,
  createStyles,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { Button, Checkbox, FormControlLabel, Grid } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import { green, red } from '@material-ui/core/colors';
import { useTranslation } from 'react-i18next';
import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig,
  VoiceInfo,
} from 'microsoft-cognitiveservices-speech-sdk';
import * as Theme from './Theme';

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      flexGrow: 1,
      background: theme.palette.background.default,
      color: 'white',
      padding: theme.spacing(4),
    },
    content: {},
    text: {
      color: 'white',
      fontSize: '3rem',
      textAlign: 'center',
    },
    button: {
      padding: theme.spacing(2),
      textAlign: 'center',
      margin: '5px',
    },
    link: {
      textDecoration: 'none',
    },
    bottomButtons: {
      marginTop: '40px',
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: '100%',
    },
  })
);

const bcp47ToLanuageName: { [key: string]: string } = {
  'af-ZA': 'Afrikaans (South Africa)',
  'am-ET': 'Amharic (Ethiopia)',
  'ar-DZ': 'Arabic (Algeria)',
  'ar-BH': 'Arabic (Bahrain)',
  'ar-EG': 'Arabic (Egypt)',
  'ar-IQ': 'Arabic (Iraq)',
  'ar-JO': 'Arabic (Jordan)',
  'ar-KW': 'Arabic (Kuwait)',
  'ar-LY': 'Arabic (Libya)',
  'ar-MA': 'Arabic (Morocco)',
  'ar-QA': 'Arabic (Qatar)',
  'ar-SA': 'Arabic (Saudi Arabia)',
  'ar-SY': 'Arabic (Syria)',
  'ar-TN': 'Arabic (Tunisia)',
  'ar-AE': 'Arabic (United Arab Emirates)',
  'ar-YE': 'Arabic (Yemen)',
  'bn-BD': 'Bangla (Bangladesh)',
  'bn-IN': 'Bengali (India)',
  'bg-BG': 'Bulgarian (Bulgaria)',
  'my-MM': 'Burmese (Myanmar)',
  'ca-ES': 'Catalan (Spain)',
  'zh-HK': 'Chinese (Cantonese, Traditional)',
  'zh-CN': 'Chinese (Mandarin, Simplified)',
  'zh-TW': 'Chinese (Taiwanese Mandarin)',
  'hr-HR': 'Croatian (Croatia)',
  'cs-CZ': 'Czech (Czech)',
  'da-DK': 'Danish (Denmark)',
  'nl-BE': 'Dutch (Belgium)',
  'nl-NL': 'Dutch (Netherlands)',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'en-HK': 'English (Hongkong)',
  'en-IN': 'English (India)',
  'en-IE': 'English (Ireland)',
  'en-KE': 'English (Kenya)',
  'en-NZ': 'English (New Zealand)',
  'en-NG': 'English (Nigeria)',
  'en-PH': 'English (Philippines)',
  'en-SG': 'English (Singapore)',
  'en-ZA': 'English (South Africa)',
  'en-TZ': 'English (Tanzania)',
  'en-GB': 'English (United Kingdom)',
  'en-US': 'English (United States)',
  'et-EE': 'Estonian (Estonia)',
  'fil-PH': 'Filipino (Philippines)',
  'fi-FI': 'Finnish (Finland)',
  'fr-BE': 'French (Belgium)',
  'fr-CA': 'French (Canada)',
  'fr-FR': 'French (France)',
  'fr-CH': 'French (Switzerland)',
  'gl-ES': 'Galician (Spain)',
  'de-AT': 'German (Austria)',
  'de-DE': 'German (Germany)',
  'de-CH': 'German (Switzerland)',
  'el-GR': 'Greek (Greece)',
  'gu-IN': 'Gujarati (India)',
  'he-IL': 'Hebrew (Israel)',
  'hi-IN': 'Hindi (India)',
  'hu-HU': 'Hungarian (Hungary)',
  'is-IS': 'Icelandic (Iceland)',
  'id-ID': 'Indonesian (Indonesia)',
  'ga-IE': 'Irish (Ireland)',
  'it-IT': 'Italian (Italy)',
  'ja-JP': 'Japanese (Japan)',
  'jv-ID': 'Javanese (Indonesia)',
  'kn-IN': 'Kannada (India)',
  'kk-KZ': 'Kazakh (Kazakhstan)',
  'km-KH': 'Khmer (Cambodia)',
  'ko-KR': 'Korean (Korea)',
  'lo-LA': 'Lao (Laos)',
  'lv-LV': 'Latvian (Latvia)',
  'lt-LT': 'Lithuanian (Lithuania)',
  'mk-MK': 'Macedonian (Republic of North Macedonia)',
  'ms-MY': 'Malay (Malaysia)',
  'ml-IN': 'Malayalam (India)',
  'mt-MT': 'Maltese (Malta)',
  'mr-IN': 'Marathi (India)',
  'nb-NO': 'Norwegian (Bokmål, Norway)',
  'ps-AF': 'Pashto (Afghanistan)',
  'fa-IR': 'Persian (Iran)',
  'pl-PL': 'Polish (Poland)',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'ro-RO': 'Romanian (Romania)',
  'ru-RU': 'Russian (Russia)',
  'sr-RS': 'Serbian (Serbia, Cyrillic)',
  'si-LK': 'Sinhala (Sri Lanka)',
  'sk-SK': 'Slovak (Slovakia)',
  'sl-SI': 'Slovenian (Slovenia)',
  'so-SO': 'Somali (Somalia)',
  'es-AR': 'Spanish (Argentina)',
  'es-BO': 'Spanish (Bolivia)',
  'es-CL': 'Spanish (Chile)',
  'es-CO': 'Spanish (Colombia)',
  'es-CR': 'Spanish (Costa Rica)',
  'es-CU': 'Spanish (Cuba)',
  'es-DO': 'Spanish (Dominican Republic)',
  'es-EC': 'Spanish (Ecuador)',
  'es-SV': 'Spanish (El Salvador)',
  'es-GQ': 'Spanish (Equatorial Guinea)',
  'es-GT': 'Spanish (Guatemala)',
  'es-HN': 'Spanish (Honduras)',
  'es-MX': 'Spanish (Mexico)',
  'es-NI': 'Spanish (Nicaragua)',
  'es-PA': 'Spanish (Panama)',
  'es-PY': 'Spanish (Paraguay)',
  'es-PE': 'Spanish (Peru)',
  'es-PR': 'Spanish (Puerto Rico)',
  'es-ES': 'Spanish (Spain)',
  'es-UY': 'Spanish (Uruguay)',
  'es-US': 'Spanish (United States)',
  'es-VE': 'Spanish (Venezuela)',
  'su-ID': 'Sundanese (Indonesia)',
  'sw-KE': 'Swahili (Kenya)',
  'sw-TZ': 'Swahili (Tanzania)',
  'sv-SE': 'Swedish (Sweden)',
  'ta-IN': 'Tamil (India)',
  'ta-SG': 'Tamil (Singapore)',
  'ta-LK': 'Tamil (Sri Lanka)',
  'te-IN': 'Telugu (India)',
  'th-TH': 'Thai (Thailand)',
  'tr-TR': 'Turkish (Turkey)',
  'uk-UA': 'Ukrainian (Ukraine)',
  'ur-IN': 'Urdu (India)',
  'ur-PK': 'Urdu (Pakistan)',
  'uz-UZ': 'Uzbek (Uzbekistan)',
  'vi-VN': 'Vietnamese (Vietnam)',
  'cy-GB': 'Welsh (United Kingdom)',
  'zu-ZA': 'Zulu (South Africa)',
};

async function getVoicesAsync(
  key: string,
  region: string,
  lang: string,
  ref: React.MutableRefObject<VoiceInfo[]>
) {
  const speechConfig = SpeechConfig.fromSubscription(key, region);
  const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
  const voices = await synthesizer.getVoicesAsync(lang);
  if (voices !== undefined) {
    ref.current = voices.voices;
  }
}

export default function TTSSettings() {
  const classes = useStyles();
  const { t } = useTranslation();

  const [azureApiKey, setAzureApiKey] = React.useState('');
  const [apiKeyErrorMessage, setApiKeyErrorMessage] = React.useState('');

  const [azureRegion, setAzureRegion] = React.useState(
    localStorage.getItem('azureRegion') || ''
  );
  const [azureVoiceLang, setAzureVoiceLang] = React.useState(
    localStorage.getItem('azureVoiceLang') || 'en-US'
  );
  const [azureVoiceName, setAzureVoiceName] = React.useState(
    localStorage.getItem('azureVoiceName') || ''
  );
  const [skipEmotes, setSkipEmotes] = React.useState(
    localStorage.getItem('ttsSkipEmotes') === '1'
  );

  const availableVoices: React.MutableRefObject<VoiceInfo[]> = React.useRef([]);
  useEffect(() => {
    const apiKey = ipcRenderer.sendSync('getAzureKey');
    async function updateState() {
      await getVoicesAsync(
        apiKey,
        azureRegion,
        azureVoiceLang,
        availableVoices
      );
      // do this here so the re-render happens after getting voices
      setAzureApiKey(apiKey);
    }
    // eslint-disable-next-line eqeqeq
    if (apiKey != undefined && apiKey !== '') {
      updateState();
    }
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <div className={classes.content}>
          <h2>{t('Text To Speech Settings')}</h2>
          <Grid container direction="row" spacing={3}>
            <Grid item xs={6}>
              <TextField
                className={classes.formControl}
                id="azure-api-key"
                fullWidth
                label={t('Azure Speech API Key')}
                value={azureApiKey}
                error={apiKeyErrorMessage !== ''}
                helperText={apiKeyErrorMessage}
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const trimmed = e.target.value.trim();
                  if (!trimmed.match(/[a-fA-F0-9]{32}/)) {
                    setApiKeyErrorMessage('Invalid API key');
                  } else {
                    setApiKeyErrorMessage('');
                    ipcRenderer.send('setAzureKey', trimmed);
                    // get voices assuming we didn't have a valid key before, so voices should be empty
                    // need to await here so the re-render happens after we got new voices
                    await getVoicesAsync(
                      trimmed,
                      azureRegion,
                      azureVoiceLang,
                      availableVoices
                    );
                  }
                  setAzureApiKey(trimmed);
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                className={classes.formControl}
                id="azure-region"
                fullWidth
                label={t('Azure Region')}
                value={azureRegion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const trimmed = e.target.value.trim();
                  // TODO validation?
                  setAzureRegion(trimmed);
                  localStorage.setItem('azureRegion', trimmed);
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl className={classes.formControl}>
                <InputLabel id="azure-voice-lang-label">
                  {t('Azure Voice Language')}
                </InputLabel>
                <Select
                  labelId="azure-voice-lang-label"
                  id="azure-voice-lang"
                  value={azureVoiceLang}
                  onChange={async (event) => {
                    if (event.target.value !== azureVoiceLang) {
                      setAzureVoiceName('');
                      await getVoicesAsync(
                        azureApiKey,
                        azureRegion,
                        event.target.value,
                        availableVoices
                      );
                      // TODO validation?
                      localStorage.setItem(
                        'azureVoiceLang',
                        event.target.value
                      );
                      setAzureVoiceLang(event.target.value);
                    }
                  }}
                >
                  {Object.entries(bcp47ToLanuageName).map(
                      ([code, name]: [string, string]) => (
                      <MenuItem key={code} value={code}>
                        {name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl className={classes.formControl}>
                <InputLabel id="azure-voice-name-label">
                  {t('Azure Voice Name')}
                </InputLabel>
                <Select
                  labelId="azure-voice-name-label"
                  id="azure-voice-name"
                  value={azureVoiceName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const trimmed = e.target.value.trim();
                    // TODO validation?
                    setAzureVoiceName(trimmed);
                    localStorage.setItem('azureVoiceName', trimmed);
                  }}
                >
                  {availableVoices.current.map((voiceInfo: VoiceInfo) => (
                    <MenuItem
                      key={voiceInfo.shortName}
                      value={voiceInfo.shortName}
                    >
                      {voiceInfo.localName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container direction="row" spacing={3}>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    style={
                      skipEmotes ? { color: green[500] } : { color: red[500] }
                    }
                    checked={skipEmotes}
                    onChange={(event) => {
                      setSkipEmotes(event.currentTarget.checked);
                      localStorage.setItem(
                        'ttsSkipEmotes',
                        event.currentTarget.checked ? '1' : '0'
                      );
                    }}
                  />
                }
                label={t('Skip emotes')}
                labelPlacement="start"
              />
            </Grid>
          </Grid>
          <Grid
            container
            direction="row"
            spacing={3}
            className={classes.bottomButtons}
          >
            <Grid item xs={4}>
              <Link to="/preferences" className={classes.link}>
                <Button
                  id="open-preferences"
                  variant="contained"
                  className={classes.button}
                  color="primary"
                >
                  {t('Back')}
                </Button>
              </Link>
            </Grid>
          </Grid>
        </div>
      </div>
    </MuiThemeProvider>
  );
}
