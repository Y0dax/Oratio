/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import child_process from 'child_process';
import {
  app,
  BrowserWindow,
  shell,
  globalShortcut,
  ipcMain,
  dialog,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import keytar from 'keytar';
import MenuBuilder from './menu';
import TwitchAuth from './TwitchAuth';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
// app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('disable-gpu-compositing');
// app.commandLine.appendSwitch('disable-gpu');
let mainWindow: BrowserWindow | null = null;
const isDevEnv = process.env.NODE_ENV === 'development';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevEnv || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 860,
    height: 850,
    icon: getAssetPath('icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      // offscreen: true,
    },
  });

  if (isDevEnv) {
    mainWindow.loadURL(
      `http://localhost:${
        process.env.PORT || '1212'
      }/dist/index_injected.html#/home`
    );
  } else {
    mainWindow.loadURL(`file://${__dirname}/index_injected.html#/home`);
  }

  /**
   * Add event listeners...
   */

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    // mainWindow = null;
    if (process.platform !== 'darwin') {
      app.quit();
    }
    globalShortcut.unregisterAll();
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
  globalShortcut.unregisterAll();
});

app
  .whenReady()
  .then(createWindow)
  .then(() => {
    globalShortcut.register('CommandOrControl+O', () => {
      if (mainWindow?.isFocused()) {
        // Minimizing the window in a Windows OS returns focus to the original app
        // while hiding the app in a unix like OS returns focus
        if (process.platform === 'win32') {
          mainWindow?.minimize();
        } else {
          mainWindow?.hide();
        }
      } else {
        mainWindow?.show();
      }
    });

    const ASSETS_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../assets');

    // start our server in a separate process to keep main/server performance indipendent
    // NOTE: using child_process over hidden renderer/webworker since we don't need
    // access to electron on the server and a forked process might be more lightweight?
    // while a webworker might not be able to handle/use? all the things we need
    //
    // will close automatically when this process exits
    const serverProc = child_process.fork(`${ASSETS_PATH}/dist/server.js`);
    if (serverProc !== null) {
      if (serverProc.stdout !== null) {
        serverProc.stdout.on('data', (data) => {
          console.log(`server stdout:\n${data}`);
        });
      }
      if (serverProc.stderr !== null) {
        serverProc.stderr.on('data', (data) => {
          console.log(`server stderr:\n${data}`);
        });
      }

      serverProc.send({ action: 'listen', port: 4563 });
    }

    return mainWindow;
  })
  .catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on('authLoopback', async (event, channelName) => {
  const { TWITCH_CLIENT_ID } = process.env;
  if (!TWITCH_CLIENT_ID) {
    dialog.showMessageBox({
      message: "Can't authorize! Missing twitch client id!",
    });
    return;
  }

  const validPorts = [8005, 8006, 8007, 8008, 8009, 8010];
  const twitch = new TwitchAuth(validPorts, TWITCH_CLIENT_ID);
  twitch.on('allPortsInUse', () => {
    dialog.showMessageBox({
      message: `All ports (${validPorts}) in use!`,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  twitch.on('receivedToken', (accessToken: string, _tokenType: string) => {
    keytar.setPassword('Oratio-Twitch', channelName, accessToken);
    event.reply('receivedToken');
    twitch.shutDown();
  });
  await twitch.setUpLoopback();
});

// TODO: how long does getPassword usually take? should we use this as async?
ipcMain.on('getTwitchToken', async (event, channelName: string) => {
  if (!channelName || channelName.length === 0) {
    event.returnValue = null;
  } else {
    event.returnValue = await keytar.getPassword('Oratio-Twitch', channelName);
  }
});

ipcMain.on('getAzureKey', async (event) => {
  event.returnValue = await keytar.getPassword('Oratio-Azure', 'main');
});

ipcMain.on('setAzureKey', async (_event, key: string) => {
  keytar.setPassword('Oratio-Azure', 'main', key);
});
