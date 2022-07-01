import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Menu, MenuItem } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import TextField from '@material-ui/core/TextField';
import SaveIcon from '@material-ui/icons/Save';
import FolderIcon from '@material-ui/icons/Folder';
import DeleteIcon from '@material-ui/icons/Delete';
import { red, green } from '@material-ui/core/colors';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme) => ({
  saveName: {
    margin: theme.spacing(1),
  },
}));

export type VoiceConfig = {
  style: string;
  volume: number;
  pitch: number;
  rate: number;
};

export type VoiceConfigMap = { [name: string]: VoiceConfig };

export const defaultConfig: VoiceConfig = {
  style: 'none',
  volume: 100,
  pitch: 0,
  rate: 1,
};

const storageConfigsName = 'ttsConfigs';
const storageCurrentConfigName = 'ttsCurrent';

export default function VoiceConfigBar(props: {
  configLoadCallback: (name: string, value: VoiceConfig) => void;
  // provided by parent to get values of current config
  getCurrentSettings: () => VoiceConfig;
}) {
  const classes = useStyles();
  const { t } = useTranslation();

  const [voiceConfigs, setVoiceConfigs] = useState<VoiceConfigMap>({});
  const [loadAnchorEl, setLoadAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const [saveAnchorEl, setSaveAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [saveConfigName, setSaveConfigName] = useState(
    localStorage.getItem(storageCurrentConfigName) || ''
  );

  useEffect(() => {
    const configs = localStorage.getItem(storageConfigsName);
    // NOTE: the user can delete the default config, adding && !== '{}' would
    // add it back every time
    if (configs) {
      setVoiceConfigs(JSON.parse(configs));
    } else {
      // set up and persist defaultConfig
      setVoiceConfigs({ default: defaultConfig });
      setSaveConfigName('default');
      localStorage.setItem(storageConfigsName, JSON.stringify(voiceConfigs));
      localStorage.setItem(storageCurrentConfigName, 'default');
    }
  }, []);

  function handleConfigLoad(name: string) {
    const newConfig = voiceConfigs[name];
    if (newConfig) {
      props.configLoadCallback(name, newConfig);
      // set config name in save config menu, otherwise it might be confusing
      console.log('LOAD', name);
      setSaveConfigName(name);
    } else {
      console.error('Config not found!');
    }
    // hide load menu
    setLoadAnchorEl(null);
  }

  return (
    <>
      <Grid item xs={7}>
        <IconButton
          aria-controls="simple-menu"
          aria-haspopup="true"
          onClick={(event) => {
            setLoadAnchorEl(event.currentTarget);
          }}
          aria-label="load"
        >
          <FolderIcon />
        </IconButton>
        <Menu
          id="load-voice-config-menu"
          anchorEl={loadAnchorEl}
          keepMounted
          open={Boolean(loadAnchorEl)}
          onClose={() => {
            setLoadAnchorEl(null);
          }}
        >
          {Object.keys(voiceConfigs).map((name: string) => (
            <MenuItem
              key={name}
              onClick={() => {
                handleConfigLoad(name);
              }}
            >
              {name}
            </MenuItem>
          ))}
        </Menu>
        <IconButton
          aria-label="save"
          onClick={(event) => {
            setSaveAnchorEl(event.currentTarget);
          }}
        >
          <SaveIcon />
        </IconButton>
        <Popover
          id={saveAnchorEl ? 'save-popover' : undefined}
          open={Boolean(saveAnchorEl)}
          anchorEl={saveAnchorEl}
          onClose={() => {
            setSaveAnchorEl(null);
            // refresh config name from localStorage in case the user changed the name
            // but didn't save
            // turned out to be even more confusing
            // setSaveConfigName(
            //   localStorage.getItem(storageCurrentConfigName) || 'default'
            // );
          }}
          style={{ verticalAlign: 'center' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <TextField
            className={classes.saveName}
            id="save-config-name"
            fullWidth
            label={t('Config name')}
            value={saveConfigName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const trimmed = e.target.value.trim();
              setSaveConfigName(trimmed);
            }}
          />
          <IconButton
            aria-label="save"
            onClick={() => {
              console.log('SAVE AS', saveConfigName);
              const currentValues = props.getCurrentSettings();
              const newConfigs = {
                ...voiceConfigs,
                // use [] to treat saveConfigName as dymaic key
                [saveConfigName]: currentValues,
              };
              setVoiceConfigs(newConfigs);
              // persist changes
              // don't use voiceConfigs since it will not update untile next render
              localStorage.setItem(
                storageConfigsName,
                JSON.stringify(newConfigs)
              );
              localStorage.setItem(storageCurrentConfigName, saveConfigName);
            }}
          >
            <SaveIcon />
          </IconButton>
          {t('Save as')}
        </Popover>
        <IconButton
          aria-label="save"
          onClick={() => {
            const filtered = { ...voiceConfigs };
            delete filtered[saveConfigName];
            setVoiceConfigs(filtered);
            setSaveConfigName('');
            // persist changes
            localStorage.setItem(storageConfigsName, JSON.stringify(filtered));
            localStorage.setItem(storageCurrentConfigName, '');
          }}
        >
          <DeleteIcon aria-label="delete" style={{ color: red[500] }} />
        </IconButton>
      </Grid>
    </>
  );
}
