import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import path from 'path'
import fs from 'fs'
import { startPythonService, stopPythonService, getPythonServiceUrl } from './python-bridge'
import { createAppMenu } from './menu'

// Handle Vite dev server vs production
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'PtoM — PDF to Markdown',
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // 窗口外观
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    show: false, // ready-to-show 后再显示，避免白屏
  })

  // 窗口准备好后再显示
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ===== IPC Handlers =====

// 打开文件对话框
ipcMain.handle('dialog:openFile', async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择文件',
    properties: ['openFile'],
    filters: options?.filters || [
      { name: '支持的文件', extensions: ['md', 'pdf', 'txt', 'html'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// 打开文件夹对话框
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择工作目录',
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// 读取文件内容
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 写入文件
ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 另存为对话框
ipcMain.handle('dialog:saveFile', async (_event, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '另存为',
    defaultPath: defaultName,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
})

// 读取目录结构
ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return {
      success: true,
      entries: entries.map((entry) => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      })),
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 检查路径是否存在
ipcMain.handle('fs:exists', async (_event, filePath: string) => {
  return fs.existsSync(filePath)
})

// 获取文件信息
ipcMain.handle('fs:stat', async (_event, filePath: string) => {
  try {
    const stat = fs.statSync(filePath)
    return {
      success: true,
      stat: {
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        isDirectory: stat.isDirectory(),
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ===== Python 转换相关 =====

// 检查 Python 服务状态
ipcMain.handle('python:health', async () => {
  const url = getPythonServiceUrl()
  if (!url) return { running: false }
  try {
    const response = await fetch(`${url}/health`)
    return { running: response.ok }
  } catch {
    return { running: false }
  }
})

// 根据扩展名推断图片 MIME 类型
function imageMime(name: string): string {
  const ext = path.extname(name).toLowerCase().replace('.', '')
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
  }
  return map[ext] || 'image/png'
}

// 将转换器返回的图片（base64 映射）内联为 data URI，让 Markdown 自包含
function inlineImages(markdown: string, images: Record<string, string>): string {
  let result = markdown
  for (const [name, base64] of Object.entries(images)) {
    const dataUri = `data:${imageMime(name)};base64,${base64}`
    // 匹配 ![...](name) 形式的引用
    result = result.split(`](${name})`).join(`](${dataUri})`)
  }
  return result
}

// PDF 转 Markdown：转换成功后写入 PDF 同目录下的同名 .md 文件
ipcMain.handle('python:convert', async (_event, pdfPath: string) => {
  const url = getPythonServiceUrl()
  if (!url) {
    return { success: false, error: 'PDF 转换服务未启动，请确认已安装 Python 环境及依赖（python-service/requirements.txt）' }
  }
  try {
    const response = await fetch(`${url}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_path: pdfPath }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return { success: false, error: (err as any).detail || '转换失败' }
    }
    const data = await response.json()
    const markdown = inlineImages(data.markdown || '', data.images || {})

    // 写入 PDF 同目录（失败不阻塞，仍返回内容供编辑）
    const mdPath = pdfPath.replace(/\.pdf$/i, '.md')
    let savedPath: string | null = null
    try {
      fs.writeFileSync(mdPath, markdown, 'utf-8')
      savedPath = mdPath
    } catch (e: any) {
      console.warn('[Main] Failed to write converted markdown:', e.message)
    }

    return { success: true, markdown, mdPath: savedPath, pages: data.pages || 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ===== 应用生命周期 =====

app.whenReady().then(async () => {
  // 创建应用菜单
  const menu = createAppMenu()
  Menu.setApplicationMenu(menu)

  // 启动 Python 服务
  try {
    await startPythonService()
    console.log('[Main] Python service started')
  } catch (error) {
    console.warn('[Main] Python service failed to start:', error)
    // 不阻塞启动，用户仍可编辑 MD 文件
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopPythonService()
})
