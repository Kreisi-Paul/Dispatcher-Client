
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
let pagerWindow;

app.whenReady().then(() => {

    const mainWindow = new BrowserWindow({
        width: 700,
        minWidth: 680,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.resolve("menu/main_preload.js")
        }
    });
    mainWindow.loadFile("menu/main_menu.html");
    
    mainWindow.webContents.openDevTools()

    app.on('activate', () => {
        console.log("activated");
    })
})

ipcMain.on("main_window", (event, content) => {
    //console.log(event);
    console.log(content);

    switch (content) {
        case "pager_rdil":
            openPager("bar")
            return;

    }
})







ipcMain.on("message", (event, content) => {
    //console.log(event);
    console.log(content);
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})



function openPager(pagerName) {
    //TODO: implement modular system
    console.log("foo")
    pagerWindow = new BrowserWindow({
        width: 350,
        height: 250,
        minWidth: 295,
        minHeight: 180,
        transparent: true,
        frame: false,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    pagerWindow.setAlwaysOnTop(true, "screen-saver");
    pagerWindow.loadFile("pagers/pager_s_touchscreen.html");
    pagerWindow.webContents.openDevTools()
}



