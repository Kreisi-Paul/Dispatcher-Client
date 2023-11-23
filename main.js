
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
let pagerWindow;
let lstWindow;
let lstFaction;

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
            openPager("rdil")
            return;

        case "lst_rdil":
            openLST("rdil")
            return;

        case "pager_pol":
            openPager("pol")
            return;

        case "lst_pol":
            openLST("pol")
            return;

    }
})

ipcMain.on("lst_window", (event, content) => {
    console.log(content);

    switch (content) {
        case "getfaction":
            lstWindow.webContents.send('main_proc', {"faction":lstFaction});
            return;
    }
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

function openLST(faction) {
    lstFaction = faction;
    lstWindow = new BrowserWindow({
        autoHideMenuBar: false,
        webPreferences: {
            preload: path.resolve("lst/lst_preload.js")
        }
    });
    lstWindow.loadFile(`lst/leitstelle.html`);
    lstWindow.maximize();
    lstWindow.webContents.openDevTools()
}

