import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Locale } from '../i18n/translations';

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && (saved === 'en' || saved === 'pt-BR')) return saved;
    
    // Auto-detect browser language
    const browserLang = navigator.language;
    return browserLang.startsWith('pt') ? 'pt-BR' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[locale];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
      current = current[key];
    }
    
    return current as string;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
