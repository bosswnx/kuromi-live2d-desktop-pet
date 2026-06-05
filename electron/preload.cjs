const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kuromiDesktopPet", {
  getLocale: () => ipcRenderer.invoke("locale:get"),
  setLocale: (locale) => ipcRenderer.invoke("locale:set", locale),
  onLocaleChanged: (callback) => {
    ipcRenderer.on("locale:changed", (_event, locale) => callback(locale));
  },
  getModel: () => ipcRenderer.invoke("model:get"),
  setModel: (model) => ipcRenderer.invoke("model:set", model),
  onModelChanged: (callback) => {
    ipcRenderer.on("model:changed", (_event, model) => callback(model));
  },
  getCursorPosition: () => ipcRenderer.invoke("cursor:get-position"),
  getWindowPosition: () => ipcRenderer.invoke("window:get-position"),
  setWindowPosition: (position) => ipcRenderer.send("window:set-position", position),
  setIgnoreMouse: (ignore) => ipcRenderer.send("mouse:set-ignore", ignore),
  log: (level, message) => ipcRenderer.send("renderer:log", level, message)
});
