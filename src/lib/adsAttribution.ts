/**
 * Guarda o clique do Google Ads e os ids da sessão GA4 durante a visita.
 * O checkout grava isso em `orders.source_path` para o purchase no servidor
 * entrar na mesma sessão do anúncio (o Measurement Protocol sozinho não herda o gclid).
 */

const STORAGE_KEY = 'cd_ads_click_ids'

export type AdsClickIds = {
  gclid?: string
  gbraid?: string
  wbraid?: string
}

const CLICK_KEYS = ['gclid', 'gbraid', 'wbraid'] as const

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const prefix = `${name}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length))
  }
  return ''
}

function readStoredClickIds(): AdsClickIds {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as AdsClickIds
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function writeStoredClickIds(ids: AdsClickIds) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // sessionStorage indisponível
  }
}

/** `_gcl_aw` no formato `GCL.<timestamp>.<gclid>`, gravado pela tag do Google Ads. */
function readGclidFromCookie(): string {
  const raw = readCookie('_gcl_aw')
  const parts = raw.split('.')
  if (parts.length >= 3 && parts[0] === 'GCL') return parts.slice(2).join('.').slice(0, 200)
  return ''
}

/** Lê o clique da URL (ou do cookie da tag) e mantém na sessão, mesmo depois da navegação interna. */
export function captureAdsClickIds(search: string) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const next: AdsClickIds = { ...readStoredClickIds() }
  let changed = false
  for (const key of CLICK_KEYS) {
    const value = params.get(key)?.trim().slice(0, 200)
    if (value && next[key] !== value) {
      next[key] = value
      changed = true
    }
  }
  if (!next.gclid) {
    const fromCookie = readGclidFromCookie()
    if (fromCookie) {
      next.gclid = fromCookie
      changed = true
    }
  }
  if (changed && (next.gclid || next.gbraid || next.wbraid)) writeStoredClickIds(next)
}

export function readAdsClickIds(): AdsClickIds {
  const stored = readStoredClickIds()
  if (stored.gclid || stored.gbraid || stored.wbraid) return stored
  const fromCookie = readGclidFromCookie()
  return fromCookie ? { gclid: fromCookie } : {}
}

/** `GA1.1.123.456` → `123.456`. */
export function readGaClientId(): string {
  const match = readCookie('_ga').match(/(\d+\.\d+)$/)
  return match?.[1] ?? ''
}

/**
 * Cookie `_ga_<ID>`:
 * - GS1.1.<sessionId>.<count>...
 * - GS2.1.s<sessionId>$o<count>$...
 */
export function readGaSessionId(measurementId: string): string {
  const suffix = measurementId.trim().replace(/^G-/, '')
  if (!suffix) return ''
  const raw = readCookie(`_ga_${suffix}`)
  if (!raw) return ''
  const gs1 = raw.match(/^GS1\.\d+\.(\d+)/)
  if (gs1) return gs1[1]
  const gs2 = raw.match(/(?:^|[.$])s(\d+)/)
  return gs2?.[1] ?? ''
}

export type CheckoutAttribution = {
  gclid?: string
  gbraid?: string
  wbraid?: string
  gaClientId?: string
  gaSessionId?: string
}

export function readCheckoutAttribution(measurementId: string): CheckoutAttribution {
  const clicks = readAdsClickIds()
  const gaClientId = readGaClientId()
  const gaSessionId = readGaSessionId(measurementId)
  return {
    ...(clicks.gclid ? { gclid: clicks.gclid } : {}),
    ...(clicks.gbraid ? { gbraid: clicks.gbraid } : {}),
    ...(clicks.wbraid ? { wbraid: clicks.wbraid } : {}),
    ...(gaClientId ? { gaClientId } : {}),
    ...(gaSessionId ? { gaSessionId } : {}),
  }
}

/** Anexa ids de anúncio e da sessão GA4 na query salva com o pedido. */
export function buildAttributedSourcePath(measurementId: string): string {
  if (typeof window === 'undefined') return '/'
  const url = new URL(`${window.location.pathname}${window.location.search}`, window.location.origin)
  const attribution = readCheckoutAttribution(measurementId)
  if (attribution.gclid) url.searchParams.set('gclid', attribution.gclid)
  if (attribution.gbraid) url.searchParams.set('gbraid', attribution.gbraid)
  if (attribution.wbraid) url.searchParams.set('wbraid', attribution.wbraid)
  if (attribution.gaClientId) url.searchParams.set('ga_cid', attribution.gaClientId)
  if (attribution.gaSessionId) url.searchParams.set('ga_sid', attribution.gaSessionId)
  return `${url.pathname}${url.search}`.slice(0, 900)
}

export function attributionFromSourcePath(sourcePath: string | null | undefined): CheckoutAttribution {
  if (!sourcePath) return {}
  try {
    const url = new URL(sourcePath, 'https://convitesdiversos.com.br')
    const gclid = url.searchParams.get('gclid')?.trim() || ''
    const gbraid = url.searchParams.get('gbraid')?.trim() || ''
    const wbraid = url.searchParams.get('wbraid')?.trim() || ''
    const gaClientId = url.searchParams.get('ga_cid')?.trim() || ''
    const gaSessionId = url.searchParams.get('ga_sid')?.trim() || ''
    return {
      ...(gclid ? { gclid: gclid.slice(0, 200) } : {}),
      ...(gbraid ? { gbraid: gbraid.slice(0, 200) } : {}),
      ...(wbraid ? { wbraid: wbraid.slice(0, 200) } : {}),
      ...(/^\d+\.\d+$/.test(gaClientId) ? { gaClientId } : {}),
      ...(/^\d+$/.test(gaSessionId) ? { gaSessionId } : {}),
    }
  } catch {
    return {}
  }
}
