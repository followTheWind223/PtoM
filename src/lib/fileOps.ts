import { useEditorStore } from '../stores/editorStore'
import { useConvertStore } from '../stores/convertStore'

/** 从磁盘路径打开文件到编辑器 */
export async function openFileFromPath(filePath: string): Promise<boolean> {
  if (!window.electronAPI) return false
  const result = await window.electronAPI.readFile(filePath)
  if (!result.success || result.content === undefined) {
    return false
  }
  const name = filePath.split(/[/\\]/).pop() || filePath
  useEditorStore.getState().openFile({
    path: filePath,
    name,
    content: result.content,
    isModified: false,
    mode: 'wysiwyg',
  })
  useEditorStore.getState().addRecentFile(filePath)
  return true
}

/** 转换 PDF 并在编辑器中打开结果 */
export async function convertPdf(pdfPath: string): Promise<boolean> {
  if (!window.electronAPI) return false
  const convert = useConvertStore.getState()
  const fileName = pdfPath.split(/[/\\]/).pop() || pdfPath

  convert.setStatus('converting')
  convert.setProgress(`正在转换 ${fileName}...`)

  const result = await window.electronAPI.convertPdf(pdfPath)

  if (result.success && result.markdown !== undefined) {
    convert.setResultMarkdown(result.markdown)
    // 主进程已将结果写盘时用真实路径，否则用虚拟路径并标记未保存
    const mdPath = result.mdPath || pdfPath.replace(/\.pdf$/i, '.md')
    const name = mdPath.split(/[/\\]/).pop() || 'converted.md'
    useEditorStore.getState().openFile({
      path: mdPath,
      name,
      content: result.markdown,
      isModified: !result.mdPath,
      mode: 'wysiwyg',
    })
    if (result.mdPath) {
      useEditorStore.getState().addRecentFile(result.mdPath)
    }
    return true
  }

  convert.setError(result.error || '转换失败')
  return false
}

/** 处理拖入的文件列表（PDF 转换 / Markdown 打开） */
export async function handleDroppedFiles(files: File[]): Promise<void> {
  if (!window.electronAPI) return
  for (const file of files) {
    // Electron 31+ 中 File.path 已废弃，必须通过 preload 的 webUtils 拿路径
    let filePath = ''
    try {
      filePath = window.electronAPI.getPathForFile(file)
    } catch {
      filePath = (file as any).path || ''
    }
    if (!filePath) continue

    const lower = file.name.toLowerCase()
    if (lower.endsWith('.pdf')) {
      await convertPdf(filePath)
    } else if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt')) {
      await openFileFromPath(filePath)
    }
  }
}

/** 保存当前活跃文件 */
export async function saveActiveFile(): Promise<boolean> {
  if (!window.electronAPI) return false
  const state = useEditorStore.getState()
  const currentFile = state.openFiles[state.activeIndex]
  if (!currentFile) return false

  const result = await window.electronAPI.writeFile(currentFile.path, currentFile.content)
  if (result.success) {
    state.markModified(currentFile.path, false)
    return true
  }
  // 直接写失败（如虚拟路径无权限）时走另存为
  return saveActiveFileAs()
}

/** 另存为当前活跃文件 */
export async function saveActiveFileAs(): Promise<boolean> {
  if (!window.electronAPI) return false
  const state = useEditorStore.getState()
  const currentFile = state.openFiles[state.activeIndex]
  if (!currentFile) return false

  const savePath = await window.electronAPI.saveFile(currentFile.name)
  if (!savePath) return false
  const result = await window.electronAPI.writeFile(savePath, currentFile.content)
  if (result.success) {
    state.markModified(currentFile.path, false)
    return true
  }
  return false
}
