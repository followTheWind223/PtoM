import { contextBridge, ipcRenderer } from 'electron'

/**
 * 通过 contextBridge 安全地向渲染进程暴露 API
 * 渲染进程通过 window.electronAPI 访问
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ---- 对话框 ----
  openFile: (options?: { filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:openFile', options),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (defaultName: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // ---- 文件系统 ----
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
  stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),

  // ---- Python 转换 ----
  checkPythonHealth: () => ipcRenderer.invoke('python:health'),
  convertPdf: (pdfPath: string) => ipcRenderer.invoke('python:convert', pdfPath),
})
