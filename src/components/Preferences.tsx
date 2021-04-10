import React from 'react';

import {
  makeStyles,
  createStyles,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { Link } from 'react-router-dom';
import * as Theme from './Theme';
import FontSizeSlider from './settings/FontSizeSlider';
import FontColorPicker from './settings/FontColorPicker';
import FontBoldSlider from './settings/FontBoldSlider';
import AudioSelector from './settings/AudioSelector';
import TextSpeedSlider from './settings/TextSpeedSlider';
import VolumeSlider from './settings/VolumeSlider';

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
  })
);

export default function Preferences() {
  const classes = useStyles();
  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <div className={classes.content}>
          <form
            noValidate
            autoComplete="off"
            // onSubmit={handleSpeechSendClicked}
          >
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
                <FontColorPicker />
              </Grid>
              <Grid item xs={6}>
                <FontBoldSlider />
              </Grid>
            </Grid>
            <Link to="/home">Home</Link>
          </form>
        </div>
      </div>
    </MuiThemeProvider>
  );
}
