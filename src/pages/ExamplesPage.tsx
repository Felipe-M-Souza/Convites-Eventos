import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { demoInvites } from '../data/demoInvites'
import { trackCtaClick } from '../lib/analytics'
import { useI18n } from '../i18n/useI18n'
import { FloatingWhatsappButton } from '../components/FloatingWhatsappButton'

export function ExamplesPage() {
  const { t, locale } = useI18n()

  const seoTitle =
    locale === 'en'
      ? 'Digital Invitation Templates | Convites Diversos'
      : locale === 'es'
        ? 'Modelos de Invitaciones Digitales | Convites Diversos'
        : 'Modelos de Convites Digitais | Convites Diversos'
  const seoDescription =
    locale === 'en'
      ? 'Browse animated digital invitation templates for weddings, birthdays, baby showers and more. Customizable and sent via WhatsApp.'
      : locale === 'es'
        ? 'Explora modelos de invitaciones digitales animadas para bodas, cumpleaños, baby shower y más. Personalizables y enviadas por WhatsApp.'
        : 'Veja modelos de convites digitais animados para casamento, aniversário, chá de bebê e mais. Personalizáveis e enviados pelo WhatsApp.'

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] px-6 py-16 text-[color:var(--color-ink)]">
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href="https://convitesdiversos.com.br/modelos" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content="https://convitesdiversos.com.br/modelos" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
      </Head>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <Link
            to="/"
            className="inline-flex rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            {t('examples.back')}
          </Link>
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--color-ink-muted)]">
            {t('examples.eyebrow')}
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-none sm:text-6xl">
            {t('examples.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--color-ink-muted)] sm:text-lg">
            {t('examples.description')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {demoInvites.map((demo) => (
            <article
              key={demo.slug}
              className="rounded-[1.8rem] border border-stone-200 bg-white/80 p-6 shadow-[0_18px_45px_rgba(44,38,34,0.08)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-gold)]">
                {demo.category}
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold">{demo.title}</h2>
              <p className="mt-4 min-h-20 text-sm leading-7 text-[color:var(--color-ink-muted)]">
                {demo.description}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/c/${demo.slug}`}
                  onClick={() => trackCtaClick('examples_page', 'abrir_modelo', `/c/${demo.slug}`, { demo_slug: demo.slug })}
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  {t('examples.open')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <FloatingWhatsappButton
        message="Olá! Vi a página de modelos de convites e gostaria de saber mais sobre os planos."
        source="modelos_floating"
      />
    </div>
  )
}
