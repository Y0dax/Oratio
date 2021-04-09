import React from 'react';

import { Grid, Typography } from '@material-ui/core';
import ColorLensIcon from '@material-ui/icons/ColorLens';
import { SketchPicker } from 'react-color';

export default function FontColorPicker() {
  const initColor = localStorage.getItem('fontColor') || '#ffffff';
  const [fontColor, setFontColor] = React.useState<string>(initColor);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFontColorChange = (color: any) => {
    setFontColor(color.hex);
    localStorage.setItem('fontColor', color.hex);
  };

  return (
    <div>
      <Typography id="color-selector" gutterBottom>
        Text Color
      </Typography>
      <Grid container spacing={3}>
        <Grid item>
          <ColorLensIcon />
        </Grid>
        <Grid item xs>
          <SketchPicker
            color={fontColor}
            onChangeComplete={handleFontColorChange}
          />
        </Grid>
      </Grid>
    </div>
  );
}
