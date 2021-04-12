import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import SpeedIcon from '@material-ui/icons/Speed';

export default function TextSpeedSlider() {
  const [textSpeed, setTextSpeed] = React.useState<number>(
    parseInt(localStorage.getItem('textSpeed') || '75', 10)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTextSpeedChange = (_event: any, newValue: number | number[]) => {
    setTextSpeed(newValue as number);
    localStorage.setItem('textSpeed', newValue.toString());
  };

  return (
    <div>
      <Typography id="continuous-slider" gutterBottom>
        Text Speed
      </Typography>
      <Grid container spacing={3}>
        <Grid item>
          <SpeedIcon />
        </Grid>
        <Grid item xs>
          <Slider
            value={textSpeed}
            onChange={handleTextSpeedChange}
            aria-labelledby="continuous-slider"
            valueLabelDisplay="on"
            max={100}
          />
        </Grid>
      </Grid>
    </div>
  );
}
