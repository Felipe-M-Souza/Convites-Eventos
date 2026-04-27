import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectInitialLocale, type Locale, translations, type TranslationKey } from './locales'
import { I18nContext, type TranslateOptions } from './i18nContext'

type Props = {
  children: ReactNode
}

function interpolate(text: string, options: TranslateOptions = {}) {
  return Object.entries(options).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    text,
  )
}

export function I18nProvider({ children }: Props) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale())

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    window.localStorage.setItem('convitesdiversos.locale', nextLocale)
    document.documentElement.lang = nextLocale
  }, [])

  const t = useCallback(
    (key: TranslationKey, options?: TranslateOptions) => {
      const text = translations[locale][key] ?? translations['pt-BR'][key] ?? key
      return interpolate(text, options)
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
