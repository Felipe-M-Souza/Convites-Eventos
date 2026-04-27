import { createContext } from 'react'
import type { Locale, TranslationKey } from './locales'

export type TranslateOptions = Record<string, string | number>

export type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, options?: TranslateOptions) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
