
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

app.whenReady().then(() => {

    const mainWindow = new BrowserWindow({
        width: 350,
        height: 250,
        transparent: true,
        frame: false,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    mainWindow.loadFile("pagers/pager_s_touchscreen.html");
    
    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    app.on('activate', () => {
        console.log("activated");
    })
})


ipcMain.on("message", (event, content) => {
    //console.log(event);
    console.log(content);
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.