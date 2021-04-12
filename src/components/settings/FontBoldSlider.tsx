import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import FormatBoldIcon from '@material-ui/icons/FormatBold';

export default function FontBoldSlider() {
  const [fontWeight, setFontWeight] = React.useState<number>(
    parseInt(localStorage.getItem('fontWeight') || '400', 10)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFontWeightChange = (_event: any, newValue: number | number[]) => {
    setFontWeight(newValue as number);
    localStorage.setItem('fontWeight', newValue.toString());
  };

  return (
    <div>
      <Typography id="continuous-slider" gutterBottom>
        Text Boldness
      </Typography>
      <Grid container spacing={3}>
        <Grid item>
          <FormatBoldIcon />
        </Grid>
        <Grid item xs>
          <Slider
            value={fontWeight}
            onChange={handleFontWeightChange}
            aria-labelledby="continuous-slider"
            valueLabelDisplay="on"
            max={900}
            min={100}
            step={100}
            marks
          />
        </Grid>
      </Grid>
    </div>
  );
}
