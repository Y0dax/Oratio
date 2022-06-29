import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import { SvgIconProps } from '@material-ui/core/SvgIcon';

export type SliderWithIconProps = {
  persistName: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: string;
  displayValue?: 'on' | 'off' | 'auto';
  label: string;
  icon: React.ReactElement<SvgIconProps>;
};
export default function SliderWithIcon({
  // de-structure props object here so we can provide default values for optionals
  persistName,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  displayValue = 'auto',
  label,
  icon,
}: SliderWithIconProps) {
  const [textSpeed, setTextSpeed] = React.useState<number>(
    parseFloat(localStorage.getItem(persistName) || defaultValue)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleValueChange = (_event: any, newValue: number | number[]) => {
    setTextSpeed(newValue as number);
    localStorage.setItem(persistName, newValue.toString());
  };

  return (
    <div>
      <Typography id="continuous-slider" gutterBottom>
        {label}
      </Typography>
      <Grid container spacing={3}>
        <Grid item>{icon}</Grid>
        <Grid item xs>
          <Slider
            value={textSpeed}
            onChange={handleValueChange}
            aria-labelledby="continuous-slider"
            valueLabelDisplay={displayValue}
            step={step}
            min={min}
            max={max}
          />
        </Grid>
      </Grid>
    </div>
  );
}
