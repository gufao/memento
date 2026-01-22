import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  download: {
    start: (url: string, options: any) => ipcRenderer.invoke('download:start', url, options),
    getInfo: (url: string) => ipcRenderer.invoke('video:info', url),
    onProgress: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data)
      ipcRenderer.on('download:progress', subscription)
      return () => ipcRenderer.removeListener('download:progress', subscription)
    },
    onComplete: (callback: (data: any) => void) => {
      const subscription = (_: any, data: any) => callback(data)
      ipcRenderer.on('download:complete', subscription)
      return () => ipcRenderer.removeListener('download:complete', subscription)
    },
    showInFolder: (path: string) => ipcRenderer.invoke('shell:showInFolder', path)
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
