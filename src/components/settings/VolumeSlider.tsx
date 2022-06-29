import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import { VolumeDown, VolumeUp } from '@material-ui/icons';

export type VolumeSliderProps = {
  persistName: string;
  label: string;
  defaultVolume: string;
  valueDisplay: 'on' | 'off' | 'auto';
};

export default function VolumeSlider(props: VolumeSliderProps) {
  const { persistName, label, defaultVolume, valueDisplay } = props;
  const [volume, setVolume] = React.useState<number>(
    parseInt(localStorage.getItem(persistName) || defaultVolume, 10)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleVolumeChange = (_event: any, newValue: number | number[]) => {
    setVolume(newValue as number);
    localStorage.setItem(persistName, newValue.toString());
  };

  return (
    <div>
      <Typography id="continuous-slider" gutterBottom>
        {label}
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
            valueLabelDisplay={valueDisplay}
          />
        </Grid>
        <Grid item>
          <VolumeUp />
        </Grid>
      </Grid>
    </div>
  );
}
