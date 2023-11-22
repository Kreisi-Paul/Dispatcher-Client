const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  sendMsg: (content) => ipcRenderer.send("message", content)
})