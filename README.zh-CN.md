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
- **2D / 3D 模型切换** — 通过托盘菜单在模型版本之间切换
- **呼吸与待机动画** — 自然呼吸周期与眨眼
- **对话气泡** — 随机台词配合嘴巴张合动画
- **系统托盘** — 开机自启、模型切换、语言切换、退出
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
| **托盘图标** | 开机自启、**模型**（2D / 3D）、**语言**（中文 / English）、**退出** |

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

本仓库**源代码**采用 [MIT License](LICENSE)。

Live2D Cubism、项目依赖包以及三丽鸥角色相关素材（模型、图像、名称等）**不适用** MIT 许可，仍须遵守各自的权利人条款。请勿未经授权再分发上述素材或将本项目用于商业用途。
