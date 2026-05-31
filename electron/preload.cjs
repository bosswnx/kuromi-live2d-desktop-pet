const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kuromiDesktopPet", {
  getLocale: () => ipcRenderer.invoke("locale:get"),
  setLocale: (locale) => ipcRenderer.invoke("locale:set", locale),
  onLocaleChanged: (callback) => {
    ipcRenderer.on("locale:changed", (_event, locale) => callback(locale));
  },
  getCursorPosition: () => ipcRenderer.invoke("cursor:get-position"),
  getWindowPosition: () => ipcRenderer.invoke("window:get-position"),
  setWindowPosition: (position) => ipcRenderer.send("window:set-position", position),
  setIgnoreMouse: (ignore) => ipcRenderer.send("mouse:set-ignore", ignore),
  log: (level, message) => ipcRenderer.send("renderer:log", level, message)
});
