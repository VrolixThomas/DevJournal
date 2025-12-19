import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import { startAuthServer, stopAuthServer } from './authServer';

let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow auth callback URLs to open in the app
    if (url.startsWith('http://localhost:54321/auth/callback')) {
      return { action: 'allow' };
    }
    // Open other URLs in external browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopAuthServer();
  });
}

// Handle auth window
ipcMain.handle('open-auth-window', async (_event, url: string) => {
  return new Promise((resolve) => {
    authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWindow.loadURL(url);

    // Listen for navigation to detect the callback with tokens
    authWindow.webContents.on('will-redirect', (_event, url) => {
      handleAuthCallback(url, resolve);
    });

    authWindow.webContents.on('did-navigate', (_event, url) => {
      handleAuthCallback(url, resolve);
    });

    authWindow.on('closed', () => {
      authWindow = null;
      resolve({ error: 'Window closed by user' });
    });
  });
});

function handleAuthCallback(url: string, resolve: (value: any) => void) {
  // Check if URL contains auth tokens
  if (url.includes('access_token=') || url.includes('#access_token=')) {
    const urlObj = new URL(url);
    const hash = urlObj.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      if (authWindow) {
        authWindow.close();
        authWindow = null;
      }
      resolve({ accessToken, refreshToken });
    }
  }
}

// Handle deep link protocol (devjournal://) - Production mode
app.on('open-url', (event, url) => {
  event.preventDefault();

  // Extract tokens from deep link URL
  // Format: devjournal://auth/callback#access_token=...&refresh_token=...
  if (url.startsWith('devjournal://')) {
    const urlObj = new URL(url);
    const hash = urlObj.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken && mainWindow) {
      // Send tokens to renderer process
      mainWindow.webContents.send('auth-tokens', { access_token: accessToken, refresh_token: refreshToken });

      // Focus the app window
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  }
});

app.whenReady().then(async () => {
  // Set as default protocol handler for devjournal://
  if (!isDevelopment && process.platform === 'darwin') {
    app.setAsDefaultProtocolClient('devjournal');
  }

  createWindow();

  // Start auth server (used in development mode)
  if (mainWindow) {
    await startAuthServer(mainWindow);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAuthServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
