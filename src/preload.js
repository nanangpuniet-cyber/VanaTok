const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vanatok', {
  getVersion: () => ipcRenderer.invoke('app:get-version')
});
