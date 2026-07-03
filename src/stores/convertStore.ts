import { create } from 'zustand'

export type ConvertStatus = 'idle' | 'converting' | 'done' | 'error'

interface ConvertState {
  status: ConvertStatus
  progress: string // 描述性进度文本
  error: string | null
  resultMarkdown: string | null
  pythonRunning: boolean

  setStatus: (status: ConvertStatus) => void
  setProgress: (progress: string) => void
  setError: (error: string | null) => void
  setResultMarkdown: (md: string | null) => void
  setPythonRunning: (running: boolean) => void
  reset: () => void
}

export const useConvertStore = create<ConvertState>((set) => ({
  status: 'idle',
  progress: '',
  error: null,
  resultMarkdown: null,
  pythonRunning: false,

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, status: 'error' }),
  setResultMarkdown: (resultMarkdown) =>
    set({ resultMarkdown, status: 'done' }),
  setPythonRunning: (pythonRunning) => set({ pythonRunning }),
  reset: () =>
    set({
      status: 'idle',
      progress: '',
      error: null,
      resultMarkdown: null,
    }),
}))
