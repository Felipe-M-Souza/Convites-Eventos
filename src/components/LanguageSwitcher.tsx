import { useLocation } from 'react-router-dom'
import { localeLabels, supportedLocales } from '../i18n/locales'
import { useI18n } from '../i18n/useI18n'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const location = useLocation()

  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner')) return null

  return (
    <div className="fixed right-3 top-3 z-[60] rounded-full border border-stone-200/80 bg-white/90 p-1 shadow-lg backdrop-blur">
      <label className="sr-only" htmlFor="language-switcher">
        {t('language.label')}
      </label>
      <select
        id="language-switcher"
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="rounded-full bg-transparent px-3 py-1.5 text-xs font-semibold text-stone-700 outline-none"
        aria-label={t('language.label')}
        title={t('language.label')}
      >
        {supportedLocales.map((item) => (
          <option key={item} value={item}>
            {t(`language.short.${item}`)} - {localeLabels[item]}
          </option>
        ))}
      </select>
    </div>
  )
}
