// import React from 'react';
// import TextField from '@material-ui/core/TextField';
// import Button from '@material-ui/core/Button';
// import Grid from '@material-ui/core/Grid';
// import {
//   MuiThemeProvider,
//   makeStyles,
//   createStyles,
//   createMuiTheme,
// } from '@material-ui/core/styles';
// import SendIcon from '@material-ui/icons/Send';
// import MicOffIcon from '@material-ui/icons/MicOff';
// import { BrowserWindow, remote } from 'electron';

// let win: BrowserWindow | undefined;
// const theme = createMuiTheme({
//   palette: {
//     primary: {
//       main: '#39c7cc',
//     },
//     secondary: {
//       main: '#E33E7F',
//     },
//   },
// });

// export default class InputDisplay extends React.Component {
//   // Or Create your Own theme:
//   // theme = createMuiTheme({
//   //   palette: {
//   //     primary: {
//   //       main: '#39c7cc',
//   //     },
//   //     secondary: {
//   //       main: '#E33E7F',
//   //     },
//   //   },
//   // });

//   useStyles = makeStyles(() => {
//     return createStyles({
//       root: {
//         flexGrow: 1,
//         height: '100vh',
//         background:
//           'linear-gradient(200.96deg, #fedc2a -29.09%, #dd5789 51.77%, #7a2c9e 129.35%)',
//         color: 'white',
//       },
//       content: {
//         padding: theme.spacing(4),
//       },
//       button: {
//         padding: theme.spacing(2),
//         textAlign: 'center',
//       },
//       icon: {
//         fontSize: '10rem',
//       },
//       header: {
//         textAlign: 'center',
//       },
//       hello: {
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         margin: '20px 0',
//       },
//       send: {
//         marginLeft: '5px',
//       },
//     });
//   });

//   classes = this.useStyles();

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   constructor(props: any) {
//     super(props);
//     this.state = {};
//   }

//   handleOpenObs = async () => {
//     // electron.ipcRenderer.on();
//     // BrowserWindow is just the type import, remote.BrowserWindow is the value
//     // const win: BrowserWindow = new remote.BrowserWindow({ .. })
//     if (win === undefined) {
//       win = new remote.BrowserWindow({
//         backgroundColor: 'blue',
//         height: 600,
//         width: 800,
//         frame: false,
//         title: 'Oratio OBS Display',
//         // focusable: false,
//         // transparent: true,
//         webPreferences: {
//           nodeIntegration: true,
//           devTools: false,
//         },
//       });
//       win.loadURL(`file://${__dirname}/index.html#/obs`);
//       win.webContents.on('did-finish-load', () => {
//         if (win !== undefined) {
//           win.webContents.send('speech', 'Hello second window!');
//         }
//       });
//       win.on('closed', () => {
//         win = undefined;
//       });
//     }
//   };

//   handleCloseObs = async () => {
//     if (win !== undefined) {
//       win.close();
//       win = undefined;
//     }
//   };

//   handleSpeechSendClicked = async () => {
//     if (win !== undefined) {
//       win.webContents.send('speech', 'Hello second window!');
//     }
//   };

//   render() {
//     document.body.style.background =
//       'linear-gradient(200.96deg,#fedc2a -29.09%, #dd5789 51.77%,#7a2c9e 129.35%);';
//     return (
//       <MuiThemeProvider theme={theme}>
//         <div className={this.classes.root}>
//           <div className={this.classes.content}>
//             <form noValidate autoComplete="off">
//               <Grid container direction="row" spacing={3}>
//                 <Grid item xs={12}>
//                   <TextField
//                     id="speech-input"
//                     label="Speech"
//                     variant="outlined"
//                     fullWidth
//                     multiline
//                   />
//                 </Grid>
//                 <Grid container item xs={12} justify="flex-end">
//                   <Button
//                     id="send-text"
//                     variant="contained"
//                     color="primary"
//                     className={this.classes.button}
//                     onClick={this.handleSpeechSendClicked}
//                   >
//                     Send <SendIcon className={this.classes.send} />
//                   </Button>
//                 </Grid>
//               </Grid>
//             </form>
//             <div>
//               <div className={this.classes.hello}>
//                 <MicOffIcon className={this.classes.icon} />
//               </div>
//               <h1 className={this.classes.header}>Project Oratio</h1>
//               <Grid container spacing={3} alignContent="flex-end">
//                 <Grid container item justify="flex-end" xs={12}>
//                   <Button
//                     id="open-obs"
//                     variant="contained"
//                     color="primary"
//                     className={this.classes.button}
//                     onClick={this.handleOpenObs}
//                   >
//                     Open OBS display
//                   </Button>
//                 </Grid>
//               </Grid>
//             </div>
//           </div>
//         </div>
//       </MuiThemeProvider>
//     );
//   }
// }
