const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  activate: (licenseKey, watermarkText) => ipcRenderer.invoke('activate', licenseKey, watermarkText),
  updateWatermark: (watermarkText) => ipcRenderer.invoke('update-watermark', watermarkText),
  getWatermark: () => ipcRenderer.invoke('get-watermark'),
  onSetWatermark: (callback) => ipcRenderer.on('set-watermark', (event, text) => callback(text))
});
