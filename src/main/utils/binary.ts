import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export const getBinaryPath = (name: string): string => {
  const platform = process.platform
  const ext = platform === 'win32' ? '.exe' : ''

  // Development path: resources/binaries/<platform>/<name>
  // Production path: resources/binaries/<name>
  
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'binaries', `${name}${ext}`)
  }
  
  // For dev, assume they are in resources/binaries/<platform>/
  const platformDir = platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : 'linux'
  return path.join(app.getAppPath(), 'resources', 'binaries', platformDir, `${name}${ext}`)
}

export const ensureBinariesExist = (): boolean => {
  const ytdlp = getBinaryPath('yt-dlp')
  const ffmpeg = getBinaryPath('ffmpeg')
  
  return fs.existsSync(ytdlp) && fs.existsSync(ffmpeg)
}
