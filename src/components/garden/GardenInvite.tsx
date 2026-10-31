import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { dressAvoidFor } from '../../data/dressAvoid'
import type { EventData } from '../../data/eventData'
import { trackEvent, getCurrentPagePath } from '../../lib/analytics'
import { buildRsvpWhatsappHref } from '../../lib/whatsappLink'

type Props = {
  data: EventData
  inviteSlug: string
}

type ModalId = 'dress' | null

const BUTTERFLIES = [
  { left: '9%', top: '16%', delay: 0, duration: 7, scale: 0.55 },
  { left: '4%', top: '70%', delay: 0.8, duration: 8.5, scale: 0.5 },
  { left: '74%', top: '72%', delay: 1.4, duration: 7.5, scale: 0.48 },
]

const SPARKLES = [
  { left: '20%', top: '36%' },
  { left: '78%', top: '34%' },
  { left: '18%', top: '58%' },
  { left: '80%', top: '56%' },
  { left: '48%', top: '30%' },
  { left: '70%', top: '64%' },
]

function splitDate(label: string): { day: string; month: string } {
  const match = label.trim().match(/(\d{1,2})\s+de\s+([A-Za-zÀ-ú]+)/i)
  if (!match) return { day: label.trim(), month: '' }
  return { day: match[1], month: match[2].toUpperCase() }
}

function useCountdown(iso: string) {
  const target = useMemo(() => {
    const time = Date.parse(iso)
    return Number.isNaN(time) ? null : time
  }, [iso])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (target == null) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  if (target == null || target <= now) return null
  const diff = target - now
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds }
}

function Butterfly({ delay, duration, scale }: { delay: number; duration: number; scale: number }) {
  return (
    <motion.svg
      viewBox="0 0 64 48"
      className="h-8 w-11 drop-shadow-[0_4px_6px_rgba(120,40,70,0.35)]"
      style={{ scale }}
      aria-hidden
      animate={{ y: [0, -16, 0], x: [0, 10, 0], rotate: [-8, 8, -8] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.g
        style={{ transformOrigin: '32px 24px' }}
        animate={{ scaleX: [1, 0.55, 1] }}
        transition={{ duration: 0.45, delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M32 24 C40 8 58 6 58 20 C58 32 42 34 32 26 Z" fill="#f4a4c0" stroke="#e7c56a" strokeWidth="1" />
        <path d="M32 24 C24 8 6 6 6 20 C6 32 22 34 32 26 Z" fill="#f4a4c0" stroke="#e7c56a" strokeWidth="1" />
        <path d="M32 26 C40 30 50 40 42 44 C34 40 32 32 32 26 Z" fill="#e56b98" />
        <path d="M32 26 C24 30 14 40 22 44 C30 40 32 32 32 26 Z" fill="#e56b98" />
      </motion.g>
      <path d="M32 14 C33.2 20 33.2 32 32 40 C30.8 32 30.8 20 32 14 Z" fill="#c9892f" />
    </motion.svg>
  )
}

function MenuIcon({ kind }: { kind: 'confirm' | 'map' | 'dress' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'confirm') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path {...common} d="M20 7 10 17l-6-6" />
      </svg>
    )
  }
  if (kind === 'map') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path {...common} d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
        <circle {...common} cx="12" cy="10" r="2.2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path {...common} d="M8 7h8l1 4H7l1-4Z" />
      <path {...common} d="M7 11c0 4 2 6 5 6s5-2 5-6" />
    </svg>
  )
}

/**
 * Convite em tela cheia no estilo jardim: a moldura da Kemilly fica de fundo,
 * os dados no miolo e os botões embaixo. As borboletas são desenhadas aqui.
 */
export function GardenInvite({ data, inviteSlug }: Props) {
  const reduce = useReducedMotion()
  const [modal, setModal] = useState<ModalId>(null)
  const countdown = useCountdown(data.weddingDateTime)
  const date = splitDate(data.weddingDateLabel)
  const frame = data.openingFrameImageUrl?.trim()
  const dressAvoid = dressAvoidFor(inviteSlug)
  const whatsapp = buildRsvpWhatsappHref(data)
  const maps = data.mapsLink?.trim()
  const message = data.message.replace(/\s+\n/g, '\n').trim()

  const openDress = () => {
    trackEvent('invite_action_click', { action_type: 'dress_code', page_path: getCurrentPagePath() })
    setModal('dress')
  }

  return (
    <motion.div
      className="relative h-dvh overflow-hidden bg-[#fbf6f1]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-full -translate-x-1/2 -translate-y-1/2"
        style={{ aspectRatio: '1087 / 1447' }}
      >
        {frame ? <img src={frame} alt="" className="pointer-events-none h-full w-full select-none" /> : null}

        {reduce
          ? null
          : BUTTERFLIES.map((item) => (
              <div key={item.left + item.top} className="pointer-events-none absolute z-20" style={{ left: item.left, top: item.top }}>
                <Butterfly delay={item.delay} duration={item.duration} scale={item.scale} />
              </div>
            ))}

        {SPARKLES.map((item, index) => (
          <motion.span
            key={`${item.left}-${item.top}`}
            className="pointer-events-none absolute z-20 h-1.5 w-1.5 rounded-full bg-[#f3d27a]"
            style={{ left: item.left, top: item.top }}
            aria-hidden
            animate={reduce ? undefined : { opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
            transition={{ duration: 2.2, delay: index * 0.25, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <div className="@container absolute left-[27%] right-[27%] top-[32.5%] flex h-[30%] flex-col items-center justify-between text-center text-[#8a4a5c]">
          <div className="flex w-full min-h-0 flex-col items-center">
            <p className="max-w-full font-script text-[clamp(1.2rem,11cqi,1.85rem)] leading-none text-[#a24b68]">
              {data.coupleNames}
            </p>
            {countdown ? (
              <p className="mt-1 whitespace-nowrap font-display text-[clamp(0.62rem,3.4cqi,0.8rem)] tracking-wide text-[#8a6230]">
                {countdown.days}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m{' '}
                {String(countdown.seconds).padStart(2, '0')}s
              </p>
            ) : null}

            <div className="mt-1.5 grid w-full grid-cols-[0.72fr_auto_1.15fr_auto_0.78fr] items-start gap-1">
              <div>
                <p className="font-display text-[clamp(1.15rem,7.5cqi,1.55rem)] leading-none">{date.day}</p>
                <p className="mt-0.5 text-[clamp(0.5rem,2.6cqi,0.62rem)] uppercase tracking-[0.12em]">{date.month}</p>
              </div>
              <span className="mt-0.5 h-6 w-px bg-[#e4c98a]" aria-hidden />
              <div className="min-w-0">
                <p className="text-[clamp(0.52rem,2.7cqi,0.64rem)] font-medium uppercase leading-snug tracking-wide">{data.venue}</p>
              </div>
              <span className="mt-0.5 h-6 w-px bg-[#e4c98a]" aria-hidden />
              <div>
                <p className="font-display text-[clamp(0.95rem,6cqi,1.25rem)] leading-none">{data.time}</p>
                <p className="mt-0.5 text-[clamp(0.5rem,2.6cqi,0.62rem)] uppercase tracking-[0.12em]">horas</p>
              </div>
            </div>

            {message ? (
              <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[clamp(0.58rem,2.9cqi,0.7rem)] leading-snug text-[#7a5348]">
                {message}
              </p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 items-end justify-center gap-2 pt-1">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('invite_action_click', { action_type: 'rsvp', page_path: getCurrentPagePath() })}
                className="flex w-[4.2rem] flex-col items-center gap-1"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4c98a] bg-white/85 shadow-sm">
                  <MenuIcon kind="confirm" />
                </span>
                <span className="text-[9px] uppercase leading-tight tracking-wide">
                  Confirme
                  <br />
                  presença
                </span>
              </a>
            ) : null}
            {maps ? (
              <a
                href={maps}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('invite_action_click', { action_type: 'maps', page_path: getCurrentPagePath() })}
                className="flex w-[4.2rem] flex-col items-center gap-1"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4c98a] bg-white/85 shadow-sm">
                  <MenuIcon kind="map" />
                </span>
                <span className="text-[9px] uppercase leading-tight tracking-wide">
                  Ver
                  <br />
                  rota
                </span>
              </a>
            ) : null}
            <button type="button" onClick={openDress} className="flex w-[4.2rem] flex-col items-center gap-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4c98a] bg-white/85 shadow-sm">
                <MenuIcon kind="dress" />
              </span>
              <span className="text-[9px] uppercase leading-tight tracking-wide">
                Dress
                <br />
                code
              </span>
            </button>
          </div>
        </div>
      </div>

      {modal === 'dress' ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-[#fffaf7] p-6 text-center shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[#b8893d]">{data.dressCodeLabel?.trim() || 'Traje'}</p>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/60 text-lg leading-none text-[#8a4a5c]"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="mt-4 font-display text-3xl text-[#a24b68]">{data.dressCode}</p>
            {dressAvoid ? (
              <div className="mt-4">
                <p className="text-sm text-[#6d4a42]">{dressAvoid.note}</p>
                <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {dressAvoid.colors.map((color) => (
                    <li key={color.label} className="inline-flex items-center gap-2 text-sm text-[#6d4a42]">
                      <span>{color.label}</span>
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}
