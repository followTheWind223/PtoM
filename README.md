# PtoM — PDF to Markdown 桌面文档浏览器

一款桌面端 PDF 转 Markdown 的全功能文档浏览器，提供类 Typora 的所见即所得编辑体验。

## 功能特性

- **PDF 转 Markdown** — 基于 marker-pdf 引擎，高质量转换 PDF 文档为 Markdown，支持表格、公式、图片和代码块
- **WYSIWYG 编辑** — 所见即所得编辑体验（类 Typora），支持源码模式切换
- **文件树浏览** — 侧边栏目录树，支持多级文件夹展开和文件搜索
- **多标签页** — 同时打开多个文档，标签页间自由切换
- **一键导出** — 支持导出为 PDF、HTML 等格式
- **跨平台** — 支持 Windows（优先）、macOS

## 技术栈

### 桌面框架
- **[Electron](https://www.electronjs.org/)** 28+ — 跨平台桌面应用框架，提供窗口管理、系统菜单、文件系统访问等原生能力

### 前端
- **[React](https://react.dev/)** 18 — 声明式 UI 框架
- **[TypeScript](https://www.typescriptlang.org/)** — 类型安全
- **[Milkdown](https://milkdown.dev/)** — 插件化 WYSIWYG Markdown 编辑器
- **[Zustand](https://zustand-demo.pmnd.rs/)** — 轻量级状态管理
- **[Tailwind CSS](https://tailwindcss.com/)** — 原子化 CSS 框架
- **[Vite](https://vitejs.dev/)** — 前端构建工具

### PDF 转换引擎
- **[marker-pdf](https://github.com/VikParuchuri/marker)** — Python 生态中最好的 PDF 转 Markdown 工具之一，对表格、公式、图片有优秀处理能力
- **[FastAPI](https://fastapi.tiangolo.com/)** — Python 侧本地 HTTP 服务，负责与 Electron 通信
- **[PyInstaller](https://pyinstaller.org/)** — 将 Python 服务打包为独立可执行文件

### 打包分发
- **[electron-builder](https://www.electron.build/)** — 打包为 Windows NSIS 安装包 / macOS DMG

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     Electron App                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Renderer Process (React 18)             │  │
│  │  ┌────────────┐ ┌──────────────────────────────┐  │  │
│  │  │ File Tree  │ │   Milkdown Editor             │  │  │
│  │  │ Sidebar    │ │  (WYSIWYG + Source Mode)      │  │  │
│  │  └────────────┘ └──────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │          Tab Manager (多标签页)             │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
│           ↕ IPC (contextBridge)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Main Process (Node.js)                  │  │
│  │  • 窗口管理   • 文件系统   • 菜单配置             │  │
│  │  • Python 进程生命周期管理   • 配置存储           │  │
│  └───────────────────────────────────────────────────┘  │
│           ↕ HTTP (localhost)                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Python Sidecar (FastAPI)                  │  │
│  │  • marker-pdf 引擎                                 │  │
│  │  • PDF 解析 / Markdown 生成 / 进度上报            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 通信流程（PDF 转换）

```
用户拖入 PDF 文件
       │
       ▼
Renderer 发送 IPC 消息 → Main Process
       │
       ▼
Main Process 转发 HTTP 请求 → Python FastAPI (localhost:随机端口)
       │
       ▼
marker-pdf 解析 PDF → 生成 Markdown + 提取图片
       │
       ▼
返回 Markdown 内容 → Main Process → Renderer
       │
       ▼
Milkdown 编辑器展示 Markdown（WYSIWYG 模式）
```

## 项目结构

```
PtoM/
├── electron/                  # Electron 主进程
│   ├── main.ts                # 主入口，窗口创建、生命周期
│   ├── preload.ts             # 预加载脚本，安全暴露 API 给渲染进程
│   ├── python-bridge.ts       # Python 子进程管理（启动/停止/健康检查）
│   └── menu.ts                # 应用菜单配置
├── src/                       # 渲染进程 (React)
│   ├── App.tsx                # 根组件
│   ├── main.tsx               # React 入口
│   ├── components/
│   │   ├── layout/            # 布局组件
│   │   │   ├── Sidebar.tsx        # 侧边栏容器
│   │   │   └── MainArea.tsx       # 主编辑区容器
│   │   ├── FileTree/          # 文件树组件
│   │   │   ├── FileTree.tsx       # 文件树主组件
│   │   │   └── FileTreeNode.tsx   # 树节点
│   │   ├── Editor/            # Milkdown 编辑器封装
│   │   │   ├── MarkdownEditor.tsx # 编辑器主组件
│   │   │   └── milkdown-plugins/  # 自定义插件
│   │   ├── TabBar/            # 标签栏
│   │   │   └── TabBar.tsx
│   │   └── Toolbar/           # 工具栏
│   │       └── Toolbar.tsx
│   ├── stores/                # Zustand 状态管理
│   │   ├── editorStore.ts     # 编辑器状态（打开的文件、当前标签等）
│   │   ├── fileTreeStore.ts   # 文件树状态
│   │   └── convertStore.ts    # PDF 转换状态
│   ├── hooks/                 # 自定义 Hooks
│   ├── types/                 # TypeScript 类型定义
│   └── styles/                # 全局样式
│       └── index.css
├── python-service/            # Python 转换服务
│   ├── main.py                # FastAPI 应用入口
│   ├── converter.py           # marker-pdf 转换封装
│   ├── utils.py               # 工具函数
│   └── requirements.txt       # Python 依赖
├── resources/                 # 静态资源
│   └── icon.png               # 应用图标
├── package.json               # Node 依赖与脚本
├── vite.config.ts             # Vite 配置
├── electron-builder.yml       # electron-builder 打包配置
├── tsconfig.json              # TypeScript 配置
├── tsconfig.node.json         # Node 端 TS 配置
├── tailwind.config.js         # Tailwind 配置
└── postcss.config.js          # PostCSS 配置
```

## 开发计划

### Phase 1: 项目脚手架
- [x] 技术选型确认
- [ ] 初始化 Electron + React + Vite 工程
- [ ] 配置 TypeScript、Tailwind CSS
- [ ] 配置 electron-builder
- [ ] 验证开发环境（热重载、调试）

### Phase 2: Python 转换服务
- [ ] 搭建 FastAPI 本地服务
- [ ] 集成 marker-pdf 引擎
- [ ] 实现 PDF → MD 转换 API
- [ ] 实现 Electron ↔ Python 通信桥接

### Phase 3: 核心 UI
- [ ] 布局框架（侧边栏 + 编辑区）
- [ ] 文件树组件（目录浏览、展开折叠、右键菜单）
- [ ] 多标签页管理（打开、切换、关闭）
- [ ] Milkdown 编辑器集成（WYSIWYG + 源码模式切换）

### Phase 4: 功能串联
- [ ] 导入 PDF → 调用 Python 转换 → 展示 MD
- [ ] Markdown 文件保存 / 另存为
- [ ] 拖拽导入 PDF 文件
- [ ] 最近文件列表
- [ ] 工具栏（加粗、斜体、标题等）

### Phase 5: 打包分发
- [ ] PyInstaller 打包 Python 服务为独立 exe
- [ ] electron-builder 配置（NSIS 安装包 / 便携版）
- [ ] 自动化打包脚本
- [ ] Windows 安装包产出与测试

## 环境要求

### 开发环境
- Node.js 18+
- Python 3.9+（开发时本地 Python 环境，打包后无需）
- pnpm（推荐）或 npm

### 用户环境（打包后）
- Windows 10/11（64 位）
- 无需安装 Python 或其他依赖

## 快速开始

```bash
# 克隆项目
git clone <repo-url>
cd PtoM

# 安装 Node 依赖
pnpm install

# 安装 Python 依赖
cd python-service
pip install -r requirements.txt
cd ..

# 启动开发环境
pnpm dev
```

## 打包

```bash
# 完整打包（Python 服务 + Electron）
pnpm build
pnpm package
```

---

🤖 Built with Electron + React + Milkdown + marker-pdf
