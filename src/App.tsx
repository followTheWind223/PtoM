import { useEffect, useCallback, useState } from 'react'
import { useEditorStore } from './stores/editorStore'
import { useConvertStore } from './stores/convertStore'
import { Sidebar } from './components/layout/Sidebar'
import { MainArea } from './components/layout/MainArea'
import { WelcomePage } from './components/WelcomePage'

export default function App() {
  const { openFiles, activeIndex, sidebarVisible } = useEditorStore()
  const { setPythonRunning, setStatus, setProgress, setError, setResultMarkdown } =
    useConvertStore()
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false)

  // 启动时检查 Python 服务状态
  useEffect(() => {
    async function checkPython() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.checkPythonHealth()
          setPythonRunning(result.running)
        }
      } catch {
        setPythonRunning(false)
      }
    }
    checkPython()
  }, [setPythonRunning])

  // 监听菜单事件
  useEffect(() => {
    const { ipcRenderer } = window as any
    if (!ipcRenderer) return

    const handleMenuOpenFile = async () => {
      const filePath = await window.electronAPI.openFile()
      if (filePath) {
        openFileFromPath(filePath)
      }
    }

    const handleMenuOpenFolder = async () => {
      const dirPath = await window.electronAPI.openFolder()
      if (dirPath) {
        useEditorStore.getState().setWorkspacePath(dirPath)
      }
    }

    const handleMenuSave = async () => {
      const state = useEditorStore.getState()
      const currentFile = state.openFiles[state.activeIndex]
      if (currentFile) {
        await window.electronAPI.writeFile(currentFile.path, currentFile.content)
        useEditorStore.getState().markModified(currentFile.path, false)
      }
    }

    const handleMenuSaveAs = async () => {
      const state = useEditorStore.getState()
      const currentFile = state.openFiles[state.activeIndex]
      if (currentFile) {
        const savePath = await window.electronAPI.saveFile(currentFile.name)
        if (savePath) {
          await window.electronAPI.writeFile(savePath, currentFile.content)
          useEditorStore.getState().markModified(currentFile.path, false)
        }
      }
    }

    const handleToggleSidebar = () => {
      useEditorStore.getState().toggleSidebar()
    }

    const handleToggleSourceMode = () => {
      const state = useEditorStore.getState()
      const currentFile = state.openFiles[state.activeIndex]
      if (currentFile) {
        useEditorStore.getState().toggleSourceMode(currentFile.path)
      }
    }

    ipcRenderer.on('menu:openFile', handleMenuOpenFile)
    ipcRenderer.on('menu:openFolder', handleMenuOpenFolder)
    ipcRenderer.on('menu:save', handleMenuSave)
    ipcRenderer.on('menu:saveAs', handleMenuSaveAs)
    ipcRenderer.on('menu:toggleSidebar', handleToggleSidebar)
    ipcRenderer.on('menu:toggleSourceMode', handleToggleSourceMode)

    return () => {
      ipcRenderer.removeListener('menu:openFile', handleMenuOpenFile)
      ipcRenderer.removeListener('menu:openFolder', handleMenuOpenFolder)
      ipcRenderer.removeListener('menu:save', handleMenuSave)
      ipcRenderer.removeListener('menu:saveAs', handleMenuSaveAs)
      ipcRenderer.removeListener('menu:toggleSidebar', handleToggleSidebar)
      ipcRenderer.removeListener('menu:toggleSourceMode', handleToggleSourceMode)
    }
  }, [])

  // 通过路径打开文件
  const openFileFromPath = async (filePath: string) => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.readFile(filePath)
    if (result.success && result.content !== undefined) {
      const name = filePath.split(/[/\\]/).pop() || filePath
      useEditorStore.getState().openFile({
        path: filePath,
        name,
        content: result.content,
        isModified: false,
        isSourceMode: false,
      })
      useEditorStore.getState().addRecentFile(filePath)
    }
  }

  // PDF 转换
  const convertPdf = async (pdfPath: string) => {
    if (!window.electronAPI) return

    setStatus('converting')
    setProgress('正在解析 PDF...')

    const result = await window.electronAPI.convertPdf(pdfPath)

    if (result.success && result.markdown) {
      setResultMarkdown(result.markdown)
      const name = pdfPath.split(/[/\\]/).pop()?.replace('.pdf', '.md') || 'converted.md'
      useEditorStore.getState().openFile({
        path: pdfPath.replace('.pdf', '.md'),
        name,
        content: result.markdown,
        isModified: true,
        isSourceMode: false,
      })
    } else {
      setError(result.error || '转换失败')
    }
  }

  // 全局拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsGlobalDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 仅在真正离开窗口时取消高亮
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsGlobalDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsGlobalDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      const filePath = (file as any).path
      if (!filePath) continue

      if (file.name.endsWith('.pdf')) {
        await convertPdf(filePath)
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        await openFileFromPath(filePath)
      }
    }
  }, [])

  const hasOpenFiles = openFiles.length > 0

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 侧边栏 */}
      <div
        className={`sidebar-transition flex-shrink-0 border-r border-sidebar-border ${
          sidebarVisible ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {hasOpenFiles ? (
          <MainArea />
        ) : (
          <WelcomePage />
        )}

        {/* 全局拖拽覆盖层 */}
        {isGlobalDragOver && (
          <div className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl shadow-lg px-6 py-4 text-center">
              <p className="text-lg font-semibold text-blue-600">
                释放文件以导入
              </p>
              <p className="text-sm text-gray-400 mt-1">
                支持 PDF、Markdown 文件
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
