import React from 'react';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import * as fs from 'fs';
import * as Theme from '../Theme';

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
const assetLoc =
  process.env.NODE_ENV === 'development'
    ? 'assets/sounds'
    : 'resources/assets/sounds';
fs.readdir(assetLoc, (err: Error | null, files: string[]) => {
  if (err) {
    throw err;
  }
  files.forEach((file: string) => {
    options.push(file);
  });
});

export default function AudioSelector() {
  const { t } = useTranslation();
  const [sound, setSound] = React.useState('');

  const handleSoundChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSound(event.target.value as string);
    localStorage.setItem('soundFileName', event.target.value as string);
  };

  const classes = useStyles();
  return (
    <div>
      <FormControl className={classes.root}>
        <InputLabel id="demo-simple-select-label">
          {t('Speech Sound')}
        </InputLabel>
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
