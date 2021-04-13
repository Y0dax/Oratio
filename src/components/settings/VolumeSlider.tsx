import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import { VolumeDown, VolumeUp } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';

export default function VolumeSlider() {
  const { t } = useTranslation();
  const [volume, setVolume] = React.useState<number>(
    parseInt(localStorage.getItem('volume') || '25', 10)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleVolumeChange = (_event: any, newValue: number | number[]) => {
    setVolume(newValue as number);
    localStorage.setItem('volume', newValue.toString());
  };

  return (
    <div>
      <Typography id="continuous-slider" gutterBottom>
        {t('Volume')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item>
          <VolumeDown />
        </Grid>
        <Grid item xs>
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            aria-labelledby="continuous-slider"
            valueLabelDisplay="on"
          />
        </Grid>
        <Grid item>
          <VolumeUp />
        </Grid>
      </Grid>
    </div>
  );
}
