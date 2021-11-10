import React from 'react';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { useTranslation } from 'react-i18next';
import * as Theme from '../Theme';

export default function ChatSettings() {
  const [channelName, setChannelName] = React.useState(localStorage.getItem('channelName'));
  const [mirrorFromChat, setMirrorFromChat] = React.useState(
    localStorage.getItem('mirrorFromChat') === '1'
  );
  const [mirrorToChat, setMirrorToChat] = React.useState(
    localStorage.getItem('mirrorFromChat') === '1'
  );

  const handleChangeMirrorFromChat = (event: React.ChangeEvent<{ checked: boolean }>) => {
    const newValue = !mirrorFromChat;
    localStorage.setItem('mirrorFromChat', newValue ? '1' : '0');
    setMirrorFromChat(newValue);
  };

  const handleChangeMirrorToChat = (event: React.ChangeEvent<{ checked: boolean }>) => {
    const newValue = !mirrorToChat;
    localStorage.setItem('mirrorToChat', newValue ? '1' : '0');
    setMirrorToChat(newValue);
  };

  return (
    <FormGroup>
      <TextField
        id="channel-name"
        label="Twitch channel name"
        value={channelName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setChannelName(e.target.value);
          // TODO mb use a delayed timer for setting it, so we don't set it on every keystroke
          // but prob not worth it
          localStorage.setItem('channelName', e.target.value);
        }}
      />
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
  );
}
