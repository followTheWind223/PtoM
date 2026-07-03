export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
}

export interface FileStat {
  size: number
  mtime: string
  isDirectory: boolean
}

export interface ConvertResult {
  success: boolean
  markdown?: string
  /** 转换结果已写盘时的真实路径 */
  mdPath?: string | null
  pages?: number
  error?: string
}

export interface ElectronAPI {
  // 对话框
  openFile: (options?: {
    filters?: { name: string; extensions: string[] }[]
  }) => Promise<string | null>
  openFolder: () => Promise<string | null>
  saveFile: (defaultName: string) => Promise<string | null>

  // 文件系统
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  readDir: (dirPath: string) => Promise<{ success: boolean; entries?: FileEntry[]; error?: string }>
  exists: (filePath: string) => Promise<boolean>
  stat: (filePath: string) => Promise<{ success: boolean; stat?: FileStat; error?: string }>

  // 拖拽文件路径（Electron webUtils）
  getPathForFile: (file: File) => string

  // Python 转换
  checkPythonHealth: () => Promise<{ running: boolean }>
  convertPdf: (pdfPath: string) => Promise<ConvertResult>

  // 菜单事件订阅，返回取消订阅函数
  onMenu: (channel: string, callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
