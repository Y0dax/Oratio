import React from 'react';

import {
  makeStyles,
  createStyles,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import { Button, Grid } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Theme from './Theme';
import FontSizeSlider from './settings/FontSizeSlider';
import FontColorPicker from './settings/FontColorPicker';
import FontBoldSlider from './settings/FontBoldSlider';
import AudioSelector from './settings/AudioSelector';
import TextSpeedSlider from './settings/TextSpeedSlider';
import VolumeSlider from './settings/VolumeSlider';
import BubbleBackgroundColorPicker from './settings/BubbleBackgroundColorSlider';
import LanguageSelector from './settings/LanguageSelector';

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
  })
);

export default function Preferences() {
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <div className={classes.content}>
          <form noValidate autoComplete="off">
            <Grid container direction="row" spacing={3}>
              <Grid item xs={6}>
                <AudioSelector />
              </Grid>
              <Grid item xs={6}>
                <VolumeSlider />
              </Grid>
              <Grid item xs={6}>
                <TextSpeedSlider />
              </Grid>
              <Grid item xs={6}>
                <FontSizeSlider />
              </Grid>
              <Grid item xs={6}>
                <FontBoldSlider />
              </Grid>
              <Grid item xs={6}>
                <LanguageSelector />
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
