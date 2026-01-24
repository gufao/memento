import { useState, useRef } from 'react'
import { Button } from '@heroui/react'
import { Download, Link as LinkIcon, ArrowRight } from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'

export const UrlInput = () => {
  const { t } = useI18n()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDownload = async () => {
    if (!url) return
    setIsLoading(true)
    try {
      await window.api.download.start(url, {})
      setUrl('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url) {
      handleDownload()
    }
  }

  return (
    <div className="w-full">
      <div
        className={`
          relative bg-white dark:bg-slate-800/80 rounded-2xl
          border-2 transition-all duration-300 ease-out
          shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50
          ${isFocused
            ? 'border-emerald-400 dark:border-emerald-500 glow'
            : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
          }
        `}
      >
        <div className="flex items-center gap-3 p-2 pl-4">
          <LinkIcon className={`w-5 h-5 transition-colors duration-200 flex-shrink-0 ${
            isFocused ? 'text-emerald-500' : 'text-slate-400'
          }`} />

          <input
            ref={inputRef}
            type="url"
            placeholder={t('urlInput.placeholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 py-2"
          />

          <Button
            isLoading={isLoading}
            onPress={handleDownload}
            isDisabled={!url}
            className={`
              px-5 h-10 rounded-xl font-semibold text-sm transition-all duration-200
              ${url
                ? 'animated-gradient text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }
            `}
          >
            {isLoading ? (
              <span>{t('urlInput.fetching')}</span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('urlInput.download')}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:hidden" />
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
        {t('urlInput.helperText')}
      </p>
    </div>
  )
}
