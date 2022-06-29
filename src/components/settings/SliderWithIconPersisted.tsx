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
  onChange?: (
    event: React.ChangeEvent<unknown>,
    value: number | number[]
  ) => void;
  icon?: React.ReactElement<SvgIconProps> | undefined;
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
  onChange = () => {},
  icon = undefined,
}: SliderWithIconProps) {
  const [textSpeed, setTextSpeed] = React.useState<number>(
    parseFloat(localStorage.getItem(persistName) || defaultValue)
  );

  const handleValueChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => {
    setTextSpeed(newValue as number);
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
        {icon && <Grid item>{icon}</Grid>}
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
