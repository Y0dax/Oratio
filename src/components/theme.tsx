import { createMuiTheme } from '@material-ui/core';

export default function getTheme() {
  return createMuiTheme({
    palette: {
      type: 'dark',
      background: {
        default: '#191927',
        paper: '#222230',
      },
      primary: {
        main: '#14A5AE',
      },
      secondary: {
        main: '#E33E7F',
      },
    },
  });
}
