import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { trackCtaClick, trackWhatsappLead } from '../lib/analytics'
import { applySeoMeta } from '../lib/seoMeta'
import { useI18n } from '../i18n/useI18n'
import { FloatingWhatsappButton } from '../components/FloatingWhatsappButton'
import { PromoPopup } from '../components/PromoPopup'
import { getPromoOffer } from '../config/pricing'
import { buildLeadWhatsappHref } from '../lib/leadContact'
import { getLocalizedCatalogItem, occasionCatalog } from '../data/occasionCatalog'

export function ExamplesPage() {
  const { locale, t } = useI18n()
  const langParam = `lang=${encodeURIComponent(locale)}`
  const offer = getPromoOffer(locale)
  const items = occasionCatalog.map((item) => getLocalizedCatalogItem(item, locale))

  const seoTitle =
    locale === 'en'
      ? 'Digital Invitation Types | Convites Diversos'
      : locale === 'es'
        ? 'Tipos de Invitaciones Digitales | Convites Diversos'
        : 'Tipos de Convites Digitais | Convites Diversos'
  const seoDescription =
    locale === 'en'
      ? 'See the types of digital invitations we create for weddings, birthdays, baby showers and more. Personalized and shared via WhatsApp.'
      : locale === 'es'
        ? 'Conoce los tipos de invitaciones digitales que creamos para bodas, cumpleaños, baby shower y más. Personalizadas y compartidas por WhatsApp.'
        : 'Veja os tipos de convites digitais que criamos para casamento, aniversário, chá de bebê e mais. Personalizados e enviados pelo WhatsApp.'

  const liveDemoHref = `/c/default?${langParam}&utm_source=modelos&utm_medium=cta&utm_campaign=demo_viva`
  const offerHref = buildLeadWhatsappHref(offer.whatsappMessage)
  const floatingMessage =
    locale === 'en'
      ? 'Hi! I saw the invitation types page on Convites Diversos and would like to know more about the R$ 50 offer.'
      : locale === 'es'
        ? '¡Hola! Vi la página de tipos de invitación en Convites Diversos y me gustaría saber más sobre la oferta de R$ 50.'
        : 'Olá! Vi a página de tipos de convite no Convites Diversos e gostaria de saber mais sobre a oferta de R$ 50,00.'

  useEffect(() => {
    applySeoMeta({
      title: seoTitle,
      description: seoDescription,
      image: `${window.location.origin}/images/logo-convitesdiversos.png`,
      url: `${window.location.origin}/modelos`,
    })
  }, [seoTitle, seoDescription])

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] px-6 py-16 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <Link
            to={`/?${langParam}`}
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={liveDemoHref}
              onClick={() => trackCtaClick('examples_page', 'ver_demonstracao_viva', liveDemoHref)}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              {t('examples.liveDemo')}
            </Link>
            <a
              href={offerHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsappLead('examples_page_offer', { destination: offerHref, plan: 'unico' })}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              {offer.cta}
            </a>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const serviceHref = item.serviceSlug
              ? `/convite-digital/${item.serviceSlug}?${langParam}&utm_source=modelos&utm_medium=card&utm_campaign=${item.id}`
              : null
            const whatsappMessage =
              locale === 'en'
                ? `Hi! I saw the ${item.title} invitation type on Convites Diversos and would like a quote for the R$ 50 offer.`
                : locale === 'es'
                  ? `¡Hola! Vi el tipo de invitación de ${item.title} en Convites Diversos y me gustaría un presupuesto con la oferta de R$ 50.`
                  : `Olá! Vi o tipo de convite de ${item.title} no Convites Diversos e gostaria de um orçamento na oferta de R$ 50,00.`
            const whatsappHref = buildLeadWhatsappHref(whatsappMessage)

            return (
              <article
                key={item.id}
                className="flex flex-col rounded-[1.8rem] border border-stone-200 bg-white/80 p-6 shadow-[0_18px_45px_rgba(44,38,34,0.08)]"
              >
                <div
                  className="h-1.5 w-16 rounded-full"
                  style={{ backgroundColor: item.accent }}
                  aria-hidden="true"
                />
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-gold)]">
                  {t('examples.cardEyebrow')}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold">{item.title}</h2>
                <p className="mt-4 flex-1 text-sm leading-7 text-[color:var(--color-ink-muted)]">{item.summary}</p>
                <ul className="mt-5 space-y-2 text-sm text-[color:var(--color-ink)]">
                  {item.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-gold)]" aria-hidden="true" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      trackWhatsappLead(`examples_card_${item.id}`, {
                        destination: whatsappHref,
                        occasion: item.id,
                      })
                    }
                    className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
                  >
                    {t('examples.whatsappCta')}
                  </a>
                  {serviceHref ? (
                    <Link
                      to={serviceHref}
                      onClick={() =>
                        trackCtaClick('examples_page', 'saber_mais_ocasiao', serviceHref, { occasion: item.id })
                      }
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                    >
                      {t('examples.learnMore')}
                    </Link>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>

        <section className="mt-14 rounded-[2rem] bg-[color:var(--color-ink)] px-8 py-10 text-white shadow-[0_25px_80px_rgba(44,38,34,0.18)] sm:px-12">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/70">{t('examples.footerEyebrow')}</p>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">{t('examples.footerTitle')}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">{t('examples.footerDescription')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={offerHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsappLead('examples_footer_offer', { destination: offerHref, plan: 'unico' })}
              className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
            >
              {offer.cta}
            </a>
            <Link
              to={liveDemoHref}
              onClick={() => trackCtaClick('examples_page', 'footer_demo_viva', liveDemoHref)}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-7 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {t('examples.liveDemo')}
            </Link>
          </div>
        </section>
      </div>
      <FloatingWhatsappButton message={floatingMessage} source="modelos_floating" />
      <PromoPopup source="modelos" />
    </div>
  )
}
