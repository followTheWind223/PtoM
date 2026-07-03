import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'

let pythonProcess: ChildProcess | null = null
let pythonServiceUrl: string | null = null
const DEFAULT_PORT = 18720

interface PythonCommand {
  command: string
  args: string[]
}

/**
 * 在开发环境和生产环境中定位 Python 服务
 * 返回候选命令列表，依次尝试（Windows: python/py，Linux/macOS: python3/python）
 */
function getPythonCommands(): PythonCommand[] {
  if (app.isPackaged) {
    const candidates: PythonCommand[] = []
    // 生产环境：优先使用 PyInstaller 打包的可执行文件
    const exeName = process.platform === 'win32' ? 'main.exe' : 'main'
    const pythonExe = path.join(process.resourcesPath, 'python-service', exeName)
    if (fs.existsSync(pythonExe)) {
      candidates.push({ command: pythonExe, args: [] })
    }
    // 回退：系统 Python
    const script = path.join(process.resourcesPath, 'python-service', 'main.py')
    for (const cmd of pythonInterpreters()) {
      candidates.push({ command: cmd, args: ['-u', script] })
    }
    return candidates
  }
  // 开发环境：使用本地 Python
  const servicePath = path.join(app.getAppPath(), 'python-service', 'main.py')
  return pythonInterpreters().map((cmd) => ({ command: cmd, args: ['-u', servicePath] }))
}

function pythonInterpreters(): string[] {
  return process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']
}

/**
 * 轮询 /health 直到服务就绪
 */
async function waitForHealth(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    // 进程已退出则不再等待
    if (!pythonProcess || pythonProcess.exitCode !== null) return false
    try {
      const res = await fetch(`${url}/health`)
      if (res.ok) return true
    } catch {
      // 服务还没起来，继续等
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

/**
 * 尝试用单个命令启动服务进程；spawn 失败（如命令不存在）时 reject
 */
function spawnPython(cmd: PythonCommand, port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd.command, cmd.args, {
      env: { ...process.env, PTOM_PORT: String(port) },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let settled = false

    child.stdout?.on('data', (data: Buffer) => {
      console.log(`[Python] ${data.toString().trim()}`)
    })
    // uvicorn 的启动日志走 stderr，这里只做记录，不作为失败依据
    child.stderr?.on('data', (data: Buffer) => {
      console.log(`[Python] ${data.toString().trim()}`)
    })

    child.on('error', (err) => {
      if (!settled) {
        settled = true
        reject(err)
      }
    })

    // spawn 事件表示进程成功创建（命令存在）
    child.on('spawn', () => {
      if (!settled) {
        settled = true
        resolve(child)
      }
    })

    child.on('close', (code) => {
      console.log(`[PythonBridge] Process exited with code ${code}`)
      if (pythonProcess === child) {
        pythonProcess = null
        pythonServiceUrl = null
      }
    })
  })
}

/**
 * 启动 Python FastAPI 服务：依次尝试候选命令，成功 spawn 后轮询 /health
 */
export async function startPythonService(): Promise<void> {
  const port = DEFAULT_PORT
  const url = `http://127.0.0.1:${port}`

  // 可能已有服务在运行（例如手动启动调试）
  try {
    const res = await fetch(`${url}/health`)
    if (res.ok) {
      pythonServiceUrl = url
      console.log('[PythonBridge] Reusing already-running service')
      return
    }
  } catch {
    // 未运行，正常启动
  }

  const candidates = getPythonCommands()
  let lastError: Error | null = null

  for (const cmd of candidates) {
    console.log(`[PythonBridge] Trying: ${cmd.command} ${cmd.args.join(' ')}`)
    try {
      pythonProcess = await spawnPython(cmd, port)
    } catch (err: any) {
      lastError = err
      continue
    }

    const healthy = await waitForHealth(url, 30000)
    if (healthy) {
      pythonServiceUrl = url
      console.log(`[PythonBridge] Service ready at ${url}`)
      return
    }

    // 进程起来了但服务不健康（缺依赖等），杀掉换下一个候选
    pythonProcess?.kill()
    pythonProcess = null
    lastError = new Error(`服务未通过健康检查 (${cmd.command})`)
  }

  throw lastError || new Error('未找到可用的 Python 解释器')
}

/**
 * 停止 Python 服务
 */
export function stopPythonService() {
  if (pythonProcess) {
    console.log('[PythonBridge] Stopping Python service...')
    const proc = pythonProcess
    proc.kill('SIGTERM')
    // Windows 上 SIGTERM 可能不生效，使用 SIGKILL 兜底
    setTimeout(() => {
      if (proc.exitCode === null) {
        proc.kill('SIGKILL')
      }
    }, 3000)
    pythonProcess = null
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
