import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import { VolumeDown, VolumeUp } from '@material-ui/icons';

export type VolumeSliderProps = {
  persistName: string;
  label: string;
  defaultVolume: string;
  valueDisplay: 'on' | 'off' | 'auto';
  onChange?: (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => void;
};

export default function VolumeSlider({
  persistName,
  label,
  defaultVolume,
  valueDisplay,
  onChange = () => {},
}: VolumeSliderProps) {
  const [volume, setVolume] = React.useState<number>(
    parseInt(localStorage.getItem(persistName) || defaultVolume, 10)
  );

  const handleVolumeChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => {
    setVolume(newValue as number);
    localStorage.setItem(persistName, newValue.toString());
    // callback that was registered through props
    onChange(event, newValue);
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
