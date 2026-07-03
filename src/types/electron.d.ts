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
  images?: Record<string, string>
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

  // Python 转换
  checkPythonHealth: () => Promise<{ running: boolean }>
  convertPdf: (pdfPath: string) => Promise<ConvertResult>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
