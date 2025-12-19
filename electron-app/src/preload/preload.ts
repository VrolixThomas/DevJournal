import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add IPC methods here as needed
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  openAuthWindow: (url: string) => ipcRenderer.invoke('open-auth-window', url),
  onAuthTokens: (callback: (tokens: { access_token: string; refresh_token: string }) => void) => {
    ipcRenderer.on('auth-tokens', (_event, tokens) => callback(tokens));
  },
});
