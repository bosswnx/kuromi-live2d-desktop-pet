# Kuromi Live2D Desktop Pet

English | [简体中文](README.zh-CN.md)

A lightweight desktop pet featuring Kuromi as a [Live2D](https://www.live2d.com/) model. The window stays transparent and mostly click-through, so you can keep working while she hangs out on your screen.

> **Note:** This is an unofficial fan project. Kuromi and related characters are trademarks of Sanrio Co., Ltd. This repository is not affiliated with or endorsed by Sanrio.

## Features

- **Live2D animation** — Rendered with PixiJS and `pixi-live2d-display` (Cubism 4)
- **Desktop-friendly window** — Frameless, transparent, does not steal focus from other apps
- **Smart hit testing** — Mouse events only register on drawn pixels; empty areas stay click-through
- **Drag to move** — Grab the character to reposition the window
- **Click to chat** — Tap Kuromi for random dialogue bubbles; occasional idle lines
- **Eye / body tracking** — Follows your cursor across the screen
- **System tray** — Launch at login, language switch, quit
- **English & 中文** — UI and speech lines; preference is saved between sessions

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- npm (comes with Node.js)

## Quick start

```bash
git clone https://github.com/bosswnx/kuromi-live2d-desktop-pet.git
cd kuromi-live2d-desktop-pet
npm install
npm run app
```

`npm run app` starts the Vite dev server and Electron together (hot reload for the renderer).

### Other scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server only (browser preview) |
| `npm run start` | Electron using the built `dist/` (run `npm run build` first) |
| `npm run build` | Production frontend build into `dist/` |
| `npm run dist:mac` | Build macOS app (installer / `.app` in `release/`) |
| `npm run dist:win` | Build Windows installer and portable exe |

### Debug

```bash
KUROMI_DEBUG=1 npm run app
```

Opens detached DevTools for the pet window.

## Usage

| Action | Effect |
|--------|--------|
| **Drag** the character | Move the pet window |
| **Click** the character | Show a random line |
| **Tray icon** (menu bar / system tray) | Launch at login, **Language** (中文 / English), **Quit** |

On first launch, language follows your OS locale (`zh*` → Chinese, otherwise English). You can change it anytime from the tray menu.

## Project layout

```
├── electron/          # Main process (window, tray, IPC)
├── locales/           # en.json, zh.json — UI & speech strings
├── models/kuromi/     # Live2D model assets (served via Vite publicDir)
├── src/               # Renderer (PixiJS + Live2D)
├── build/             # App icons for electron-builder
└── vite.config.js
```

Live2D assets are copied to `dist/kuromi/` when you run `npm run build`.

## Customizing text

Edit `locales/en.json` and `locales/zh.json`. Keys under `speech.lines` are the random quotes; `speech.welcome` is shown on startup.

## License

Source code in this repository is provided as-is for personal and educational use. Live2D Cubism and third-party libraries are subject to their own licenses. Do not redistribute Sanrio character assets or commercialize this project without proper rights from the rights holders.
