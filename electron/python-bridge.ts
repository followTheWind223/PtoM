import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'

let pythonProcess: ChildProcess | null = null
let pythonServiceUrl: string | null = null
const DEFAULT_PORT = 18720

/**
 * 在开发环境和生产环境中定位 Python 服务
 */
function getPythonCommand(): { command: string; args: string[] } {
  if (app.isPackaged) {
    // 生产环境：使用 PyInstaller 打包的 exe
    const pythonExe = path.join(process.resourcesPath, 'python-service', 'main.exe')
    if (fs.existsSync(pythonExe)) {
      return { command: pythonExe, args: [] }
    }
    // 回退：尝试系统 Python
    return { command: 'python', args: [path.join(process.resourcesPath, 'python-service', 'main.py')] }
  } else {
    // 开发环境：使用本地 Python
    const servicePath = path.join(app.getAppPath(), 'python-service', 'main.py')
    return { command: 'python', args: ['-u', servicePath] }
  }
}

/**
 * 查找可用端口
 */
function getPort(): number {
  return DEFAULT_PORT
}

/**
 * 启动 Python FastAPI 服务
 */
export function startPythonService(): Promise<void> {
  return new Promise((resolve, reject) => {
    const { command, args } = getPythonCommand()
    const port = getPort()

    console.log(`[PythonBridge] Starting: ${command} ${args.join(' ')}`)

    try {
      pythonProcess = spawn(command, args, {
        env: {
          ...process.env,
          PTOM_PORT: String(port),
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      pythonServiceUrl = `http://127.0.0.1:${port}`

      // 监听输出以检测启动成功
      const startupTimeout = setTimeout(() => {
        reject(new Error('Python 服务启动超时'))
      }, 30000)

      pythonProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()
        console.log(`[Python] ${output.trim()}`)
        // uvicorn 输出 "Uvicorn running on ..." 表示启动成功
        if (output.includes('Uvicorn running on') || output.includes('Application startup complete')) {
          clearTimeout(startupTimeout)
          resolve()
        }
      })

      pythonProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`[Python:err] ${data.toString().trim()}`)
      })

      pythonProcess.on('error', (err) => {
        clearTimeout(startupTimeout)
        console.error('[PythonBridge] Failed to start:', err.message)
        pythonProcess = null
        pythonServiceUrl = null
        reject(err)
      })

      pythonProcess.on('close', (code) => {
        clearTimeout(startupTimeout)
        console.log(`[PythonBridge] Process exited with code ${code}`)
        pythonProcess = null
        pythonServiceUrl = null
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 停止 Python 服务
 */
export function stopPythonService() {
  if (pythonProcess) {
    console.log('[PythonBridge] Stopping Python service...')
    pythonProcess.kill('SIGTERM')
    // Windows 上 SIGTERM 可能不生效，使用 SIGKILL 兜底
    setTimeout(() => {
      if (pythonProcess) {
        pythonProcess.kill('SIGKILL')
        pythonProcess = null
      }
    }, 3000)
  }
}

/**
 * 获取 Python 服务 URL
 */
export function getPythonServiceUrl(): string | null {
  return pythonServiceUrl
}

/**
 * 检查 Python 服务是否在运行
 */
export function isPythonServiceRunning(): boolean {
  return pythonProcess !== null && !pythonProcess.killed
}
