const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const { resolveLocale, normalizeLocale, t } = require("./i18n.cjs");
const { readLocale, writeLocale, readModel, writeModel, readAlwaysOnTop, writeAlwaysOnTop } = require("./settings.cjs");

const devServerUrl = process.env.KUROMI_DEV_SERVER ? "http://127.0.0.1:5173" : "";
const debug = Boolean(process.env.KUROMI_DEBUG);

const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 480;

const trayIconPath = path.join(__dirname, "assets", "tray.png");
const macTrayEmoji = "🖤";

let mainWindow;
let tray;
let currentLocale = "zh";
let currentModel = "2d";
let alwaysOnTopEnabled = false;

function broadcastLocale() {
  mainWindow?.webContents.send("locale:changed", currentLocale);
}

function normalizeModel(model) {
  return model === "3d" ? "3d" : "2d";
}

function broadcastModel() {
  mainWindow?.webContents.send("model:changed", currentModel);
}

function setLocale(locale) {
  const next = normalizeLocale(locale);

  if (next === currentLocale) {
    return;
  }

  currentLocale = next;
  writeLocale(app, currentLocale);
  tray?.setToolTip(t(currentLocale, "tray.tooltip"));
  tray?.setContextMenu(buildTrayMenu());
  broadcastLocale();
}

function setModel(model) {
  const next = normalizeModel(model);

  if (next === currentModel) {
    return;
  }

  currentModel = next;
  writeModel(app, currentModel);
  tray?.setContextMenu(buildTrayMenu());
  broadcastModel();
}

function setAlwaysOnTop(enabled) {
  alwaysOnTopEnabled = Boolean(enabled);
  writeAlwaysOnTop(app, alwaysOnTopEnabled);
  mainWindow?.setAlwaysOnTop(alwaysOnTopEnabled);
  tray?.setContextMenu(buildTrayMenu());
}

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
  mainWindow.setAlwaysOnTop(alwaysOnTopEnabled);
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

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: t(currentLocale, "tray.autoLaunch"),
      type: "checkbox",
      checked: isAutoLaunchEnabled(),
      click: (item) => {
        setAutoLaunch(item.checked);
      }
    },
    {
      label: t(currentLocale, "tray.alwaysOnTop"),
      type: "checkbox",
      checked: alwaysOnTopEnabled,
      click: (item) => {
        setAlwaysOnTop(item.checked);
      }
    },
    {
      label: t(currentLocale, "tray.model"),
      submenu: [
        {
          label: t(currentLocale, "tray.model3d"),
          type: "radio",
          checked: currentModel === "3d",
          click: () => setModel("3d")
        },
        {
          label: t(currentLocale, "tray.model2d"),
          type: "radio",
          checked: currentModel === "2d",
          click: () => setModel("2d")
        }
      ]
    },
    {
      label: t(currentLocale, "tray.language"),
      submenu: [
        {
          label: t(currentLocale, "tray.langZh"),
          type: "radio",
          checked: currentLocale === "zh",
          click: () => setLocale("zh")
        },
        {
          label: t(currentLocale, "tray.langEn"),
          type: "radio",
          checked: currentLocale === "en",
          click: () => setLocale("en")
        }
      ]
    },
    { type: "separator" },
    {
      label: t(currentLocale, "tray.quit"),
      click: () => {
        app.quit();
      }
    }
  ]);
}

function createTrayIcon() {
  if (process.platform !== "darwin") {
    return nativeImage.createFromPath(trayIconPath);
  }

  return nativeImage.createEmpty();
}

function createTray() {
  tray = new Tray(createTrayIcon());

  if (process.platform === "darwin") {
    tray.setTitle(macTrayEmoji);
  }

  tray.setToolTip(t(currentLocale, "tray.tooltip"));
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", () => tray.setContextMenu(buildTrayMenu()));
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
    currentLocale = resolveLocale(readLocale(app), app.getLocale());
    currentModel = normalizeModel(readModel(app));
    alwaysOnTopEnabled = Boolean(readAlwaysOnTop(app));
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

ipcMain.handle("locale:get", () => currentLocale);

ipcMain.handle("locale:set", (_event, locale) => {
  setLocale(locale);
  return currentLocale;
});

ipcMain.handle("model:get", () => currentModel);

ipcMain.handle("model:set", (_event, model) => {
  setModel(model);
  return currentModel;
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
