import React from 'react';

import {
  makeStyles,
  createStyles,
  createMuiTheme,
} from '@material-ui/core/styles';

// Or Create your Own theme:
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#39c7cc',
    },
    secondary: {
      main: '#E33E7F',
    },
  },
});

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      flexGrow: 1,
      padding: theme.spacing(4),
    },
    text: {
      color: 'white',
      fontSize: '4rem',
      textAlign: 'center',
    },
  })
);

export default function OBS() {
  const classes = useStyles();
  return (
    <div>
      <span id="text" className={classes.text}>
        THIS IS A TEST FOR TRANSPARENCY
      </span>
    </div>
  );
}
