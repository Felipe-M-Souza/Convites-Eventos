import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { applySeoMeta } from '../lib/seoMeta'
import { applyStructuredData, clearStructuredData } from '../lib/structuredData'
import { trackCtaClick, trackWhatsappLead } from '../lib/analytics'
import { useI18n } from '../i18n/useI18n'
import { getLocalizedServiceLandingPage } from '../i18n/servicePages'
import { FloatingWhatsappButton } from '../components/FloatingWhatsappButton'
import { PromoPopup } from '../components/PromoPopup'
import { buildLeadMessageForOccasion, buildLeadWhatsappHref } from '../lib/leadContact'

type ServiceOfferPlan = {
  key: 'classico' | 'premium'
  name: string
  fromPrice: string
  promoPrice: string
  highlight?: boolean
  whatsappMessage: string
}

function getServiceOfferCopy(locale: string): {
  eyebrow: string
  title: string
  description: string
  from: string
  cta: string
  mostChosen: string
  plans: ServiceOfferPlan[]
} {
  if (locale === 'en') {
    return {
      eyebrow: 'June offer',
      title: 'Plans with direct WhatsApp service.',
      description: 'See the current promotional prices and start your digital invitation quote with one click.',
      from: 'was',
      cta: 'Request on WhatsApp',
      mostChosen: 'Most chosen',
      plans: [
        {
          key: 'classico',
          name: 'Classic',
          fromPrice: 'R$ 80',
          promoPrice: 'R$ 50',
          whatsappMessage:
            'Hi! I saw the June offer on Convites Diversos and I want the Classic plan for R$ 50 (was R$ 80). Can you help me?',
        },
        {
          key: 'premium',
          name: 'Premium',
          fromPrice: 'R$ 130',
          promoPrice: 'R$ 100',
          highlight: true,
          whatsappMessage:
            'Hi! I saw the June offer on Convites Diversos and I want the Premium plan for R$ 100 (was R$ 130). Can you help me?',
        },
      ],
    }
  }

  if (locale === 'es') {
    return {
      eyebrow: 'Oferta de junio',
      title: 'Planes con atención directa por WhatsApp.',
      description: 'Consulta los valores promocionales actuales e inicia tu presupuesto de invitación digital con un clic.',
      from: 'antes',
      cta: 'Pedir por WhatsApp',
      mostChosen: 'Más elegido',
      plans: [
        {
          key: 'classico',
          name: 'Clásico',
          fromPrice: 'R$ 80',
          promoPrice: 'R$ 50',
          whatsappMessage:
            '¡Hola! Vi la oferta de junio en Convites Diversos y quiero el plan Clásico por R$ 50 (antes R$ 80). ¿Me ayudas?',
        },
        {
          key: 'premium',
          name: 'Premium',
          fromPrice: 'R$ 130',
          promoPrice: 'R$ 100',
          highlight: true,
          whatsappMessage:
            '¡Hola! Vi la oferta de junio en Convites Diversos y quiero el plan Premium por R$ 100 (antes R$ 130). ¿Me ayudas?',
        },
      ],
    }
  }

  return {
    eyebrow: 'Promoção de junho',
    title: 'Planos com atendimento direto no WhatsApp.',
    description: 'Veja os valores promocionais atuais e comece seu orçamento de convite digital em um clique.',
    from: 'de',
    cta: 'Pedir no WhatsApp',
    mostChosen: 'Mais escolhido',
    plans: [
      {
        key: 'classico',
        name: 'Clássico',
        fromPrice: 'R$ 80',
        promoPrice: 'R$ 50',
        whatsappMessage:
          'Olá! Vi a promoção de junho no Convites Diversos e quero o plano Clássico por R$ 50 (de R$ 80). Pode me ajudar?',
      },
      {
        key: 'premium',
        name: 'Premium',
        fromPrice: 'R$ 130',
        promoPrice: 'R$ 100',
        highlight: true,
        whatsappMessage:
          'Olá! Vi a promoção de junho no Convites Diversos e quero o plano Premium por R$ 100 (de R$ 130). Pode me ajudar?',
      },
    ],
  }
}

export function ServiceLandingPage() {
  const { serviceSlug } = useParams()
  const { locale, t } = useI18n()
  const page = serviceSlug ? getLocalizedServiceLandingPage(serviceSlug, locale) : undefined

  useEffect(() => {
    if (!page) return undefined
    const image = `${window.location.origin}/images/hero-couple.jpg`
    const url = window.location.href
    applySeoMeta({
      title: page.title,
      description: page.description,
      image,
      url,
    })

    applyStructuredData(`service-${page.slug}`, {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          name: page.heading,
          serviceType: t('service.why', { occasion: page.occasion }),
          provider: {
            '@type': 'Organization',
            name: 'Convites Diversos',
            url: window.location.origin,
          },
          url,
          description: page.description,
          areaServed: {
            '@type': 'Country',
            name: 'Brasil',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: page.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        },
      ],
    })

    return () => clearStructuredData(`service-${page.slug}`)
  }, [page, t])

  if (!page) return <Navigate to="/modelos" replace />

  const leadMessage = buildLeadMessageForOccasion(page.occasion)
  const leadWhatsHref = buildLeadWhatsappHref(leadMessage)
  const leadSource = `service_landing_${page.slug}`
  const offerCopy = getServiceOfferCopy(locale)
  const langParam = `lang=${encodeURIComponent(locale)}`
  const demoPrimaryHref = `/c/${page.demoSlug}?${langParam}&utm_source=seo_page&utm_medium=cta&utm_campaign=${page.slug}`
  const modelsPrimaryHref = `/modelos?${langParam}&utm_source=seo_page&utm_medium=cta&utm_campaign=modelos_${page.slug}`
  const demoFaqHref = `/c/${page.demoSlug}?${langParam}&utm_source=seo_page&utm_medium=cta&utm_campaign=faq_${page.slug}`
  const modelsFaqHref = `/modelos?${langParam}&utm_source=seo_page&utm_medium=cta&utm_campaign=faq_modelos`

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] px-6 py-14 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--color-ink-muted)]">
          {t('service.eyebrow')}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">{page.heading}</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[color:var(--color-ink-muted)] sm:text-lg">
          {page.intro}
        </p>

        <section className="mt-8 rounded-3xl border border-[color:var(--color-gold-soft)] bg-white/90 p-6 shadow-[0_18px_45px_rgba(44,38,34,0.08)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-gold)]">
                {offerCopy.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{offerCopy.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">
                {offerCopy.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[26rem]">
              {offerCopy.plans.map((plan) => {
                const planHref = buildLeadWhatsappHref(plan.whatsappMessage)
                return (
                  <article
                    key={plan.key}
                    className={`rounded-2xl bg-[color:var(--color-cream)] p-4 ring-1 ${
                      plan.highlight ? 'ring-2 ring-[color:var(--color-gold)]' : 'ring-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-muted)]">
                        {plan.name}
                      </p>
                      {plan.highlight ? (
                        <span className="rounded-full bg-[color:var(--color-gold)]/15 px-2 py-0.5 text-[0.65rem] font-semibold text-[color:var(--color-gold)]">
                          {offerCopy.mostChosen}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="text-xs text-[color:var(--color-ink-muted)] line-through">
                        {offerCopy.from} {plan.fromPrice}
                      </span>
                      <span className="font-display text-3xl font-semibold text-[color:var(--color-ink)]">
                        {plan.promoPrice}
                      </span>
                    </p>
                    <a
                      href={planHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        trackWhatsappLead(`${leadSource}_offer_${plan.key}`, { destination: planHref, plan: plan.key })
                      }
                      className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe57]"
                    >
                      {offerCopy.cta}
                    </a>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <div className="mt-10 rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-semibold">{t('service.why', { occasion: page.occasion })}</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">
            {page.bullets.map((bullet) => (
              <li key={bullet}>- {bullet}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to={demoPrimaryHref}
            onClick={() =>
              trackCtaClick('service_page_primary', 'ver_exemplo_desta_ocasiao', demoPrimaryHref, { service_slug: page.slug })
            }
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            {t('service.viewExample')}
          </Link>
          <Link
            to={modelsPrimaryHref}
            onClick={() =>
              trackCtaClick('service_page_primary', 'explorar_todos_modelos', modelsPrimaryHref, { service_slug: page.slug })
            }
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            {t('service.exploreModels')}
          </Link>
        </div>

        <section className="mt-12 rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
            {t('service.faqEyebrow')}
          </p>
          <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
            {t('service.faqTitle', { occasion: page.occasion })}
          </h2>
          <div className="mt-6 space-y-4">
            {page.faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-2xl border border-stone-200 bg-[color:var(--color-cream)] px-5 py-4 shadow-sm open:bg-white"
              >
                <summary className="cursor-pointer list-none pr-6 font-medium text-[color:var(--color-ink)]">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-[color:var(--color-ink)] px-6 py-8 text-white shadow-[0_20px_60px_rgba(44,38,34,0.16)] sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/60">{t('service.nextStepEyebrow')}</p>
          <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
            {t('service.nextStepTitle')}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            {t('service.nextStepDescription')}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={leadWhatsHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsappLead(`${leadSource}_inline`, { destination: leadWhatsHref })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#1ebe57]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Falar no WhatsApp
            </a>
            <Link
              to={demoFaqHref}
              onClick={() =>
                trackCtaClick('service_page_faq_cta', 'abrir_demonstracao', demoFaqHref, { service_slug: page.slug })
              }
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              {t('service.openDemo')}
            </Link>
            <Link
              to={modelsFaqHref}
              onClick={() =>
                trackCtaClick('service_page_faq_cta', 'ver_mais_modelos', modelsFaqHref, { service_slug: page.slug })
              }
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t('service.viewMoreModels')}
            </Link>
          </div>
        </section>
      </div>
      <FloatingWhatsappButton message={leadMessage} source={`${leadSource}_floating`} />
      <PromoPopup source={`service_${page.slug}`} />
    </div>
  )
}
