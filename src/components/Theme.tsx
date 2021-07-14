import { createTheme } from '@material-ui/core';

export default function Theme() {
  return createTheme({
    palette: {
      type: 'dark',
      background: {
        default: '#202124',
        paper: '#43434f',
      },
      primary: {
        main: '#16c2d4',
      },
      secondary: {
        main: '#0F8C94',
      },
    },
  });
}
// https://colors.muz.li/palette/16c2d4/0f8c94/1943d4/16d423/0f9419
