import { spawn } from 'child_process'
import path from 'path'
import { app } from 'electron'
import { getBinaryPath } from '../utils/binary'

export interface DownloadOptions {
  format?: string
  output?: string
}

export class YtDlpService {
  private binaryPath: string

  constructor() {
    this.binaryPath = getBinaryPath('yt-dlp')
  }

  async getInfo(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.binaryPath, ['--dump-json', url])
      let data = ''
      let error = ''

      process.stdout.on('data', (chunk) => {
        data += chunk
      })

      process.stderr.on('data', (chunk) => {
        error += chunk
      })

      process.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(new Error('Failed to parse video info'))
          }
        } else {
          reject(new Error(error || 'Failed to get video info'))
        }
      })
    })
  }

  download(url: string, options: DownloadOptions, onProgress: (progress: number, title?: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const downloadsPath = app.getPath('downloads')
      const template = path.join(downloadsPath, '%(title)s.%(ext)s')
      
      const args = [
        url,
        '-f', options.format || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '-o', template,
        '--newline' // Important for parsing progress
      ]
      
      // Add ffmpeg location if needed by yt-dlp (it usually auto-detects if in same dir, but being explicit helps)
      const ffmpegPath = getBinaryPath('ffmpeg')
      if (ffmpegPath) {
        args.push('--ffmpeg-location', path.dirname(ffmpegPath))
      }

      console.log('Spawning yt-dlp:', this.binaryPath, args.join(' '))

      const process = spawn(this.binaryPath, args)
      let outputFilename = ''
      let videoTitle = ''

      process.stdout.on('data', (chunk) => {
        const lines = chunk.toString().split('\n')
        for (const line of lines) {
          // Capture Title
          if (line.includes('[download] Destination:')) {
            const fileName = path.basename(line.split(': ')[1])
            videoTitle = fileName.substring(0, fileName.lastIndexOf('.'))
          }
          
          // Parse progress
          if (line.includes('[download]') && line.includes('%')) {
            const match = line.match(/(\d+\.?\d*)%/)
            if (match) {
              const percentage = parseFloat(match[1])
              onProgress(percentage, videoTitle)
            }
          }
          // Capture filename
          if (line.includes('[Merger] Merging formats into')) {
             const parts = line.split('into ')
             if (parts.length > 1) {
                let candidate = parts[1].trim()
                if (candidate.startsWith('"') && candidate.endsWith('"')) {
                  candidate = candidate.slice(1, -1)
                }
                outputFilename = candidate
                console.log('Captured MERGED filename:', outputFilename)
             }
          } else if (line.includes('[download] Destination:')) {
             const parts = line.split(': ')
             if (parts.length > 1) {
                let candidate = parts[1].trim()
                // Remove potential surrounding quotes "path"
                if (candidate.startsWith('"') && candidate.endsWith('"')) {
                  candidate = candidate.slice(1, -1)
                }
                outputFilename = candidate
                console.log('Captured output filename:', outputFilename)
             }
          }
          // Fallback filename capture for "Already downloaded"
          if (line.includes('has already been downloaded')) {
             const parts = line.split('] ')
             if (parts.length > 1) outputFilename = parts[1].split(' has')[0].trim()
             onProgress(100, videoTitle)
          }
        }
      })


      process.stderr.on('data', (data) => {
        console.error('yt-dlp stderr:', data.toString())
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve(outputFilename || 'Download complete')
        } else {
          reject(new Error(`Process exited with code ${code}`))
        }
      })
    })
  }
}
