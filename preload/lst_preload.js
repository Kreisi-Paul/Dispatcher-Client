const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => ipcRenderer.send("get_version"),
    getAuth: (content) => ipcRenderer.send("get_auth", content),
    sendMsg: (content) => ipcRenderer.send("lst_window", content),
    mainProc: (callback) => ipcRenderer.on("main_proc", callback)
})
