type AnalyticsParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || ''

let analyticsInitialized = false

function isAnalyticsEnabled() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && Boolean(GA_MEASUREMENT_ID)
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args)
    }
  }
}

function sanitizeParams(params: AnalyticsParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined))
}

export function initAnalytics() {
  if (!isAnalyticsEnabled() || analyticsInitialized) return

  ensureGtag()

  if (!document.head.querySelector(`script[data-ga-id="${GA_MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
    script.dataset.gaId = GA_MEASUREMENT_ID
    document.head.appendChild(script)
  }

  window.gtag?.('js', new Date())
  window.gtag?.('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  })

  analyticsInitialized = true
}

export function trackPageView(path: string, title?: string) {
  if (!isAnalyticsEnabled()) return
  initAnalytics()
  window.gtag?.(
    'event',
    'page_view',
    sanitizeParams({
      page_path: path,
      page_location: window.location.href,
      page_title: title || document.title,
    }),
  )
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!isAnalyticsEnabled()) return
  initAnalytics()
  window.gtag?.('event', name, sanitizeParams(params))
}

export function trackCtaClick(location: string, label: string, destination: string, extra: AnalyticsParams = {}) {
  trackEvent('cta_click', {
    cta_location: location,
    cta_label: label,
    destination,
    ...extra,
  })
}

export function getCurrentPagePath() {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}`
}
