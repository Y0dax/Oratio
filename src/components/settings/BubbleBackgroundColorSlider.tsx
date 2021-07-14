import React from 'react';

import { Grid, Typography } from '@material-ui/core';
import ColorLensIcon from '@material-ui/icons/ColorLens';
import { SketchPicker } from 'react-color';
import { useTranslation } from 'react-i18next';

export default function BubbleBackgroundColorPicker() {
  const { t } = useTranslation();
  const initColor = localStorage.getItem('bubbleColor') || '#ffffff';
  const [bubbleColor, setBackgroundColor] = React.useState<string>(initColor);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlebackgroundColorChange = (color: any) => {
    setBackgroundColor(color.hex);
    localStorage.setItem('bubbleColor', color.hex);
  };

  return (
    <div>
      <Typography id="color-selector" gutterBottom>
        <ColorLensIcon /> {t('Speech Bubble Color')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs>
          <SketchPicker
            color={bubbleColor}
            onChangeComplete={handlebackgroundColorChange}
          />
        </Grid>
      </Grid>
    </div>
  );
}
