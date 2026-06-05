import { useEffect, useState } from 'react'
import { trackWhatsappLead, trackEvent } from '../lib/analytics'
import { buildLeadWhatsappHref } from '../lib/leadContact'
import { useI18n } from '../i18n/useI18n'

/**
 * Pop-up de promoção do mês de junho.
 * - Aparece após ~2,5s na página.
 * - Mostra os dois planos com preço "de/por".
 * - Cada CTA leva direto ao WhatsApp com mensagem contextual da promoção.
 * - Fica oculto pelo resto da sessão se o visitante fechar (sessionStorage).
 *
 * `source` identifica a página de origem no tracking (ex.: "portfolio", "service_casamento").
 */

const DISMISS_KEY = 'promo_junho_dismissed'
const SHOW_DELAY_MS = 2500

type PromoPlan = {
  key: 'classico' | 'premium'
  name: string
  fromPrice: string
  promoPrice: string
  highlight?: boolean
  whatsappMessage: string
}

function WhatsappIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

function getCopy(locale: string) {
  if (locale === 'en') {
    return {
      badge: 'June offer',
      title: 'Special June pricing',
      subtitle: 'Limited-time discount on our digital invitations. Talk to us on WhatsApp to lock in your price.',
      from: 'was',
      cta: 'Get this price on WhatsApp',
      close: 'Close',
      classicName: 'Classic',
      premiumName: 'Premium',
      mostChosen: 'Most chosen',
      classicMsg: 'Hi! I saw the June offer on Convites Diversos and I want the Classic plan for R$ 50 (was R$ 80). Can you help me?',
      premiumMsg: 'Hi! I saw the June offer on Convites Diversos and I want the Premium plan for R$ 100 (was R$ 130). Can you help me?',
    }
  }
  if (locale === 'es') {
    return {
      badge: 'Oferta de junio',
      title: 'Precios especiales de junio',
      subtitle: 'Descuento por tiempo limitado en nuestras invitaciones digitales. Háblanos por WhatsApp para asegurar tu precio.',
      from: 'antes',
      cta: 'Quiero este precio por WhatsApp',
      close: 'Cerrar',
      classicName: 'Clásico',
      premiumName: 'Premium',
      mostChosen: 'Más elegido',
      classicMsg: '¡Hola! Vi la oferta de junio en Convites Diversos y quiero el plan Clásico por R$ 50 (antes R$ 80). ¿Me ayudas?',
      premiumMsg: '¡Hola! Vi la oferta de junio en Convites Diversos y quiero el plan Premium por R$ 100 (antes R$ 130). ¿Me ayudas?',
    }
  }
  return {
    badge: 'Promoção de junho',
    title: 'Preço especial de junho',
    subtitle: 'Desconto por tempo limitado nos convites digitais. Fale no WhatsApp e garanta o seu valor.',
    from: 'de',
    cta: 'Quero este preço no WhatsApp',
    close: 'Fechar',
    classicName: 'Clássico',
    premiumName: 'Premium',
    mostChosen: 'Mais escolhido',
    classicMsg: 'Olá! Vi a promoção de junho no Convites Diversos e quero o plano Clássico por R$ 50 (de R$ 80). Pode me ajudar?',
    premiumMsg: 'Olá! Vi a promoção de junho no Convites Diversos e quero o plano Premium por R$ 100 (de R$ 130). Pode me ajudar?',
  }
}

type Props = {
  /** Identificador da página de origem para tracking (ex.: "portfolio"). */
  source: string
}

export function PromoPopup({ source }: Props) {
  const { locale } = useI18n()
  const [open, setOpen] = useState(false)
  const copy = getCopy(locale)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === '1') return undefined
    } catch {
      // sessionStorage indisponível (modo restrito) — segue mostrando.
    }
    const timer = window.setTimeout(() => {
      setOpen(true)
      trackEvent('promo_popup_view', { source })
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [source])

  const dismiss = () => {
    setOpen(false)
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignora
    }
  }

  if (!open) return null

  const plans: PromoPlan[] = [
    {
      key: 'classico',
      name: copy.classicName,
      fromPrice: 'R$ 80',
      promoPrice: 'R$ 50',
      whatsappMessage: copy.classicMsg,
    },
    {
      key: 'premium',
      name: copy.premiumName,
      fromPrice: 'R$ 130',
      promoPrice: 'R$ 100',
      highlight: true,
      whatsappMessage: copy.premiumMsg,
    },
  ]

  const handlePlanClick = (plan: PromoPlan, href: string) => {
    trackWhatsappLead(`promo_popup_${source}_${plan.key}`, { destination: href, plan: plan.key })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-950/60 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] bg-[color:var(--color-cream)] shadow-[0_30px_80px_rgba(44,38,34,0.35)] ring-1 ring-stone-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={copy.close}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-600 shadow-sm transition hover:bg-white hover:text-stone-900"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="px-6 pb-6 pt-7 sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-gold)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white">
            {copy.badge}
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-[color:var(--color-ink)] sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-ink-muted)]">{copy.subtitle}</p>

          <div className="mt-5 space-y-3">
            {plans.map((plan) => {
              const href = buildLeadWhatsappHref(plan.whatsappMessage)
              return (
                <div
                  key={plan.key}
                  className={`rounded-2xl border p-4 transition ${
                    plan.highlight
                      ? 'border-[color:var(--color-gold)] bg-white shadow-sm'
                      : 'border-stone-200 bg-white/70'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-muted)]">
                        {plan.name}
                        {plan.highlight ? (
                          <span className="ml-2 rounded-full bg-[color:var(--color-gold)]/15 px-2 py-0.5 text-[0.65rem] font-semibold normal-case tracking-normal text-[color:var(--color-gold)]">
                            {copy.mostChosen}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1">
                        <span className="text-xs text-[color:var(--color-ink-muted)] line-through">
                          {copy.from} {plan.fromPrice}
                        </span>{' '}
                        <span className="font-display text-2xl font-semibold text-[color:var(--color-ink)]">
                          {plan.promoPrice}
                        </span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handlePlanClick(plan, href)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe57]"
                  >
                    <WhatsappIcon />
                    {copy.cta}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
