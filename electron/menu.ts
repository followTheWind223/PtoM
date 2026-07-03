import { app, Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron'

export function createAppMenu(): Menu {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // macOS 应用菜单
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // 文件
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: (menuItem, browserWindow) => {
            browserWindow?.webContents.send('menu:openFile')
          },
        },
        {
          label: '打开文件夹',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: (menuItem, browserWindow) => {
            browserWindow?.webContents.send('menu:openFolder')
          },
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: (menuItem, browserWindow) => {
            browserWindow?.webContents.send('menu:save')
          },
        },
        {
          label: '另存为...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (menuItem, browserWindow) => {
            browserWindow?.webContents.send('menu:saveAs')
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    // 编辑
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    // 视图
    {
      label: '视图',
      submenu: [
        {
          label: '切换侧边栏',
          accelerator: 'CmdOrCtrl+B',
          click: (menuItem, browserWindow) => {
            browserWindow?.webContents.send('menu:toggleSidebar')
          },
        },
        {
          label: '切换源码模式',
          accelerator: 'CmdOrCtrl+/',
          click: (menuItem, browserWindow) => {
            browserWindow?.webContents.send('menu:toggleSourceMode')
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },

    // 帮助
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 PtoM',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox({
              type: 'info',
              title: '关于 PtoM',
              message: 'PtoM — PDF to Markdown',
              detail: `版本: ${app.getVersion()}\n一款 PDF 转 Markdown 的桌面文档浏览器`,
            })
          },
        },
      ],
    },
  ]

  return Menu.buildFromTemplate(template)
}
