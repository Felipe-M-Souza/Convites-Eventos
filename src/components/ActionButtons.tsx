import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'
import { buildRsvpWhatsappHref } from '../lib/whatsappLink'
import { getCurrentPagePath, trackEvent } from '../lib/analytics'
import { classifyQrPayload, readQrFromUrl, type QrAction } from '../lib/qrPayload'
import { useI18n } from '../i18n/useI18n'

type Props = {
  data: EventData
  /** No modelo verde, mapa e confirmação ficam em blocos próprios. */
  giftsOnly?: boolean
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

const linkClass =
  'underline decoration-[color:var(--color-gold)]/50 underline-offset-2 text-[color:var(--color-ink)]'

function useQrAction(imageUrl: string, manualPayload: string) {
  const stored = manualPayload.trim()
  const [payload, setPayload] = useState(stored)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(stored ? 'ready' : 'idle')

  useEffect(() => {
    if (stored) {
      setPayload(stored)
      setStatus('ready')
      return undefined
    }
    if (!imageUrl) {
      setPayload('')
      setStatus('idle')
      return undefined
    }
    let cancelled = false
    setStatus('loading')
    readQrFromUrl(imageUrl)
      .then((value) => {
        if (cancelled) return
        setPayload(value ?? '')
        setStatus(value ? 'ready' : 'error')
      })
      .catch(() => {
        if (cancelled) return
        setPayload('')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [imageUrl, stored])

  return { action: classifyQrPayload(payload), status }
}

function QrCaptionBlock({
  action,
  caption,
  notice,
  onNotice,
}: {
  action: QrAction | null
  caption: string
  notice: string
  onNotice: (value: string) => void
}) {
  const { t } = useI18n()
  if (!action) return null

  const template =
    caption.trim() ||
    (action.kind === 'url'
      ? t('invite.giftsQrOpen')
      : action.kind === 'pix-key'
        ? t('invite.giftsQrPixKey')
        : action.kind === 'pix-code'
          ? t('invite.giftsQrPixCode')
          : t('invite.giftsQrCopy'))
  const key = action.kind === 'pix-key' || action.kind === 'pix-code' ? action.key : ''

  const activate = () => {
    trackEvent('invite_action_click', {
      action_type: 'gifts_qr',
      page_path: getCurrentPagePath(),
    })
    if (action.kind === 'url') return
    const copied =
      action.kind === 'pix-key'
        ? t('invite.giftsQrCopiedKey')
        : action.kind === 'pix-code'
          ? t('invite.giftsQrCopiedCode')
          : t('invite.giftsQrCopiedText')
    navigator.clipboard
      .writeText(action.copyText)
      .then(() => onNotice(copied))
      .catch(() => onNotice(action.copyText))
  }

  return (
    <div className="max-w-[16rem] text-center text-xs font-medium leading-5 tracking-wide text-[color:var(--color-ink-muted)]">
      <div>
        <QrCaption
          template={template}
          linkLabel={t('invite.giftsQrClick')}
          href={action.kind === 'url' ? action.href : undefined}
          onCopy={activate}
        />
      </div>
      {key ? <p className="mt-1 break-all text-[color:var(--color-ink)]">{key}</p> : null}
      {notice ? <p className="mt-1 text-[color:var(--color-ink)]">{notice}</p> : null}
    </div>
  )
}

function QrCaption({
  template,
  linkLabel,
  href,
  onCopy,
}: {
  template: string
  linkLabel: string
  href?: string
  onCopy: () => void
}) {
  const token = '{link}'
  const link = href ? (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass} onClick={onCopy}>
      {linkLabel}
    </a>
  ) : (
    <button type="button" className={linkClass} onClick={onCopy}>
      {linkLabel}
    </button>
  )

  if (template.includes(token)) {
    const [before, after] = template.split(token)
    return (
      <>
        {before}
        {link}
        {after}
      </>
    )
  }

  const folded = template.toLocaleLowerCase()
  const needle = linkLabel.toLocaleLowerCase()
  const at = folded.indexOf(needle)
  if (at >= 0) {
    return (
      <>
        {template.slice(0, at)}
        {link}
        {template.slice(at + linkLabel.length)}
      </>
    )
  }

  return (
    <>
      {template} {link}
    </>
  )
}

export function ActionButtons({ data, giftsOnly = false }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const giftsSectionEnabled = data.giftsSectionEnabled !== false
  const giftsIntro = data.giftsIntro?.trim() ?? ''
  const giftsButtonLabel = data.giftsButtonLabel?.trim() || t('invite.giftsButton')
  const giftsQrCode = data.giftsQrCodeImageUrl?.trim() ?? ''
  const giftsQrCodeSizePx = Math.min(320, Math.max(96, Number(data.giftsQrCodeSizePx) || 180))
  const mapsHref = withUtm(data.mapsLink, 'maps_click')
  const rsvpHref = withUtm(buildRsvpWhatsappHref(data), 'rsvp_click')
  const giftsHref = withUtm(data.giftsLink, 'gifts_click')
  const qr = useQrAction(giftsQrCode, data.giftsQrPayload ?? '')
  const [qrNotice, setQrNotice] = useState('')

  return (
    <motion.div
      className={`mx-auto flex max-w-2xl flex-col items-center gap-5 pb-6 ${giftsOnly ? 'px-0' : 'px-6'}`}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: 0.05 }}
    >
      {giftsOnly ? null : (
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
      )}
      {giftsSectionEnabled ? (
        <>
          {giftsIntro ? (
            <p className="max-w-xl text-center text-sm leading-relaxed text-[color:var(--color-ink-muted)]">{giftsIntro}</p>
          ) : null}
          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-end">
            <a
              className={giftsOnly ? 'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#5f734f] px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#526546] sm:w-auto sm:min-w-[220px]' : btn}
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
                <QrCaptionBlock
                  action={qr.action}
                  caption={data.giftsQrCaption ?? ''}
                  notice={qrNotice}
                  onNotice={setQrNotice}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </motion.div>
  )
}
