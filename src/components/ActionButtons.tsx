import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'
import { buildRsvpWhatsappHref } from '../lib/whatsappLink'
import { getCurrentPagePath, trackEvent } from '../lib/analytics'
import { useI18n } from '../i18n/useI18n'

type Props = {
  data: EventData
}

const btn =
  'inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--color-gold)]/40 bg-white px-6 py-3.5 text-sm font-medium text-[color:var(--color-ink)] shadow-sm transition hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-blush)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-gold)] sm:w-auto sm:min-w-[220px]'

function withUtm(href: string, campaign: string): string {
  if (!href?.trim()) return href
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://convitesdiversos.com.br'
    const url = new URL(href, base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return href
    url.searchParams.set('utm_source', 'invite_page')
    url.searchParams.set('utm_medium', 'button')
    url.searchParams.set('utm_campaign', campaign)
    return url.toString()
  } catch {
    return href
  }
}

export function ActionButtons({ data }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const giftsIntro = data.giftsIntro?.trim() ?? ''
  const giftsButtonLabel = data.giftsButtonLabel?.trim() || t('invite.giftsButton')
  const giftsQrCode = data.giftsQrCodeImageUrl?.trim() ?? ''
  const giftsQrCodeSizePx = Math.min(320, Math.max(96, Number(data.giftsQrCodeSizePx) || 180))
  const mapsHref = withUtm(data.mapsLink, 'maps_click')
  const rsvpHref = withUtm(buildRsvpWhatsappHref(data), 'rsvp_click')
  const giftsHref = withUtm(data.giftsLink, 'gifts_click')

  return (
    <motion.div
      className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 pb-6"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: 0.05 }}
    >
      <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
        <a
          className={btn}
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackEvent('invite_action_click', {
              action_type: 'maps',
              page_path: getCurrentPagePath(),
            })
          }
        >
          {data.mapsButtonLabel?.trim() || t('invite.mapButton')}
        </a>
        <a
          className={btn}
          href={rsvpHref}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackEvent('invite_action_click', {
              action_type: 'rsvp',
              page_path: getCurrentPagePath(),
            })
          }
        >
          {data.rsvpButtonLabel?.trim() || t('invite.rsvpButton')}
        </a>
      </div>
      {giftsIntro ? (
        <p className="max-w-xl text-center text-sm leading-relaxed text-[color:var(--color-ink-muted)]">{giftsIntro}</p>
      ) : null}
      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-end">
        <a
          className={btn}
          href={giftsHref}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackEvent('invite_action_click', {
              action_type: 'gifts',
              page_path: getCurrentPagePath(),
            })
          }
        >
          {giftsButtonLabel}
        </a>
        {giftsQrCode ? (
          <div className="inline-flex flex-col items-center justify-center gap-2 rounded-2xl border border-[color:var(--color-gold)]/35 bg-white/90 p-3 shadow-sm">
            <img
              src={giftsQrCode}
              alt="QR Code para lista de presentes"
              className="rounded-md object-contain"
              style={{ width: `${giftsQrCodeSizePx}px`, height: `${giftsQrCodeSizePx}px` }}
              loading="lazy"
            />
            <p className="text-center text-xs font-medium tracking-wide text-[color:var(--color-ink-muted)]">
              Escaneie para presentear
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
