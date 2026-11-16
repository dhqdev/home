// Ponte segura entre a página (dist/index.html) e o programa
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('casaApp', {
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  applyUpdate: () => ipcRenderer.invoke('update:apply'),
  onUpdateProgress: (cb) => ipcRenderer.on('update:progress', (_e, t) => cb(t)),
  quit: () => ipcRenderer.invoke('app:quit'),
  toggleFullscreen: () => ipcRenderer.invoke('app:fullscreen'),
});
