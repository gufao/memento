/// <reference types="vite/client" />

interface Window {
  electron: any
  api: {
    download: {
      start: (url: string, options: any) => Promise<string>
      getInfo: (url: string) => Promise<any>
      onProgress: (callback: (data: any) => void) => () => void
      onComplete: (callback: (data: any) => void) => () => void
      showInFolder: (path: string) => Promise<void>
    }
    settings: {
      get: (key: string) => Promise<any>
      set: (key: string, value: any) => Promise<void>
      getAll: () => Promise<any>
    }
  }
}
