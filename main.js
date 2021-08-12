const {app,BrowserWindow,ipcMain} = require('electron');
const {autoUpdater} = require('electron-differential-updater');
const http = require('https');
const fs = require('fs');
const EventEmitter = require('events');

let mainWindow, splash;
const loadingEvents = new EventEmitter();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    icon: __dirname + '/build/app.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  splash = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false
  })

  mainWindow.loadFile('index.html');
  splash.loadFile('splash.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  loadingEvents.on('finished', () => {
    splash.destroy();
    mainWindow.show();
    autoUpdater.checkForUpdatesAndNotify();
  });
  
}

app.on('ready', () => {
  createWindow();
  setTimeout(() => loadingEvents.emit('finished'), 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', {
    version: app.getVersion()
  });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  mainWindow.webContents.send('download-progress');
})

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});