import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import FormatSizeIcon from '@material-ui/icons/FormatSize';

export default function FontSizeSlider() {
  const [fontSize, setFontSize] = React.useState<number>(
    parseInt(localStorage.getItem('fontSize') || '48', 10)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFontSizeChange = (_event: any, newValue: number | number[]) => {
    setFontSize(newValue as number);
    localStorage.setItem('fontSize', newValue.toString());
  };

  return (
    <div>
      <Typography id="continuous-slider" gutterBottom>
        Text Size
      </Typography>
      <Grid container spacing={3}>
        <Grid item>
          <FormatSizeIcon />
        </Grid>
        <Grid item xs>
          <Slider
            value={fontSize}
            onChange={handleFontSizeChange}
            aria-labelledby="continuous-slider"
            valueLabelDisplay="on"
            max={200}
          />
        </Grid>
      </Grid>
    </div>
  );
}
