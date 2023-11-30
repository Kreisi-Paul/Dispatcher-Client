const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getAuth: () => ipcRenderer.send("get_auth"),
    setAuth: (content) => ipcRenderer.send("set_auth", content),
    getVersion: () => ipcRenderer.send("get_version"),
    sendMsg: (content) => ipcRenderer.send("main_window", content),
    mainProc: (callback) => ipcRenderer.on("main_proc", callback)
})