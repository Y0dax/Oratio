import React from 'react';
import { ipcRenderer } from 'electron';

import { Button, Grid } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
// import { useTranslation } from 'react-i18next';

export default function ChatSettings() {
  const [channelName, setChannelName] = React.useState(
    localStorage.getItem('channelName') || ''
  );
  const [oAuthToken, setOAuthToken] = React.useState(
    localStorage.getItem('oAuthToken') || ''
  );
  const [mirrorFromChat, setMirrorFromChat] = React.useState(
    localStorage.getItem('mirrorFromChat') === '1'
  );
  const [mirrorToChat, setMirrorToChat] = React.useState(
    localStorage.getItem('mirrorToChat') === '1'
  );

  const handleChangeMirrorFromChat = () => {
    const newValue = !mirrorFromChat;
    localStorage.setItem('mirrorFromChat', newValue ? '1' : '0');
    setMirrorFromChat(newValue);
  };

  const handleChangeMirrorToChat = () => {
    const newValue = !mirrorToChat;
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
            setChannelName(e.target.value);
            // TODO mb use a delayed timer for setting it, so we don't set it on every keystroke
            // but prob not worth it
            localStorage.setItem('channelName', e.target.value);
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Grid container direction="row" spacing={3}>
          <Grid item xs={6}>
            <TextField
              id="oauth-token"
              label="OAuth Token"
              helperText="Necessary for sending chat messages. Don't share with anyone!"
              value={oAuthToken}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const trimmed = e.target.value.trim();
                setOAuthToken(trimmed);
                localStorage.setItem('oAuthToken', trimmed);
              }}
            />
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
                ipcRenderer.sendSync('open-oauth-gen-url');
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
              />
            }
            label="Mirror messages from twitch chat"
          />
          <FormControlLabel
            control={
              <Checkbox
                id="mirror-to-chat"
                onChange={handleChangeMirrorToChat}
                checked={mirrorToChat}
              />
            }
            label="Mirror messages to twitch chat"
          />
        </FormGroup>
      </Grid>
    </Grid>
  );
}
