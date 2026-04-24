function normalizeOrigin(value: string | undefined): string {
  const raw = value?.trim()
  if (!raw) return ''
  return raw.replace(/\/+$/, '')
}

export function getSiteOrigin(): string {
  const configured = normalizeOrigin(import.meta.env.VITE_PUBLIC_SITE_URL)
  if (configured) return configured

  if (typeof window !== 'undefined' && window.location.origin) {
    return normalizeOrigin(window.location.origin)
  }

  return 'https://convitesdiversos.com.br'
}

export function buildSiteUrl(pathname = '/'): string {
  const origin = getSiteOrigin()
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${origin}${path}`
}
