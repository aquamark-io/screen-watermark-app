const { app, BrowserWindow, Tray, Menu, screen, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { machineIdSync } = require('node-machine-id');

const store = new Store();
const API_URL = 'https://screen-api-eac9.onrender.com/api/screen-watermark';

let tray = null;
let overlayWindows = [];
let activationWindow = null;

// Check if app is activated
function isActivated() {
  return store.has('license_key') && store.has('watermark_text');
}

// Create activation window
function createActivationWindow() {
  activationWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  activationWindow.loadFile('activation.html');
  activationWindow.on('closed', () => {
    activationWindow = null;
  });
}

// Create overlay windows for all displays
function createOverlays() {
  const displays = screen.getAllDisplays();
  
  displays.forEach(display => {
    const overlayWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    overlayWindow.setIgnoreMouseEvents(true);
    overlayWindow.loadFile('overlay.html');
    overlayWindow.webContents.on('did-finish-load', () => {
      overlayWindow.webContents.send('set-watermark', store.get('watermark_text'));
    });

    overlayWindows.push(overlayWindow);
  });
}

// Destroy all overlay windows
function destroyOverlays() {
  overlayWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });
  overlayWindows = [];
}

// Create system tray
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Edit Watermark Text',
      click: () => {
        createEditWindow();
      }
    },
    {
      label: 'Check License',
      click: () => {
        validateLicense(false);
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Aquamark Screen Watermark');
  tray.setContextMenu(contextMenu);
}

// Create edit watermark window
function createEditWindow() {
  const editWindow = new BrowserWindow({
    width: 400,
    height: 250,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  editWindow.loadFile('edit.html');
}

// Validate license with API
async function validateLicense(isFirstActivation = false) {
  const deviceId = machineIdSync();
  const licenseKey = store.get('license_key');
  const watermarkText = store.get('watermark_text');

  const payload = {
    license_key: licenseKey,
    device_id: deviceId
  };

  // Include watermark_text only on first activation
  if (isFirstActivation && watermarkText) {
    payload.watermark_text = watermarkText;
  }

  try {
    const response = await fetch(`${API_URL}/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.valid) {
      console.log('License valid:', data.message);
      return true;
    } else {
      console.log('License invalid:', data.message);
      // Show error and disable
      destroyOverlays();
      return false;
    }
  } catch (error) {
    console.error('Error validating license:', error);
    // On network error, allow grace period (app keeps running)
    return true;
  }
}

// Handle activation from renderer
ipcMain.handle('activate', async (event, licenseKey, watermarkText) => {
  const deviceId = machineIdSync();

  try {
    const response = await fetch(`${API_URL}/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_key: licenseKey,
        device_id: deviceId,
        watermark_text: watermarkText
      })
    });

    const data = await response.json();

    if (data.valid) {
      // Save credentials
      store.set('license_key', licenseKey);
      store.set('watermark_text', watermarkText);

      // Close activation window
      if (activationWindow) {
        activationWindow.close();
      }

      // Start overlays
      createOverlays();
      createTray();

      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Network error. Please try again.' };
  }
});

// Handle edit watermark
ipcMain.handle('update-watermark', async (event, newWatermarkText) => {
  store.set('watermark_text', newWatermarkText);
  
  // Refresh overlays
  destroyOverlays();
  createOverlays();

  return { success: true };
});

// Get current watermark text
ipcMain.handle('get-watermark', async () => {
  return store.get('watermark_text', '');
});

// App ready
app.whenReady().then(() => {
  if (isActivated()) {
    // Already activated - start overlays
    validateLicense(false).then(valid => {
      if (valid) {
        createOverlays();
        createTray();
      } else {
        createActivationWindow();
      }
    });

    // Check license monthly (1st of month)
    const checkInterval = 24 * 60 * 60 * 1000; // Daily for testing, change to monthly
    setInterval(() => {
      validateLicense(false);
    }, checkInterval);
  } else {
    // Not activated - show activation window
    createActivationWindow();
  }
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  destroyOverlays();
});
