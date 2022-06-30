import React from 'react';
import { useTranslation } from 'react-i18next';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import RefreshIcon from '@material-ui/icons/Refresh';
import ChatInteraction from '../TwitchChat';

export default function ChatStatus({
  chatInstance,
  channelName,
  oAuthToken,
}: {
  chatInstance: ChatInteraction;
  channelName: string | null;
  oAuthToken: string | null;
}) {
  const { t } = useTranslation();
  // using the set* functions will trigger a re-render of this component
  // meaning this function will be re-executed
  // so that's why it's better to have this as a separate component
  const [serverStatus, setServerStatus] = React.useState(
    chatInstance.connectionStatus()
  );
  const [channelStatus, setChannelStatus] = React.useState(
    chatInstance.channelStatus()
  );
  chatInstance.connectionStatusCallback = (value: string) => {
    // so we can use react version of i18next otherwise, translations
    // won't change after changing them in settings (until restart)
    setServerStatus(t(value));
  };
  chatInstance.channelStatusCallback = (value: string) => {
    if (value.length > 0 && value[0] === '#') {
      setChannelStatus(value);
    } else {
      setChannelStatus(t(value));
    }
  };

  return (
    <Grid container direction="row" spacing={0} style={{ marginTop: '1em' }}>
      <Grid item xs={12}>
        <Typography variant="h5" component="h1">
          Chat Status
        </Typography>
      </Grid>
      <Grid container item xs={12} alignItems="center">
        Server: {serverStatus}
        <IconButton
          id="reconnect-chat"
          color="primary"
          aria-label="reconnect to server"
          onClick={() => {
            chatInstance.disconnect();
            chatInstance.connect();
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Grid>
      <Grid container item xs={12} alignItems="center">
        Channel: {channelStatus}
        <IconButton
          id="rejoin-channel"
          color="primary"
          aria-label="rejoin channel"
          onClick={() => {
            chatInstance.updateIdentity(channelName, oAuthToken);
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}
