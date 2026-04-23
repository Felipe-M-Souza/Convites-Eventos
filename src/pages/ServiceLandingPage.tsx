import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { applySeoMeta } from '../lib/seoMeta'
import { serviceLandingPagesBySlug } from '../data/serviceLandingPages'
import { applyStructuredData, clearStructuredData } from '../lib/structuredData'
import { trackCtaClick } from '../lib/analytics'

export function ServiceLandingPage() {
  const { serviceSlug } = useParams()
  const page = serviceSlug ? serviceLandingPagesBySlug[serviceSlug] : undefined

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
          serviceType: `Convite digital para ${page.occasion}`,
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
  }, [page])

  if (!page) return <Navigate to="/modelos" replace />

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] px-6 py-14 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--color-ink-muted)]">
          Convites digitais personalizados
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">{page.heading}</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[color:var(--color-ink-muted)] sm:text-lg">
          {page.intro}
        </p>

        <div className="mt-10 rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Por que escolher convite digital para {page.occasion}?</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">
            {page.bullets.map((bullet) => (
              <li key={bullet}>- {bullet}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/c/${page.demoSlug}?utm_source=seo_page&utm_medium=cta&utm_campaign=${page.slug}`}
            onClick={() => trackCtaClick('service_page_primary', 'ver_exemplo_desta_ocasiao', `/c/${page.demoSlug}`, { service_slug: page.slug })}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Ver exemplo desta ocasião
          </Link>
          <Link
            to={`/modelos?utm_source=seo_page&utm_medium=cta&utm_campaign=modelos_${page.slug}`}
            onClick={() => trackCtaClick('service_page_primary', 'explorar_todos_modelos', '/modelos', { service_slug: page.slug })}
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            Explorar todos os modelos
          </Link>
        </div>

        <section className="mt-12 rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
            Perguntas frequentes
          </p>
          <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
            Dúvidas comuns sobre convite digital para {page.occasion}
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
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/60">Próximo passo</p>
          <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
            Veja um modelo real e entenda a experiência completa do convite.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            A demonstração ajuda a visualizar abertura animada, contagem regressiva, fotos, música, mapa e navegação no formato final.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to={`/c/${page.demoSlug}?utm_source=seo_page&utm_medium=cta&utm_campaign=faq_${page.slug}`}
              onClick={() => trackCtaClick('service_page_faq_cta', 'abrir_demonstracao', `/c/${page.demoSlug}`, { service_slug: page.slug })}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Abrir demonstração
            </Link>
            <Link
              to="/modelos?utm_source=seo_page&utm_medium=cta&utm_campaign=faq_modelos"
              onClick={() => trackCtaClick('service_page_faq_cta', 'ver_mais_modelos', '/modelos', { service_slug: page.slug })}
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver mais modelos
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
