const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kuromiDesktopPet", {
  getCursorPosition: () => ipcRenderer.invoke("cursor:get-position"),
  getWindowPosition: () => ipcRenderer.invoke("window:get-position"),
  setWindowPosition: (position) => ipcRenderer.send("window:set-position", position),
  setIgnoreMouse: (ignore) => ipcRenderer.send("mouse:set-ignore", ignore),
  log: (level, message) => ipcRenderer.send("renderer:log", level, message)
});
