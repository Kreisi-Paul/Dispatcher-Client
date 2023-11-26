const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    sendMsg: (content) => ipcRenderer.send("lst_window", content),
    mainProc: (callback) => ipcRenderer.on("main_proc", callback)
})
