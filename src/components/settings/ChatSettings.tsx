/* eslint-disable prettier/prettier */
import React from 'react';
import { BrowserWindow, remote } from 'electron';
import { Button, Grid } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { red, green } from '@material-ui/core/colors';
import TwitchAuth from './TwitchAuth';
// import { useTranslation } from 'react-i18next';

async function handleOpenTwitchAuth(notifyChange: (value: boolean) => void) {
  const twitch = new TwitchAuth(8005);
  await twitch.setUpLoopback();
  twitch.on('receivedToken', (accessToken: string, tokenType: string) => {
    localStorage.setItem('oAuthToken', accessToken);
    localStorage.setItem('tokenType', tokenType);
    notifyChange(true);
    twitch.shutDown();
  });
  console.log('open auth');
  twitch.openAuthPage();
}

export default function ChatSettings() {
  const [channelName, setChannelName] = React.useState(
    localStorage.getItem('channelName') || ''
  );
  // twitch username min chars is 4
  const missingChannel = channelName === null || channelName.trim().length < 4;

  // OAuth token is 30chars
  const oAuthToken = localStorage.getItem('oAuthToken');
  const [missingAuth, setMissingAuth] = React.useState(
    // js should stop evaluation if oAuthToken is null so it's fine
    // to assume it's not after ||
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    oAuthToken === null || oAuthToken!.trim().length !== 30
  );

  const [mirrorFromChat, setMirrorFromChat] = React.useState(
    localStorage.getItem('mirrorFromChat') === '1'
  );
  const [mirrorToChat, setMirrorToChat] = React.useState(
    localStorage.getItem('mirrorToChat') === '1'
  );

  const handleChangeMirrorFromChat = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.currentTarget.checked;
    localStorage.setItem('mirrorFromChat', newValue ? '1' : '0');
    setMirrorFromChat(newValue);
  };

  const handleChangeMirrorToChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.checked;
    localStorage.setItem('mirrorToChat', newValue ? '1' : '0');
    setMirrorToChat(newValue);
  };

  return (
    <Grid container direction="row" spacing={3}>
      <Grid item xs={6}>
        <TextField
          id="channel-name"
          fullWidth
          label="Twitch channel name"
          value={channelName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const trimmed = e.target.value.trim();
            // twitch channel names are at least 4 chars
            if (trimmed.length < 4) {
              setMirrorToChat(false);
              localStorage.setItem('mirrorToChat', '0');
              setMirrorFromChat(false);
              localStorage.setItem('mirrorFromChat', '0');
            }

            setChannelName(e.target.value);
            // TODO mb use a delayed timer for setting it, so we don't set it on every keystroke
            // but prob not worth it
            localStorage.setItem('channelName', e.target.value);
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Grid container direction="row" spacing={3}>
          <Grid
            container
            item
            xs={6}
            justifyContent="flex-start"
            alignItems="center"
          >
            Authorized:
            <IconButton
              id="auth-status"
              style={ missingAuth ? { color: red[500] } : { color: green[500] } }
            >
              {missingAuth ? (
                <CheckBoxOutlineBlankIcon />
              ) : (
                <CheckBoxIcon />
              )}
            </IconButton>
          </Grid>
          <Grid
            container
            item
            xs={6}
            justifyContent="flex-start"
            alignItems="center"
          >
            <Button
              id="open-browser-auth"
              variant="contained"
              // className={classes.button}
              color="primary"
              // send event to main process to open the OAuth token generator in
              // the default browser
              onClick={() => {
                handleOpenTwitchAuth(setMissingAuth);
              }}
            >
              Get OAuth token
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={6}>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                id="mirror-from-chat"
                onChange={handleChangeMirrorFromChat}
                checked={mirrorFromChat}
                disabled={missingChannel}
              />
            }
            label="Mirror messages from twitch chat"
          />
          {missingChannel && (
            <FormHelperText>Missing channel name</FormHelperText>
          )}
          <FormControlLabel
            control={
              <Checkbox
                id="mirror-to-chat"
                onChange={handleChangeMirrorToChat}
                checked={mirrorToChat}
                disabled={missingAuth || missingChannel}
              />
            }
            label="Mirror messages to twitch chat"
          />
          {missingChannel && (
            <FormHelperText>Missing channel name</FormHelperText>
          )}
          {missingAuth && (
            <FormHelperText>Missing or invalid OAuth token</FormHelperText>
          )}
        </FormGroup>
      </Grid>
    </Grid>
  );
}
