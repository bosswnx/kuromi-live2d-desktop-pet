# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run app          # Dev mode: Vite + Electron with hot reload
npm run dev          # Vite dev server only (browser preview at 127.0.0.1:5173)
npm run build        # Production build → dist/
npm run start        # Electron loading dist/ (requires npm run build first)
npm run dist:mac     # Full macOS package → release/
npm run dist:win     # Full Windows package → release/
```

Debug: `KUROMI_DEBUG=1 npm run app` opens detached DevTools for the pet window.

## Architecture

Electron desktop pet with Live2D rendering. Three layers:

**Renderer** (`src/app.js`) — PixiJS app on a transparent canvas. Drives the Live2D model: cursor tracking, blink/breath/talk animation cycles, drag-to-move, click-to-speak. Pixel-perfect hit testing reads the WebGL backbuffer to decide when the window should be click-through vs interactive.

**Preload bridge** (`electron/preload.cjs`) — `contextBridge.exposeInMainWorld("kuromiDesktopPet", {...})`. The only API surface between renderer and main. Exposes: locale get/set, model get/set, cursor position, window position, mouse passthrough toggle, logging.

**Main process** (`electron/main.cjs`) — `BrowserWindow` (transparent, frameless, non-focusable, visible on all workspaces), system tray, single-instance lock, IPC handlers that delegate to settings/i18n modules.

Settings persist to `userData/settings.json` via `electron/settings.cjs` (locale, model, alwaysOnTop). i18n has parallel implementations: `electron/i18n.cjs` (Node `require`) and `src/i18n.js` (browser ESM) — same API, same locale normalization (`zh-*` → `zh`, everything else → `en`).

## Key patterns

- **Model cancellation token**: `mountModel()` increments `modelLoadToken` before async load. Stale loads are silently discarded if the token changed during fetch (`src/app.js:264-282`).
- **Drag vs tap**: `pointerdown` sets `dragState` synchronously; a 2px move threshold toggles `moved`. On `pointerup`, `!moved` → `say()`.
- **Live2D Cubism Core must load first**: `boot()` loads `live2dcubismcore/live2dcubismcore.min.js` as a `<script>` before importing `pixi-live2d-display/cubism4`.
- **Dev URL fallback**: `KUROMI_DEV_SERVER=1` → loads from Vite dev server; otherwise loads `dist/index.html`.

## Adding features

- **New tray menu item**: Add locale keys → add entry in `buildTrayMenu()` (`electron/main.cjs`) → if persistent, add read/write in `electron/settings.cjs` → if renderer needs it, expose via `preload.cjs` and add IPC handler.
- **New speech lines**: Edit `locales/en.json` and `locales/zh.json` → `speech.lines` arrays.
- **Model swap**: Replace files in `models/kuromi/` or `models/kuromi-3d/`; update `MODELS` mapping in `src/app.js` if paths change.
- **No test suite exists** — verify changes manually by running `npm run app`.

## File map

```
src/app.js              # PIXI app, model lifecycle, animation loop, input handling
src/i18n.js             # Browser-side i18n (locale detection, t(), pickSpeechLine)
src/styles.css          # Transparent bg, speech bubble
electron/main.cjs       # BrowserWindow, tray, IPC handlers, single-instance lock
electron/preload.cjs    # contextBridge API surface
electron/i18n.cjs       # Node-side i18n (same API as src/i18n.js)
electron/settings.cjs   # JSON persistence (userData/settings.json)
electron/assets/        # tray.png (Windows/Linux tray icon)
models/kuromi/          # 2D model: .moc3, .model3.json, .cmo3, .cdi3.json, textures
models/kuromi-3d/       # 3D model: same + .physics3.json
locales/en.json         # English: tray labels, speech lines, error messages
locales/zh.json         # Chinese: same keys
index.html              # Entry HTML, loads /src/app.js as module
vite.config.js          # base: "./", publicDir: "models"
```

## IPC communication flow

```
Renderer (src/app.js)                       Main (electron/main.cjs)
─────────────────────                       ─────────────────────────
kuromiDesktopPet.log()          ──send──►   ipcMain "renderer:log"    → console
kuromiDesktopPet.getLocale()    ──invoke─►  ipcMain "locale:get"      ← currentLocale
kuromiDesktopPet.getModel()     ──invoke─►  ipcMain "model:get"       ← currentModel
kuromiDesktopPet.getCursorPos() ──invoke─►  screen.getCursorScreenPoint()
kuromiDesktopPet.getWindowPos() ──invoke─►  mainWindow.getPosition()
kuromiDesktopPet.setWindowPos() ──send──►   mainWindow.setPosition()
kuromiDesktopPet.setIgnoreMouse()──send──►  mainWindow.setIgnoreMouseEvents()

mainWindow.webContents.send()   ◄──on────  locale:changed / model:changed
```

## Constraints

- **Single instance**: `app.requestSingleInstanceLock()` — second launch activates existing window.
- **Window is non-focusable** (`focusable: false`) — pet never steals keyboard focus. Intentional.
- **macOS tray uses "🖤" emoji title** instead of tray.png; dock icon hidden via `app.dock?.hide()`.
- **Settings corruption is silently tolerated** — JSON parse failures return `{}`, resetting config gracefully.
- **asar unpacking**: `dist/kuromi/**` is unpacked from the asar so Live2D can load model files from disk. `.cmo3` and 4096-texture variants are excluded from packaging.
