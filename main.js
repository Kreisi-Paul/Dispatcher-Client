
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('node:path');
let pagerWindow;
let lstWindow;
let lstFaction;
let pagerFaction;
let pagerUnit;


let localDB = JSON.parse(fs.readFileSync(path.resolve("db/storage.json")));


let clientVersion = fs.readFileSync(path.join(__dirname, "version.txt")).toString();



app.whenReady().then(() => {

    const mainWindow = new BrowserWindow({
        width: 700,
        minWidth: 680,
        height: 800,
        minHeight: 600,
        autoHideMenuBar: true,
        icon: "src/ll_logo.ico",
        webPreferences: {
            preload: path.join(__dirname, "preload/main_preload.js")
        }
    });
    mainWindow.loadFile("menu/main_menu.html");
    //mainWindow.setAlwaysOnTop(true) //DEBUG

    mainWindow.on("closed", ()=>{
        app.quit(); //close app when main window is closed
    })

    mainWindow.webContents.openDevTools()

    app.on('activate', ()=>{
        console.log("activated");
    })
})

ipcMain.on("main_window", (event, content) => {
    //console.log(event);
    //console.log(content);

    if(typeof content == "string") {
        switch (content) {
            case "pager_rdil":
                openPager("rdil");
                return;
    
            case "lst_rdil":
                openLST("rdil");
                return;
    
            case "pager_pol":
                openPager("pol");
                return;
    
            case "lst_pol":
                openLST("pol");
                return;
        }
    }
    else {
        if(Object.keys(content).includes("unit")) {
            pagerUnit = content.unit;
            console.log(pagerUnit)
        }
    }
})

ipcMain.on("lst_window", (event, content) => {
    console.log(content);

    switch (content[0]) {
        case "getfaction":
            lstWindow.webContents.send('main_proc', {"faction":lstFaction});
            return;
        case "createjob":
            openJobCreation(lstFaction, content[1]);
            return;
    }
})

ipcMain.on("pager_window", (event, content) => {
    //console.log(content);

    switch (content) {
        case "getfaction":
            pagerWindow.webContents.send("main_proc", {"faction":pagerFaction});
            return;
        case "getunit":
            pagerWindow.webContents.send("main_proc", {"unit":pagerUnit});
            return;
    }
})

ipcMain.on(("get_auth"), (event) => {
    event.sender.send('main_proc', {"auth":localDB.auth});
})
ipcMain.on(("set_auth"), (event,data) => {
    console.log("setauth:",data)
    localDB.auth = data;//overwrite auth
    fs.writeFileSync(path.resolve("db/storage.json"),JSON.stringify(localDB, null, "\t"));//save db
})
ipcMain.on(("get_version"), (event) => {
    event.sender.send("main_proc", {"version":clientVersion});
})
ipcMain.on(("pager_settings"), (event,data) => {
    console.log("pagersettings:",data)
    console.log(data[0])

    if(data[0] == "get") {
        let pagerSettings = JSON.parse(fs.readFileSync(path.resolve("db/storage.json"))).pagerSettings[data[1]];
        event.sender.send("main_proc",{"pagersettings":pagerSettings});
    }
    else if(data[0] == "set") {
        console.log(data[1])
    }
    else if(data[0] == "opacity") {
        pagerWindow.setOpacity(data[1]);
    }


    /*
    localDB.pagerSettings = data;//overwrite auth
    fs.writeFileSync(path.resolve("db/storage.json"),JSON.stringify(localDB, null, "\t"));//save db
    */
})



app.on('window-all-closed', () => {
    app.quit()
})



function openPager(faction,pagerModel) {
    //TODO: implement modular system
    
    if(typeof pagerWindow != "undefined")//prevent multiple windows
        if(!pagerWindow.isDestroyed())
            return;

    pagerFaction = faction;
    pagerWindow = new BrowserWindow({
        width: 295,
        height: 180,
        minWidth: 295,
        minHeight: 180,
        transparent: true,
        frame: false,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        icon: "src/ll_logo.ico",
        webPreferences: {
            preload: path.join(__dirname, "preload/pager_preload.js")
        }
    });
    pagerWindow.setAlwaysOnTop(true, "screen-saver");
    pagerWindow.loadFile("pagers/pager_s_touchscreen.html");
    pagerWindow.webContents.openDevTools()
}

function openLST(faction) {

    if(typeof lstWindow != "undefined")//prevent multiple windows
        if(!lstWindow.isDestroyed())
            return;

    lstFaction = faction;
    lstWindow = new BrowserWindow({
        minWidth: 950,
        minHeight: 510,
        autoHideMenuBar: true,
        icon: "src/ll_logo.ico",
        webPreferences: {
            preload: path.join(__dirname, "preload/lst_preload.js")
        }
    });
    lstWindow.loadFile(`lst/leitstelle.html`);
    lstWindow.maximize();
    lstWindow.webContents.openDevTools()
}

function openJobCreation(faction, jobData) {
    let jobWindow = new BrowserWindow({
        width: 800,
        height: 450,
        minWidth: 800,
        minHeight: 450,
        autoHideMenuBar: true,
        icon: "src/ll_logo.ico",
        webPreferences: {
            preload: path.join(__dirname, "preload/job_preload.js")
        }
    });
    jobWindow.loadFile(`lst/createjob.html`);
    jobWindow.webContents.openDevTools()

    jobWindow.webContents.send('main_proc', {faction:faction,jobdata:jobData});
}
