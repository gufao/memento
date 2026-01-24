import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { I18nProvider } from './contexts/I18nContext'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HeroUIProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </HeroUIProvider>
  </React.StrictMode>
)
