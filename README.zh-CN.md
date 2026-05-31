# Kuromi Live2D 桌宠

[English](README.md) | 简体中文

一款轻量级 Kuromi [Live2D](https://www.live2d.com/) 桌面宠物。窗口透明且大部分区域可穿透点击，不影响你正常使用电脑。

> **说明：** 本项目为爱好者作品，与三丽鸥（Sanrio）无任何关联，亦未获其授权。Kuromi 及相关角色版权归 Sanrio Co., Ltd. 所有。

## 功能

- **Live2D 动画** — 基于 PixiJS 与 `pixi-live2d-display`（Cubism 4）
- **适合桌面的窗口** — 无边框、透明、点击桌宠时不会抢走其他应用的前台焦点
- **像素级命中** — 仅在模型绘制区域响应鼠标，其余区域保持穿透
- **拖动换位** — 按住角色可移动窗口
- **点击对话** — 点击 Kuromi 显示随机台词；也会定时冒泡
- **视线 / 身体跟随** — 跟随屏幕上的鼠标移动
- **系统托盘** — 开机自启、切换语言、退出
- **中英双语** — 菜单与台词支持中文、英文，选择会保存

## 环境要求

- [Node.js](https://nodejs.org/) 18 或更高版本
- npm（随 Node.js 安装）

## 快速开始

```bash
git clone https://github.com/bosswnx/kuromi-live2d-desktop-pet.git
cd kuromi-live2d-desktop-pet
npm install
npm run app
```

`npm run app` 会同时启动 Vite 开发服务器与 Electron（渲染进程支持热更新）。

### 其他命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 仅启动 Vite（可在浏览器中预览） |
| `npm run start` | 仅启动 Electron（需先执行 `npm run build`） |
| `npm run build` | 构建前端到 `dist/` |
| `npm run dist:mac` | 打包 macOS 应用（输出在 `release/`） |
| `npm run dist:win` | 打包 Windows 安装包与便携版 |

### 调试

```bash
KUROMI_DEBUG=1 npm run app
```

会为桌宠窗口打开独立的开发者工具。

## 使用说明

| 操作 | 效果 |
|------|------|
| **拖动**角色 | 移动桌宠窗口 |
| **点击**角色 | 显示一条随机台词 |
| **托盘图标** | 开机自启、**语言**（中文 / English）、**退出** |

首次启动时，语言根据系统区域设置（`zh*` 为中文，否则为英文），也可在托盘菜单中随时切换。

## 项目结构

```
├── electron/          # 主进程（窗口、托盘、IPC）
├── locales/           # en.json、zh.json — 界面与台词
├── models/kuromi/     # Live2D 模型资源（经 Vite publicDir 提供）
├── src/               # 渲染进程（PixiJS + Live2D）
├── build/             # electron-builder 使用的图标
└── vite.config.js
```

执行 `npm run build` 后，模型资源会复制到 `dist/kuromi/`。

## 修改文案

编辑 `locales/zh.json` 与 `locales/en.json`。`speech.lines` 为随机台词列表，`speech.welcome` 为启动时的欢迎语。

## 许可说明

本仓库源代码仅供个人学习与爱好者交流，按现状提供。Live2D Cubism 及第三方依赖遵循各自许可。请勿在未获得权利人授权的情况下再分发三丽鸥角色素材或将本项目用于商业用途。
