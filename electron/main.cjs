const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");

const devServerUrl = process.env.KUROMI_DEV_SERVER ? "http://127.0.0.1:5173" : "";
const debug = Boolean(process.env.KUROMI_DEBUG);

const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 480;

const trayIconPath = path.join(__dirname, "assets", "tray.png");

let mainWindow;
let tray;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: workArea.x + workArea.width - WINDOW_WIDTH - 24,
    y: workArea.y + workArea.height - WINDOW_HEIGHT - 12,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    // Not focusable so clicking/dragging the pet never steals foreground focus
    // from your active app.
    focusable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // A normal, never-on-top window: it stacks like any other window (so other
  // apps cover it), and starts click-through. The renderer turns interaction on
  // only when the cursor is over an opaque pixel of the model.
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log(`[console] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[render-process-gone]", JSON.stringify(details));
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.once("ready-to-show", () => {
    mainWindow.showInactive();

    if (debug) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function isAutoLaunchEnabled() {
  return app.getLoginItemSettings().openAtLogin;
}

function setAutoLaunch(enabled) {
  app.setLoginItemSettings({ openAtLogin: enabled });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(trayIconPath));

  tray.setToolTip("Kuromi 桌宠");

  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: "开机自启",
        type: "checkbox",
        checked: isAutoLaunchEnabled(),
        click: (item) => {
          setAutoLaunch(item.checked);
        }
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          app.quit();
        }
      }
    ]);

  tray.setContextMenu(buildMenu());
  tray.on("click", () => tray.setContextMenu(buildMenu()));
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      mainWindow.showInactive();
    }
  });

  app.whenReady().then(() => {
    app.dock?.hide();
    createWindow();
    createTray();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  // Keep running as a tray-only app; quit happens from the tray menu.
});

ipcMain.handle("cursor:get-position", () => screen.getCursorScreenPoint());

ipcMain.handle("window:get-position", () => mainWindow?.getPosition() ?? [0, 0]);

ipcMain.on("window:set-position", (_event, position) => {
  if (!mainWindow || !Number.isFinite(position?.x) || !Number.isFinite(position?.y)) {
    return;
  }

  mainWindow.setPosition(Math.round(position.x), Math.round(position.y));
});

ipcMain.on("mouse:set-ignore", (_event, ignore) => {
  mainWindow?.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
});

ipcMain.on("renderer:log", (_event, level, message) => {
  const tag = `[renderer:${level}]`;

  if (level === "error") {
    console.error(tag, message);
  } else {
    console.log(tag, message);
  }
});
