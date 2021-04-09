import React from 'react';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';
import * as Theme from '../Theme';

// TODO not good to mix ES6 and ES5 syntax but standard import failed
// should find a way to consolidate this
const fs = require('fs');

const theme = Theme.default();
const useStyles = makeStyles(() =>
  createStyles({
    root: {
      margin: theme.spacing(1),
      minWidth: '100%',
    },
  })
);

const options: string[] = [];
fs.readdir('assets/sounds', (err: Error, files: string[]) => {
  if (err) {
    throw err;
  }
  files.forEach((file: string) => {
    options.push(file);
  });
});

export default function AudioSelector() {
  const [sound, setSound] = React.useState('');

  const handleSoundChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSound(event.target.value as string);
    localStorage.setItem('soundFileName', event.target.value as string);
  };

  const classes = useStyles();
  return (
    <div>
      <FormControl className={classes.root}>
        <InputLabel id="demo-simple-select-label">Speech Sound</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={sound}
          autoWidth
          onChange={handleSoundChange}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
