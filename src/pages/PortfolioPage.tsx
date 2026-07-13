import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { applySeoMeta } from '../lib/seoMeta'
import { applyStructuredData, clearStructuredData } from '../lib/structuredData'
import { trackCtaClick, trackEvent, trackLeadContact, trackWhatsappLead } from '../lib/analytics'
import { useI18n } from '../i18n/useI18n'
import { getPortfolioContent } from '../i18n/portfolioContent'
import { supabase } from '../lib/supabase'
import { FloatingWhatsappButton } from '../components/FloatingWhatsappButton'
import { PromoPopup } from '../components/PromoPopup'
import { getPromoOffer, PROMO } from '../config/pricing'
import { LEAD_WHATSAPP_E164 } from '../lib/leadContact'

const PORTFOLIO_CONTACT_EMAIL = 'contato@convitesdiversos.com.br'
const PORTFOLIO_CONTACT_WHATSAPP_E164 = LEAD_WHATSAPP_E164
const PORTFOLIO_INSTAGRAM_URL = 'https://www.instagram.com/convitesdiversos.oficial/'

type ApprovedPortfolioTestimonial = {
  id: string
  quote: string
  name: string
  context: string
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function withLocaleParam(path: string, locale: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}lang=${encodeURIComponent(locale)}`
}

export function PortfolioPage() {
  const { locale, t } = useI18n()
  const content = getPortfolioContent(locale)
  const [approvedTestimonials, setApprovedTestimonials] = useState<ApprovedPortfolioTestimonial[]>([])
  const [testimonialName, setTestimonialName] = useState('')
  const [testimonialContext, setTestimonialContext] = useState('')
  const [testimonialMessage, setTestimonialMessage] = useState('')
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false)
  const [testimonialStatus, setTestimonialStatus] = useState<null | { type: 'success' | 'error'; text: string }>(null)
  const portfolioContactMailtoHref = `mailto:${PORTFOLIO_CONTACT_EMAIL}?subject=${encodeURIComponent(content.contactEmailSubject)}&body=${encodeURIComponent(
    content.contactEmailBody,
  )}`
  const portfolioContactWhatsHref = `https://wa.me/${PORTFOLIO_CONTACT_WHATSAPP_E164}?text=${encodeURIComponent(
    content.contactWhatsappMessage,
  )}`
  const visibleTestimonials: ApprovedPortfolioTestimonial[] = approvedTestimonials.length
    ? approvedTestimonials
    : content.testimonials.map((testimonial) => ({
        id: `${testimonial.name}-${testimonial.context}`,
        quote: testimonial.quote,
        name: testimonial.name,
        context: testimonial.context,
      }))

  const offer = getPromoOffer(locale)
  const offerWhatsHref = `https://wa.me/${PORTFOLIO_CONTACT_WHATSAPP_E164}?text=${encodeURIComponent(offer.whatsappMessage)}`

  const scrollToPlans = () => {
    trackCtaClick('portfolio_hero', 'link_secao_planos', '#planos')
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const demoHomeHref = withLocaleParam('/c/default?utm_source=portfolio&utm_medium=cta&utm_campaign=demo_home', locale)
  const modelsHomeHref = withLocaleParam('/modelos?utm_source=portfolio&utm_medium=cta&utm_campaign=modelos_home', locale)
  const demoFooterHref = withLocaleParam('/c/default?utm_source=portfolio&utm_medium=cta&utm_campaign=demo_footer', locale)

  useEffect(() => {
    const siteUrl = window.location.origin
    applySeoMeta({
      title: t('portfolio.seoTitle'),
      description: t('portfolio.seoDescription'),
      image: `${siteUrl}/images/hero-couple.jpg`,
      url: window.location.href,
    })

    applyStructuredData('website-org', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Convites Diversos',
          url: siteUrl,
          logo: `${siteUrl}/images/logo-convitesdiversos-transparent.png`,
          sameAs: [PORTFOLIO_INSTAGRAM_URL],
        },
        {
          '@type': 'WebSite',
          name: 'Convites Diversos',
          url: siteUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/modelos`,
            'query-input': 'required name=ocasião',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: content.faqs.map((faq) => ({
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

    return () => clearStructuredData('website-org')
  }, [content.faqs, t])

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('portfolio_testimonials')
      .select('id, client_name, event_context, message')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setApprovedTestimonials(
          (data ?? []).map((row) => ({
            id: row.id as string,
            quote: row.message as string,
            name: ((row.client_name as string) || '').trim() || 'Cliente Convites Diversos',
            context: ((row.event_context as string) || '').trim() || 'Convite digital personalizado',
          })),
        )
      })
  }, [])

  const handleTestimonialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = testimonialMessage.trim()
    if (message.length < 12) {
      setTestimonialStatus({ type: 'error', text: t('portfolio.testimonialErrorRequired') })
      return
    }

    if (!supabase) {
      setTestimonialStatus({ type: 'error', text: t('portfolio.testimonialErrorUnavailable') })
      return
    }

    setTestimonialSubmitting(true)
    setTestimonialStatus(null)

    try {
      const { error } = await supabase.from('portfolio_testimonials').insert({
        client_name: testimonialName.trim(),
        event_context: testimonialContext.trim(),
        message,
        source_path: `${window.location.pathname}${window.location.search}`,
        status: 'pending',
      })

      if (error) throw new Error(error.message)

      trackEvent('portfolio_testimonial_submitted', {
        source_path: window.location.pathname,
      })
      setTestimonialName('')
      setTestimonialContext('')
      setTestimonialMessage('')
      setTestimonialStatus({ type: 'success', text: t('portfolio.testimonialSuccess') })
    } catch {
      setTestimonialStatus({ type: 'error', text: t('portfolio.testimonialErrorGeneric') })
    } finally {
      setTestimonialSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] text-[color:var(--color-ink)]">
      <section className="px-6 pb-18 pt-16">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <img
              src="/images/logo-convitesdiversos-transparent.png"
              alt={t('portfolio.logoAlt')}
              className="mb-10 h-auto w-full max-w-[560px]"
            />
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--color-ink-muted)]">
              {t('portfolio.heroEyebrow')}
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-none sm:text-6xl">
              {t('portfolio.heroTitle')}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[color:var(--color-ink-muted)] sm:text-lg">
              {t('portfolio.heroDescription')}
            </p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                to={demoHomeHref}
                onClick={() => trackCtaClick('portfolio_hero', 'ver_convite_demonstrativo', demoHomeHref)}
                className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                {t('portfolio.ctaDemo')}
              </Link>
              <Link
                to={modelsHomeHref}
                onClick={() => trackCtaClick('portfolio_hero', 'ver_outros_modelos', modelsHomeHref)}
                className="inline-flex rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                {t('portfolio.ctaModels')}
              </Link>
            </div>
            <p className="mt-6 text-sm">
              <button
                type="button"
                onClick={scrollToPlans}
                className="font-medium text-[color:var(--color-gold)] underline decoration-[color:var(--color-gold-soft)] underline-offset-4 transition hover:decoration-[color:var(--color-gold)]"
              >
                {offer.heroCta}
              </button>
            </p>
            <p className="mt-8 text-sm text-[color:var(--color-ink-muted)]">
              {t('portfolio.heroNote')}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_rgba(44,38,34,0.08)] backdrop-blur">
            <div className="rounded-[1.6rem] bg-[linear-gradient(160deg,rgba(212,188,148,0.24),rgba(255,255,255,0.95))] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
                {t('portfolio.highlightsEyebrow')}
              </p>
              <div className="mt-6 space-y-4">
                {content.highlights.map((item) => (
                  <article key={item.title} className="rounded-[1.3rem] bg-white/90 p-5 shadow-sm">
                    <h2 className="font-display text-2xl font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink-muted)]">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-y border-stone-200/80 bg-white/70 px-6 py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-ink-muted">
              {t('portfolio.portfolioEyebrow')}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              {t('portfolio.portfolioTitle')}
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {content.sections.map((item) => (
              <div
                key={item}
                className="rounded-[1.6rem] border border-stone-200 bg-[color:var(--color-cream)] p-6 shadow-sm"
              >
                <p className="text-sm leading-7 text-[color:var(--color-ink-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-ink-muted">
              {t('portfolio.testimonialsEyebrow')}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              {t('portfolio.testimonialsTitle')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-ink-muted sm:text-base">
              {t('portfolio.testimonialsDescription')}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {visibleTestimonials.map((testimonial) => (
              <figure
                key={testimonial.id}
                className="flex h-full flex-col rounded-[1.6rem] border border-stone-200 bg-white p-6 shadow-sm"
              >
                <blockquote className="flex-1 font-display text-2xl leading-snug text-ink">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-stone-200 pt-4">
                  <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-muted">
                    {testimonial.context}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          <form
            onSubmit={handleTestimonialSubmit}
            className="mt-8 rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <h3 className="font-display text-3xl font-semibold text-ink">{t('portfolio.testimonialFormTitle')}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-muted">{t('portfolio.testimonialFormDescription')}</p>
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-ink">
                    {t('portfolio.testimonialNameLabel')}
                    <input
                      className="mt-2 w-full rounded-2xl border border-stone-200 bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                      value={testimonialName}
                      onChange={(event) => setTestimonialName(event.target.value)}
                      maxLength={120}
                    />
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    {t('portfolio.testimonialContextLabel')}
                    <input
                      className="mt-2 w-full rounded-2xl border border-stone-200 bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                      value={testimonialContext}
                      onChange={(event) => setTestimonialContext(event.target.value)}
                      maxLength={160}
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-ink">
                  {t('portfolio.testimonialMessageLabel')}
                  <textarea
                    className="mt-2 min-h-[132px] w-full resize-y rounded-2xl border border-stone-200 bg-cream px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                    value={testimonialMessage}
                    onChange={(event) => setTestimonialMessage(event.target.value)}
                    maxLength={1200}
                    required
                  />
                </label>
                {testimonialStatus ? (
                  <p className={`text-sm ${testimonialStatus.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {testimonialStatus.text}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={testimonialSubmitting}
                  className="inline-flex rounded-full bg-gold px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {testimonialSubmitting ? t('portfolio.testimonialSubmitting') : t('portfolio.testimonialSubmit')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="px-6 py-18">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
              {t('portfolio.processEyebrow')}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{t('portfolio.processTitle')}</h2>
          </div>
          <div className="space-y-4">
            {content.process.map((item, index) => (
              <div key={item} className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-gold)]">
                  {t('portfolio.step')} {index + 1}
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200/80 bg-white/70 px-6 py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
              {t('portfolio.valueEyebrow')}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              {t('portfolio.valueTitle')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">
              {t('portfolio.valueDescription')}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {content.trustSignals.map((item) => (
              <article key={item.title} className="rounded-[1.6rem] bg-[color:var(--color-cream)] p-6 shadow-sm ring-1 ring-stone-200/70">
                <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200/80 bg-white/70 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
            {t('portfolio.occasionsEyebrow')}
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            {t('portfolio.occasionsTitle')}
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {content.seoOccasions.map((item) => (
              <Link
                key={item.href}
                to={withLocaleParam(item.href, locale)}
                onClick={() => trackCtaClick('portfolio_occasions', item.label, withLocaleParam(item.href, locale))}
                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="border-y border-stone-200/80 bg-[color:var(--color-cream)] px-6 py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
              {offer.sectionEyebrow}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{offer.sectionTitle}</h2>
            <p className="mt-5 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">
              {offer.sectionDescription}
            </p>
          </div>

          <div className="mt-10 max-w-xl">
            <article className="flex flex-col rounded-[1.6rem] bg-white p-6 shadow-sm ring-2 ring-[color:var(--color-gold)]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--color-ink-muted)]">
                  {offer.name}
                </p>
                <span className="rounded-full bg-[color:var(--color-gold)]/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-[color:var(--color-gold)]">
                  {offer.validUntilLabel}
                </span>
              </div>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-base font-medium text-[color:var(--color-ink-muted)] line-through">
                  {offer.fromLabel} {offer.price}
                </span>
                <span className="font-display text-4xl font-semibold text-[color:var(--color-ink)]">
                  {offer.promoPrice}
                </span>
              </p>
              <p className="mt-4 text-sm leading-7 text-[color:var(--color-ink-muted)]">{offer.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-[color:var(--color-ink)]">
                {offer.items.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
              <a
                href={offerWhatsHref}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackWhatsappLead(`portfolio_plan_${PROMO.planKey}`, {
                    destination: offerWhatsHref,
                    plan: PROMO.planKey,
                  })
                }
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe57]"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                {offer.cta}
              </a>
            </article>
          </div>
        </div>
      </section>

      <section id="contato" className="border-t border-stone-200/80 bg-[color:var(--color-blush)]/60 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">{t('portfolio.contactEyebrow')}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-[color:var(--color-ink)] sm:text-4xl">
            {t('portfolio.contactTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-ink-muted)] sm:text-base">
            {t('portfolio.contactDescription')}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <a
              href={portfolioContactMailtoHref}
              onClick={() => {
                trackCtaClick('portfolio_contact', 'email_orcamento', portfolioContactMailtoHref)
                trackLeadContact('portfolio_contact_section', 'email', {
                  destination: portfolioContactMailtoHref,
                })
              }}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
            >
              {t('portfolio.emailButton')}
            </a>
            <a
              href={portfolioContactWhatsHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackCtaClick('portfolio_contact', 'whatsapp_orcamento', portfolioContactWhatsHref)
                trackWhatsappLead('portfolio_contact_section', { destination: portfolioContactWhatsHref })
              }}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              {t('portfolio.whatsappButton')}
            </a>
            <a
              href={PORTFOLIO_INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackCtaClick('portfolio_contact', 'instagram_follow', PORTFOLIO_INSTAGRAM_URL)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--color-gold-soft)] bg-white px-7 py-3 text-sm font-semibold text-[color:var(--color-ink)] shadow-sm transition hover:border-[color:var(--color-gold)] hover:bg-stone-50"
            >
              <InstagramIcon />
              {t('portfolio.instagramButton')}
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-18">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
            {t('portfolio.faqEyebrow')}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            {t('portfolio.faqTitle')}
          </h2>
          <div className="mt-8 space-y-4">
            {content.faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-[1.4rem] border border-stone-200 bg-[color:var(--color-cream)] px-5 py-4 shadow-sm open:bg-white"
              >
                <summary className="cursor-pointer list-none pr-6 font-medium text-[color:var(--color-ink)]">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-18">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-[color:var(--color-ink)] px-8 py-12 text-center text-white shadow-[0_25px_80px_rgba(44,38,34,0.18)] sm:px-12">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/70">{t('portfolio.demoEyebrow')}</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            {t('portfolio.demoTitle')}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            {t('portfolio.demoDescription')}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to={demoFooterHref}
              onClick={() => trackCtaClick('portfolio_footer', 'abrir_demonstracao', demoFooterHref)}
              className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              {t('portfolio.demoButton')}
            </Link>
          </div>
        </div>
      </section>
      <FloatingWhatsappButton
        message={content.contactWhatsappMessage}
        source="portfolio_floating"
      />
      <PromoPopup source="portfolio" />
    </div>
  )
}
