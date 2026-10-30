import { Link } from 'react-router-dom'
import { weddingModels, weddingShowcaseCopy } from '../data/weddingModels'
import { trackCtaClick, trackWhatsappLead } from '../lib/analytics'
import { buildLeadWhatsappHref } from '../lib/leadContact'
import { useI18n } from '../i18n/useI18n'

type Props = {
  /** Origem do clique, usada na medição (ex.: portfolio_home). */
  source: string
  /** Dentro de uma página que já tem largura limitada, os cartões ficam em duas colunas. */
  compact?: boolean
}

function withLocaleParam(path: string, locale: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}lang=${encodeURIComponent(locale)}`
}

export function WeddingModelShowcase({ source, compact = false }: Props) {
  const { locale } = useI18n()
  const copy = weddingShowcaseCopy[locale]

  return (
    <section aria-labelledby={`${source}-wedding-models`}>
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
          {copy.eyebrow}
        </p>
        <h2 id={`${source}-wedding-models`} className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          {copy.title}
        </h2>
        <p className="mt-5 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">{copy.description}</p>
      </div>

      <div className={`mt-10 grid gap-5 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {weddingModels.map((model) => {
          const title = model.title[locale]
          const demoHref = withLocaleParam(
            `/c/${model.slug}?utm_source=${encodeURIComponent(source)}&utm_medium=card&utm_campaign=${model.id}`,
            locale,
          )
          const whatsappHref = buildLeadWhatsappHref(copy.whatsappMessage(title))

          return (
            <article
              key={model.id}
              className="flex flex-col rounded-[1.6rem] border border-stone-200 bg-white/80 p-6 shadow-[0_18px_45px_rgba(44,38,34,0.08)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-gold)]">
                {copy.cardEyebrow}
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold">{title}</h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-[color:var(--color-ink-muted)]">{model.line[locale]}</p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to={demoHref}
                  onClick={() => trackCtaClick(source, 'ver_modelo_casamento', demoHref, { model: model.id })}
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  {copy.open}
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    trackWhatsappLead(`${source}_${model.id}`, {
                      destination: whatsappHref,
                      model: model.id,
                    })
                  }
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                >
                  {copy.whatsapp}
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
