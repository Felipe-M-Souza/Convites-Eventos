import { useEffect, useState } from 'react'
import { trackWhatsappLead, trackEvent } from '../lib/analytics'
import { buildLeadWhatsappHref } from '../lib/leadContact'
import { useI18n } from '../i18n/useI18n'
import { getPromoOffer, isPromoActive, PROMO } from '../config/pricing'
import { PayCheckoutButton } from './PayCheckoutButton'

/**
 * Pop-up da oferta de valor único.
 * - Aparece após ~2,5s na página (somente enquanto a promo estiver vigente).
 * - Mostra o preço único com validade até 15/08.
 * - CTA leva direto ao WhatsApp com mensagem contextual da promoção.
 * - Fica oculto pelo resto da sessão se o visitante fechar (sessionStorage).
 *
 * `source` identifica a página de origem no tracking (ex.: "portfolio", "service_casamento").
 */

const SHOW_DELAY_MS = 2500

function WhatsappIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

type Props = {
  /** Identificador da página de origem para tracking (ex.: "portfolio"). */
  source: string
}

export function PromoPopup({ source }: Props) {
  const { locale } = useI18n()
  const [open, setOpen] = useState(false)
  const offer = getPromoOffer(locale)
  const closeLabel = locale === 'en' ? 'Close' : locale === 'es' ? 'Cerrar' : 'Fechar'

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!isPromoActive()) return undefined
    try {
      if (window.sessionStorage.getItem(PROMO.dismissStorageKey) === '1') return undefined
    } catch {
      // sessionStorage indisponível (modo restrito) — segue mostrando.
    }
    const timer = window.setTimeout(() => {
      setOpen(true)
      trackEvent('promo_popup_view', { source, plan: PROMO.planKey })
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [source])

  const dismiss = () => {
    setOpen(false)
    try {
      window.sessionStorage.setItem(PROMO.dismissStorageKey, '1')
    } catch {
      // ignora
    }
  }

  if (!open) return null

  const href = buildLeadWhatsappHref(offer.whatsappMessage)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-950/60 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] bg-[color:var(--color-cream)] shadow-[0_30px_80px_rgba(44,38,34,0.35)] ring-1 ring-stone-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={closeLabel}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-600 shadow-sm transition hover:bg-white hover:text-stone-900"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="px-6 pb-6 pt-7 sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-gold)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white">
            {offer.badge}
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-[color:var(--color-ink)] sm:text-3xl">
            {offer.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-ink-muted)]">{offer.subtitle}</p>

          <div className="mt-5 rounded-2xl border border-[color:var(--color-gold)] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-muted)]">
              {offer.name}
            </p>
            <p className="mt-1">
              <span className="text-xs text-[color:var(--color-ink-muted)] line-through">
                {offer.fromLabel} {offer.price}
              </span>{' '}
              <span className="font-display text-3xl font-semibold text-[color:var(--color-ink)]">
                {offer.promoPrice}
              </span>
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-gold)]">
              {offer.validUntilLabel}
            </p>
            <div className="mt-3 space-y-2">
              <PayCheckoutButton
                source={`promo_popup_${source}_${PROMO.planKey}`}
                label={offer.payCta}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
              />
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackWhatsappLead(`promo_popup_${source}_${PROMO.planKey}`, {
                    destination: href,
                    plan: PROMO.planKey,
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                <WhatsappIcon />
                {offer.cta}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
