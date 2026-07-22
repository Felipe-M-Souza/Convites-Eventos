type AnalyticsParams = Record<string, string | number | boolean | undefined | AnalyticsParams[] | Record<string, string | number | boolean | undefined>[]>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || ''
/** ID da conta/tag Google Ads (formato AW-xxxxxxxxxx). Ativa remarketing e base para conversões. */
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID?.trim() || ''
/**
 * Conversão «pedido de orçamento / contacto» — valor completo dado pelo Google Ads ao criar a ação:
 * ex. AW-123456789/AbC_dEfGhIjKlMnOp
 */
const GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO =
  import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO?.trim() || ''
const GOOGLE_ADS_CONVERSION_CONTACT_EVENT_NAME =
  import.meta.env.VITE_GOOGLE_ADS_CONVERSION_CONTACT_EVENT_NAME?.trim() || 'conversion_event_contact'

let analyticsInitialized = false

/** AW-… extraído de `VITE_GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO` quando não há `VITE_GOOGLE_ADS_ID`. */
function googleAdsTagIdFromOrcamentoSendTo(): string {
  const st = GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO
  if (!st.includes('/')) return ''
  const base = st.split('/')[0]?.trim() ?? ''
  return base.startsWith('AW-') ? base : ''
}

/** ID usado no URL `gtag/js?id=…` (prioridade: GA4, depois tag Ads, depois prefixo da conversão). */
function getGtagBootstrapScriptId(): string {
  return GA_MEASUREMENT_ID || GOOGLE_ADS_ID || googleAdsTagIdFromOrcamentoSendTo()
}

/** GA4 e/ou Google Ads: carrega gtag quando há GA, tag Ads ou conversão com prefixo AW-. */
function isGtagScriptEnabled() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && Boolean(getGtagBootstrapScriptId())
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    // O gtag oficial empilha o objeto `arguments`; usar array pode impedir
    // o parser interno de processar corretamente os comandos e enviar hits.
    window.gtag = function gtagShim() {
      window.dataLayer?.push(arguments as unknown)
    }
  }
}

function sanitizeParams(params: AnalyticsParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined))
}

export function initAnalytics() {
  if (!isGtagScriptEnabled() || analyticsInitialized) return

  ensureGtag()

  const scriptId = getGtagBootstrapScriptId()
  if (!document.head.querySelector(`script[data-gtag-id="${scriptId}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(scriptId)}`
    script.dataset.gtagId = scriptId
    document.head.appendChild(script)
  }

  window.gtag?.('js', new Date())

  if (GA_MEASUREMENT_ID) {
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      anonymize_ip: true,
    })
  }

  const adsConfigId = GOOGLE_ADS_ID || googleAdsTagIdFromOrcamentoSendTo()
  if (adsConfigId && adsConfigId !== GA_MEASUREMENT_ID) {
    window.gtag?.('config', adsConfigId)
  }

  analyticsInitialized = true
}

export function trackPageView(path: string, title?: string) {
  if (!GA_MEASUREMENT_ID) return
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
  if (!GA_MEASUREMENT_ID) return
  initAnalytics()
  window.gtag?.('event', name, sanitizeParams(params))
}

/**
 * Compra GA4 (ecommerce). Inclui `items` e `send_to` para o hit chegar no property certo.
 * Deduplica por `transaction_id` na sessão (evita double-fire em remount).
 */
export function trackPurchase(input: {
  transactionId: string
  value: number
  currency?: string
  planKey?: string
  extra?: AnalyticsParams
}) {
  if (!GA_MEASUREMENT_ID) return
  const transactionId = input.transactionId.trim()
  if (!transactionId) return

  const storageKey = `ga4_purchase_${transactionId}`
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey) === '1') return
  } catch {
    // sessionStorage indisponível
  }

  initAnalytics()
  const currency = (input.currency || 'BRL').toUpperCase()
  const planKey = input.planKey || 'unico'
  const payload = sanitizeParams({
    send_to: GA_MEASUREMENT_ID,
    transaction_id: transactionId,
    value: input.value,
    currency,
    items: [
      {
        item_id: planKey,
        item_name: 'Convite digital',
        item_category: 'convite',
        price: input.value,
        quantity: 1,
      },
    ],
    ...input.extra,
  })

  window.gtag?.('event', 'purchase', payload)

  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(storageKey, '1')
  } catch {
    // ignora
  }
}

type GoogleAdsConversionParams = {
  /** Ex.: AW-123456789/Label_da_conversao (copiar do Google Ads) */
  send_to?: string
  /** Ex.: conversion_event_contact (formato novo de evento criado pelo Google Ads) */
  event_name?: string
  value?: number
  currency?: string
}

/**
 * Regista uma conversão Google Ads (ex.: clique em orçamento).
 * Define `VITE_GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO` ou passe `send_to` completo.
 */
export function trackGoogleAdsConversion(params: GoogleAdsConversionParams = {}) {
  const send_to = params.send_to?.trim() || GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO
  const eventName = params.event_name?.trim() || GOOGLE_ADS_CONVERSION_CONTACT_EVENT_NAME
  if (!send_to && !eventName) return
  initAnalytics()

  if (!send_to) {
    window.gtag?.(
      'event',
      eventName,
      sanitizeParams({
        ...(params.value != null
          ? { value: params.value, currency: params.currency?.trim() || 'BRL' }
          : {}),
      }),
    )
    return
  }

  window.gtag?.(
    'event',
    'conversion',
    sanitizeParams({
      send_to,
      ...(params.value != null
        ? { value: params.value, currency: params.currency?.trim() || 'BRL' }
        : {}),
    }),
  )
}

export function trackCtaClick(location: string, label: string, destination: string, extra: AnalyticsParams = {}) {
  trackEvent('cta_click', {
    cta_location: location,
    cta_label: label,
    destination,
    ...extra,
  })
}

export type LeadContactMethod = 'whatsapp' | 'email'

/**
 * Lead comercial unificado para importação GA4 → Google Ads.
 * Dispara `generate_lead` (padrão GA4) em email e WhatsApp; no WhatsApp também envia
 * `clique_whatsapp`. Por fim, dispara o evento Ads configurado em env (ex.: conversion_event_contact).
 */
export function trackLeadContact(source: string, method: LeadContactMethod, extra: AnalyticsParams = {}) {
  initAnalytics()
  if (!window.gtag) return

  const common = sanitizeParams({
    source,
    lead_method: method,
    page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...extra,
  })

  window.gtag('event', 'generate_lead', { ...common, currency: 'BRL' })

  if (method === 'whatsapp') {
    window.gtag('event', 'clique_whatsapp', common)
  }

  trackGoogleAdsConversion()
}

/**
 * Dispara eventos de lead para botões de WhatsApp comerciais (NÃO em RSVP de convidados).
 */
export function trackWhatsappLead(source: string, extra: AnalyticsParams = {}) {
  trackLeadContact(source, 'whatsapp', extra)
}

export function getCurrentPagePath() {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}`
}
