import React from 'react';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';
import { useTranslation } from 'react-i18next';
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

const options = [
  {
    value: 'en',
    text: 'English',
  },
  {
    value: 'ja',
    text: '日本語',
  },
  {
    value: 'de',
    text: 'Deutsch',
  },
];

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const classes = useStyles();

  const [lang, setLang] = React.useState(i18n.language);

  const handleLanguageChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const selectedLang = event.target.value as string;
    setLang(selectedLang);
    i18n.changeLanguage(selectedLang);
    localStorage.setItem('selectedLang', selectedLang);
  };

  return (
    <div>
      <FormControl className={classes.root}>
        <InputLabel id="demo-simple-select-label">{t('Language')}</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={lang}
          autoWidth
          onChange={handleLanguageChange}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
