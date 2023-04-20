const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain
const isDev = require('electron-is-dev');
const path = require('path');
const { autoUpdater } = require("electron-updater");
const { createFileRoute, createURLRoute } = require('electron-router-dom');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let viewWindow;
let viewWindow2;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1300, height: 890, fullscreen: false, maximizable: false, transparent: true, resizable: true, frame: false, webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            devTools: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    mainWindow.setBounds(store.get('bounds1'))

    const devServerURL = createURLRoute("http://localhost:3000", 'main')
    const fileRoute = createFileRoute(
        path.join(__dirname, '../build/index.html'),
        'main'
    )

    isDev ? mainWindow.loadURL(devServerURL) : mainWindow.loadFile(...fileRoute)

    mainWindow.on("closed", () => mainWindow = null, viewWindow = null, store.set('bounds1', mainWindow.getBounds()))
    mainWindow.on("move", saveBoundsSoon)
    mainWindow.on("resize", saveBoundsSoon)
    let saveBoundsCookie;
    function saveBoundsSoon() {
        if (saveBoundsCookie) clearTimeout(saveBoundsCookie);
        saveBoundsCookie = setTimeout(() => {
            saveBoundsCookie = undefined;
            store.set('bounds1', mainWindow.getBounds())
        }, 1000);
    }

    mainWindow.webContents.on("did-finish-load", () => {
        if (!isDev) {
            autoUpdater.checkForUpdates();
        } else {
            mainWindow.webContents.send('message', { state: "Skipped" });
        }

        autoUpdater.on('checking-for-update', () => {
            mainWindow.webContents.send('message', { state: 'CHECKING' })
        })

        autoUpdater.on('update-available', (info) => {
            mainWindow.webContents.send('message', { state: 'AVALIABLE', info })
        })

        autoUpdater.on('update-not-available', (info) => {
            mainWindow.webContents.send('message', { state: 'NOT' })
        })

        autoUpdater.on('error', (err) => {
            mainWindow.webContents.send('message', 'ERROR')
        })

        autoUpdater.on('download-progress', (progressObj) => {
            mainWindow.webContents.send('downloadProgress', progressObj);
        })

        autoUpdater.on('update-downloaded', (info) => {
            mainWindow.webContents.send('message', { state: 'WILL-INSTALL', info })
            autoUpdater.quitAndInstall(true, true);
        })
    })
    return mainWindow;
}

function createViewWindow() {
    viewWindow = new BrowserWindow({
        parent: mainWindow, show: false, width: 800, height: 890, fullscreen: false, maximizable: false, transparent: true, resizable: true, frame: false, webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            devTools: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    viewWindow.setBounds(store.get('bounds2'))
    viewWindow.on("move", saveBoundsSoon)
    viewWindow.on("resize", saveBoundsSoon)
    let saveBoundsCookie;
    function saveBoundsSoon() {
        if (saveBoundsCookie) clearTimeout(saveBoundsCookie);
        saveBoundsCookie = setTimeout(() => {
            saveBoundsCookie = undefined;
            store.set('bounds2', viewWindow.getBounds())
        }, 1000);
    }

    const devServerURL = createURLRoute("http://localhost:3000", 'view')
    const fileRoute = createFileRoute(
        path.join(__dirname, '../build/index.html'),
        'view'
    )

    isDev ? viewWindow.loadURL(devServerURL) : viewWindow.loadFile(...fileRoute)
    viewWindow.on("closed", () => viewWindow = null, store.set('bounds2', viewWindow.getBounds()))
    return viewWindow;
}

function createViewWindow2() {
    viewWindow2 = new BrowserWindow({
        parent: mainWindow, show: false, width: 800, height: 890, fullscreen: false, maximizable: false, transparent: true, resizable: true, frame: false, webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            devTools: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    viewWindow2.setBounds(store.get('bounds3'))
    viewWindow2.on("move", saveBoundsSoon)
    viewWindow2.on("resize", saveBoundsSoon)
    let saveBoundsCookie;
    function saveBoundsSoon() {
        if (saveBoundsCookie) clearTimeout(saveBoundsCookie);
        saveBoundsCookie = setTimeout(() => {
            saveBoundsCookie = undefined;
            store.set('bounds3', viewWindow2.getBounds())
        }, 1000);
    }

    const devServerURL = createURLRoute("http://localhost:3000", 'view2')
    const fileRoute = createFileRoute(
        path.join(__dirname, '../build/index.html'),
        'view2'
    )

    isDev ? viewWindow2.loadURL(devServerURL) : viewWindow2.loadFile(...fileRoute)
    viewWindow2.on("closed", () => viewWindow2 = null, store.set('bounds3', viewWindow2.getBounds()))
    return viewWindow2;
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on("ready", () => {
    window1 = createWindow();
    window2 = createViewWindow();
    window3 = createViewWindow2();

    ipcMain.on('selectTable', (event, arg) => {
        window2.hide();
        window3.hide();
    });

    ipcMain.on('view', (event, arg) => {
        window2.show();
        window2.webContents.send('fromMainWindow', arg);
    });
    ipcMain.on('view2', (event, arg) => {
        window3.show();
        window3.webContents.send('fromViewWindow', arg);
    });
})

