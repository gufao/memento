import { useState, useEffect } from 'react'
import { UrlInput } from './components/UrlInput'
import { DownloadQueue } from './components/DownloadQueue'
import { Sparkles, Sun, Moon } from 'lucide-react'
import { Button } from '@heroui/react'

function App(): JSX.Element {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative h-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-4 draggable">
        {/* Spacer for centering */}
        <div className="w-8" />

        {/* Logo - centered */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7">
            <svg viewBox="0 0 512 512" fill="none" className="w-full h-full">
              <rect width="512" height="512" rx="96" className="fill-slate-900 dark:fill-slate-800"/>
              <rect x="96" y="72" width="320" height="368" rx="16" className="fill-slate-50"/>
              <rect x="120" y="96" width="272" height="248" rx="8" className="fill-slate-800 dark:fill-slate-700"/>
              <path d="M224 172L304 220L224 268V172Z" className="fill-emerald-500"/>
              <path d="M224 172L264 196L224 220V172Z" className="fill-emerald-400" fillOpacity="0.4"/>
              <line x1="140" y1="380" x2="180" y2="380" className="stroke-slate-200" strokeWidth="2" strokeLinecap="round"/>
              <line x1="200" y1="380" x2="280" y2="380" className="stroke-slate-200" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-slate-800 dark:text-white">
            Memento
          </span>
        </div>

        {/* Theme toggle */}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => setIsDark(!isDark)}
          className="non-draggable w-8 h-8 min-w-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </header>

      {/* Main content */}
      <main className="relative flex-1 overflow-auto">
        <div className="max-w-xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
          {/* Hero section */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Fast & Simple
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Download YouTube Videos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Paste any YouTube link below and save videos to your computer instantly
            </p>
          </div>

          {/* URL Input */}
          <UrlInput />

          {/* Download Queue */}
          <DownloadQueue />
        </div>
      </main>
    </div>
  )
}

export default App
