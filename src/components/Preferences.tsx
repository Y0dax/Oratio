import React from 'react';

import {
  makeStyles,
  createStyles,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import { Button, Grid } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import RecordVoiceOverIcon from '@material-ui/icons/RecordVoiceOver';
import SpeedIcon from '@material-ui/icons/Speed';
import FormatSizeIcon from '@material-ui/icons/FormatSize';
import * as Theme from './Theme';
import FontColorPicker from './settings/FontColorPicker';
import FontBoldSlider from './settings/FontBoldSlider';
import AudioSelector from './settings/AudioSelector';
import SliderWithIcon from './settings/SliderWithIcon';
import VolumeSlider from './settings/VolumeSlider';
import BubbleBackgroundColorPicker from './settings/BubbleBackgroundColorSlider';
import LanguageSelector from './settings/LanguageSelector';
import ChatSettings from './settings/ChatSettings';

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      flexGrow: 1,
      background: theme.palette.background.default,
      color: 'white',
      height: '100vh',
      padding: theme.spacing(4),
    },
    content: {
      padding: theme.spacing(4),
    },
    text: {
      color: 'white',
      fontSize: '3rem',
      textAlign: 'center',
    },
    button: {
      padding: theme.spacing(2),
      textAlign: 'center',
    },
    link: {
      textDecoration: 'none',
    },
    bottomButtons: {
      marginTop: '40px',
    },
    emoteIcon: {
      marginRight: '8px',
    },
  })
);

const localStorageVolumeName = 'volume';
const localStorageTextSpeed = 'textSpeed';
const localStorageFontSize = 'fontSize';

export default function Preferences() {
  const classes = useStyles();
  const { t } = useTranslation();

  const [volume, setVolume] = React.useState<number>(
    parseInt(localStorage.getItem(localStorageVolumeName) || '25', 10)
  );

  const handleVolumeChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => {
    setVolume(newValue as number);
    localStorage.setItem(localStorageVolumeName, newValue.toString());
  };

  const [textSpeed, setTextSpeed] = React.useState<number>(
    parseFloat(localStorage.getItem(localStorageTextSpeed) || '75')
  );

  const handleTextSpeedChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => {
    setTextSpeed(newValue as number);
    localStorage.setItem(localStorageTextSpeed, newValue.toString());
  };

  const [textSize, setTextSize] = React.useState<number>(
    parseFloat(localStorage.getItem(localStorageFontSize) || '48')
  );

  const handelFontSizeChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => {
    setTextSize(newValue as number);
    localStorage.setItem(localStorageFontSize, newValue.toString());
  };

  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <div className={classes.content}>
          <form noValidate autoComplete="off">
            <Grid container direction="row" spacing={3}>
              <Grid item xs={12}>
                <ChatSettings />
              </Grid>
              <Grid item xs={6}>
                <AudioSelector />
              </Grid>
              <Grid item xs={6}>
                <VolumeSlider
                  label={t('Volume')}
                  value={volume}
                  onChange={handleVolumeChange}
                  valueDisplay="on"
                />
              </Grid>
              <Grid item xs={6}>
                <SliderWithIcon
                  value={textSpeed}
                  defaultValue="75"
                  label={t('Text Speed')}
                  displayValue="on"
                  onChange={handleTextSpeedChange}
                  icon={<SpeedIcon />}
                />
              </Grid>
              <Grid item xs={6}>
                <SliderWithIcon
                  value={textSize}
                  label={t('Text Size')}
                  displayValue="on"
                  max={200}
                  onChange={handelFontSizeChange}
                  icon={<FormatSizeIcon />}
                />
              </Grid>
              <Grid item xs={6}>
                <FontBoldSlider />
              </Grid>
              <Grid item xs={6}>
                <LanguageSelector />
              </Grid>
              <Grid item xs={12}>
                <Link to="/emotes" className={classes.link}>
                  <Button
                    id="open-preferences-emotes"
                    variant="contained"
                    className={classes.button}
                    color="primary"
                  >
                    <InsertEmoticonIcon className={classes.emoteIcon} />
                    {t('Manage Emotes')}
                  </Button>
                </Link>
              </Grid>
              <Grid item xs={12}>
                <Link to="/tts" className={classes.link}>
                  <Button
                    id="open-preferences-tts"
                    variant="contained"
                    className={classes.button}
                    color="primary"
                  >
                    <RecordVoiceOverIcon className={classes.emoteIcon} />
                    {t('Text To Speech Settings')}
                  </Button>
                </Link>
              </Grid>
              <Grid item xs={6}>
                <FontColorPicker />
              </Grid>
              <Grid item xs={6}>
                <BubbleBackgroundColorPicker />
              </Grid>
            </Grid>
            <Grid
              container
              direction="row"
              spacing={3}
              className={classes.bottomButtons}
            >
              <Grid item xs={4}>
                <Link to="/home" className={classes.link}>
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
          </form>
        </div>
      </div>
    </MuiThemeProvider>
  );
}
