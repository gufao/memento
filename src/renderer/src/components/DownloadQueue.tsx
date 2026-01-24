import { useEffect, useState } from 'react'
import { Button, Tooltip } from '@heroui/react'
import { FolderOpen, CheckCircle2, Loader2, Video } from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'

interface DownloadItem {
  id: string
  progress: number
  status: 'downloading' | 'completed' | 'error'
  title: string
  url: string
  filePath?: string
}

export const DownloadQueue = () => {
  const { t } = useI18n()
  const [downloads, setDownloads] = useState<DownloadItem[]>([])

  useEffect(() => {
    const unsubProgress = window.api.download.onProgress((data) => {
      setDownloads(prev => {
        const idx = prev.findIndex(d => d.id === data.id)
        if (idx === -1) {
           return [...prev, {
             id: data.id,
             progress: data.progress,
             status: 'downloading',
             title: data.title || t('downloadQueue.fetchingInfo'),
             url: data.url
           }]
        }
        const newArr = [...prev]
        newArr[idx] = {
          ...newArr[idx],
          progress: data.progress,
          title: data.title || newArr[idx].title
        }
        return newArr
      })
    })

    const unsubComplete = window.api.download.onComplete((data) => {
       setDownloads(prev => {
         return prev.map(d => d.id === data.id ? {
           ...d,
           progress: 100,
           status: 'completed',
           filePath: data.filePath
         } : d)
       })
    })

    return () => {
      unsubProgress()
      unsubComplete()
    }
  }, [t])

  if (downloads.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
          <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('downloadQueue.title')}
        </h3>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          ({downloads.length})
        </span>
      </div>

      {/* Download items */}
      <div className="flex flex-col gap-3">
        {downloads.map(item => (
          <div
            key={item.id}
            className={`
              relative bg-white dark:bg-slate-800/80 rounded-xl p-4
              border border-slate-200/80 dark:border-slate-700/80
              shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30
              card-hover overflow-hidden
              ${item.status === 'downloading' ? 'pulse-downloading' : ''}
            `}
          >
            {/* Progress background fill */}
            {item.status === 'downloading' && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            )}

            <div className="relative flex items-center gap-3">
              {/* Icon */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${item.status === 'completed'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                  : 'bg-slate-100 dark:bg-slate-700/50'
                }
              `}>
                {item.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {item.url}
                    </p>
                  </div>

                  {/* Progress or action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === 'downloading' ? (
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.progress}%
                      </span>
                    ) : item.status === 'completed' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('downloadQueue.done')}
                        </span>
                        {item.filePath && (
                          <Tooltip content={t('downloadQueue.showInFolder')} placement="left">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              onPress={() => window.api.download.showInFolder(item.filePath!)}
                              className="bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Progress bar */}
                {item.status === 'downloading' && (
                  <div className="mt-2.5">
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full animated-gradient rounded-full transition-all duration-300 ease-out relative progress-shine"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

