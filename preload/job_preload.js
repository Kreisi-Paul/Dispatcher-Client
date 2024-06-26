const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getAuth: (content) => ipcRenderer.send("get_auth", content),
    sendMsg: (content) => ipcRenderer.send("job_window", content),
    mainProc: (callback) => ipcRenderer.on("main_proc", callback)
})
