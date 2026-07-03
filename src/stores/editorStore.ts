import { create } from 'zustand'
import type { Editor } from '@milkdown/kit/core'

export interface OpenFile {
  path: string
  name: string
  content: string
  isModified: boolean
  isSourceMode: boolean
}

interface EditorState {
  // 打开的标签页
  openFiles: OpenFile[]
  // 当前活跃标签页索引
  activeIndex: number
  // 侧边栏是否可见
  sidebarVisible: boolean
  // 工作目录
  workspacePath: string | null
  // 最近文件列表
  recentFiles: string[]

  // 当前活跃编辑器的 ref（供 Toolbar 等组件调用命令）
  activeEditorRef: { current: Editor | null }

  // Actions
  openFile: (file: OpenFile) => void
  closeFile: (filePath: string) => void
  setActiveFile: (index: number) => void
  updateContent: (filePath: string, content: string) => void
  markModified: (filePath: string, modified: boolean) => void
  toggleSourceMode: (filePath: string) => void
  toggleSidebar: () => void
  setWorkspacePath: (dirPath: string | null) => void
  addRecentFile: (filePath: string) => void
  setActiveEditorRef: (ref: { current: Editor | null }) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeIndex: -1,
  sidebarVisible: true,
  workspacePath: null,
  recentFiles: [],
  activeEditorRef: { current: null },

  openFile: (file) => {
    const { openFiles } = get()
    const existingIndex = openFiles.findIndex((f) => f.path === file.path)
    if (existingIndex >= 0) {
      set({ activeIndex: existingIndex })
      return
    }
    set((state) => ({
      openFiles: [...state.openFiles, file],
      activeIndex: state.openFiles.length,
    }))
  },

  closeFile: (filePath) => {
    set((state) => {
      const newFiles = state.openFiles.filter((f) => f.path !== filePath)
      let newIndex = state.activeIndex
      if (newIndex >= newFiles.length) {
        newIndex = newFiles.length - 1
      }
      return { openFiles: newFiles, activeIndex: newIndex }
    })
  },

  setActiveFile: (index) => {
    set({ activeIndex: index })
  },

  updateContent: (filePath, content) => {
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === filePath ? { ...f, content } : f
      ),
    }))
  },

  markModified: (filePath, modified) => {
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === filePath ? { ...f, isModified: modified } : f
      ),
    }))
  },

  toggleSourceMode: (filePath) => {
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === filePath ? { ...f, isSourceMode: !f.isSourceMode } : f
      ),
    }))
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }))
  },

  setWorkspacePath: (dirPath) => {
    set({ workspacePath: dirPath })
  },

  addRecentFile: (filePath) => {
    set((state) => {
      const filtered = state.recentFiles.filter((f) => f !== filePath)
      return { recentFiles: [filePath, ...filtered].slice(0, 10) }
    })
  },

  setActiveEditorRef: (ref) => {
    set({ activeEditorRef: ref })
  },
}))
