import { ipcMain, shell } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { YtDlpService } from '../services/ytdlp'

const ytDlpService = new YtDlpService()

export const setupDownloadHandlers = () => {
  ipcMain.handle('download:start', async (event, url, options) => {
    const id = uuidv4()
    const sender = event.sender
    
    console.log(`Starting real download for ${url}`)

    // 1. Immediate Feedback: Send initial 0% progress to show card instantly
    sender.send('download:progress', { 
      id, 
      progress: 0, 
      title: 'Fetching info...', 
      url 
    })

    // Start download asynchronously
    ytDlpService.download(url, options, (progress, title) => {
      sender.send('download:progress', { id, progress, title, url })
    })
    .then((filePath) => {
      sender.send('download:complete', { id, filePath })
    })
    .catch((error) => {
      console.error('Download failed:', error)
      sender.send('download:error', { id, error: error.message })
    })
    
    // Return ID immediately so UI can track it
    return id
  })

  ipcMain.handle('shell:showInFolder', async (_, filePath) => {
    console.log('Opening file in folder:', filePath)
    shell.showItemInFolder(filePath)
  })
  
  ipcMain.handle('video:info', async (_, url) => {
     try {
       const info = await ytDlpService.getInfo(url)
       return {
         title: info.title,
         thumbnail: info.thumbnail,
         duration: info.duration,
         formats: info.formats // You might want to filter/map this
       }
     } catch (e) {
       console.error(e)
       throw e
     }
  })
}