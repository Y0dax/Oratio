import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';
import { SvgIconProps } from '@material-ui/core/SvgIcon';

export type SliderWithIconProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  displayValue?: 'on' | 'off' | 'auto';
  label: string;
  onChange?: (
    event: React.ChangeEvent<unknown>,
    value: number | number[]
  ) => void;
  icon?: React.ReactElement<SvgIconProps> | undefined;
};
export default function SliderWithIcon({
  // de-structure props object here so we can provide default values for optionals
  value,
  min = 0,
  max = 100,
  step = 1,
  displayValue = 'auto',
  label,
  onChange = undefined,
  icon = undefined,
}: SliderWithIconProps) {
  return (
    <div>
      <Typography id="continuous-slider" gutterBottom>
        {label}
      </Typography>
      <Grid container spacing={3}>
        {icon && <Grid item>{icon}</Grid>}
        <Grid item xs>
          <Slider
            value={value}
            onChange={onChange}
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
