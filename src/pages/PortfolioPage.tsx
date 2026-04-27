import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applySeoMeta } from '../lib/seoMeta'
import { applyStructuredData, clearStructuredData } from '../lib/structuredData'
import { trackCtaClick, trackGoogleAdsConversion } from '../lib/analytics'
import { useI18n } from '../i18n/useI18n'
import { getPortfolioContent } from '../i18n/portfolioContent'

const PORTFOLIO_CONTACT_EMAIL = 'contato@convitesdiversos.com.br'
/** (11) 96581-4224 — wa.me sem espaços ou símbolos */
const PORTFOLIO_CONTACT_WHATSAPP_E164 = '5511965814224'

export function PortfolioPage() {
  const { locale, t } = useI18n()
  const content = getPortfolioContent(locale)
  const portfolioContactMailtoHref = `mailto:${PORTFOLIO_CONTACT_EMAIL}?subject=${encodeURIComponent(content.contactEmailSubject)}&body=${encodeURIComponent(
    content.contactEmailBody,
  )}`
  const portfolioContactWhatsHref = `https://wa.me/${PORTFOLIO_CONTACT_WHATSAPP_E164}?text=${encodeURIComponent(
    content.contactWhatsappMessage,
  )}`

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
          sameAs: [],
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
                to="/c/default?utm_source=portfolio&utm_medium=cta&utm_campaign=demo_home"
                onClick={() => trackCtaClick('portfolio_hero', 'ver_convite_demonstrativo', '/c/default')}
                className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                {t('portfolio.ctaDemo')}
              </Link>
              <Link
                to="/modelos?utm_source=portfolio&utm_medium=cta&utm_campaign=modelos_home"
                onClick={() => trackCtaClick('portfolio_hero', 'ver_outros_modelos', '/modelos')}
                className="inline-flex rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                {t('portfolio.ctaModels')}
              </Link>
            </div>
            <p className="mt-6 text-sm">
              <Link
                to="#contato"
                onClick={() => trackCtaClick('portfolio_hero', 'link_secao_contato', '#contato')}
                className="font-medium text-[color:var(--color-gold)] underline decoration-[color:var(--color-gold-soft)] underline-offset-4 transition hover:decoration-[color:var(--color-gold)]"
              >
                {t('portfolio.ctaBudget')}
              </Link>
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
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
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
                to={item.href}
                onClick={() => trackCtaClick('portfolio_occasions', item.label, item.href)}
                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
              >
                {item.label}
              </Link>
            ))}
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
                trackGoogleAdsConversion()
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
                trackGoogleAdsConversion()
              }}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              {t('portfolio.whatsappButton')}
            </a>
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
              to="/c/default?utm_source=portfolio&utm_medium=cta&utm_campaign=demo_footer"
              onClick={() => trackCtaClick('portfolio_footer', 'abrir_demonstracao', '/c/default')}
              className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              {t('portfolio.demoButton')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
