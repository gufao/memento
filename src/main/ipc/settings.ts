import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store()

export const setupSettingsHandlers = () => {
  ipcMain.handle('settings:get', (_, key) => {
    return store.get(key)
  })

  ipcMain.handle('settings:set', (_, key, value) => {
    store.set(key, value)
  })
  
  ipcMain.handle('settings:getAll', () => {
    return store.store
  })
}
