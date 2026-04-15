import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'
import { buildRsvpWhatsappHref } from '../lib/whatsappLink'

type Props = {
  data: EventData
}

const btn =
  'inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--color-gold)]/40 bg-white px-6 py-3.5 text-sm font-medium text-[color:var(--color-ink)] shadow-sm transition hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-blush)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-gold)] sm:w-auto sm:min-w-[220px]'

export function ActionButtons({ data }: Props) {
  const reduce = useReducedMotion()
  const giftsIntro = data.giftsIntro?.trim() ?? ''
  const giftsButtonLabel = data.giftsButtonLabel?.trim() || 'Lista de presentes'
  const giftsQrCode = data.giftsQrCodeImageUrl?.trim() ?? ''
  const giftsQrCodeSizePx = Math.min(320, Math.max(96, Number(data.giftsQrCodeSizePx) || 180))

  return (
    <motion.div
      className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 pb-6"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: 0.05 }}
    >
      <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
        <a className={btn} href={data.mapsLink} target="_blank" rel="noreferrer">
          {data.mapsButtonLabel?.trim() || 'Ver no mapa'}
        </a>
        <a className={btn} href={buildRsvpWhatsappHref(data)} target="_blank" rel="noreferrer">
          {data.rsvpButtonLabel?.trim() || 'Confirmar presença'}
        </a>
      </div>
      {giftsIntro ? (
        <p className="max-w-xl text-center text-sm leading-relaxed text-[color:var(--color-ink-muted)]">{giftsIntro}</p>
      ) : null}
      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-end">
        <a className={btn} href={data.giftsLink} target="_blank" rel="noreferrer">
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
