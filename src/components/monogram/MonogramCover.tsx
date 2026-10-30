import { useState } from 'react'
import type { EventData } from '../../data/eventData'
import { resolveSealMark } from '../../data/eventData'
import { useI18n } from '../../i18n/useI18n'
import { parseIsoLocal } from '../../lib/inviteCalendar'
import { MonogramMark, WhiteBouquet } from './MonogramArt'

type Props = {
  data: EventData
  onOpen: () => void
  onOpenGesture?: () => void
}

const STOCK_SEAL_HINT = 'Clique no selo para abrir o convite'

const BOKEH = [
  { x: '4%', y: '7%', s: 140, o: 0.55 },
  { x: '68%', y: '4%', s: 180, o: 0.42 },
  { x: '22%', y: '18%', s: 70, o: 0.75 },
  { x: '78%', y: '24%', s: 96, o: 0.5 },
  { x: '46%', y: '2%', s: 48, o: 0.85 },
  { x: '12%', y: '42%', s: 36, o: 0.55 },
  { x: '86%', y: '48%', s: 58, o: 0.4 },
  { x: '34%', y: '62%', s: 28, o: 0.7 },
]

const SPARKS = [
  [14, 16], [26, 28], [72, 12], [84, 22], [48, 8], [60, 20],
  [18, 46], [88, 40], [32, 58], [70, 54], [50, 34], [8, 64], [92, 66], [40, 14],
]

export function MonogramCover({ data, onOpen, onOpenGesture }: Props) {
  const { locale, t } = useI18n()
  const [opening, setOpening] = useState(false)
  const when = parseIsoLocal(data.weddingDateTime)
  const dateLabel = when
    ? when.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : data.weddingDateLabel
  const storedHint = data.openingSealHint.trim()
  const hint = storedHint && storedHint !== STOCK_SEAL_HINT ? storedHint : t('invite.monogramHint')
  const mark = resolveSealMark(data)

  const open = () => {
    if (opening) return
    onOpenGesture?.()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      onOpen()
      return
    }
    setOpening(true)
    window.setTimeout(onOpen, 820)
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f3ecdf] px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 18%, rgba(255,248,230,0.95), transparent 46%), radial-gradient(ellipse at 50% 100%, #e7dfd2 0%, transparent 52%)',
        }}
        aria-hidden
      />
      {BOKEH.map((dot) => (
        <span
          key={`${dot.x}-${dot.y}`}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.s,
            height: dot.s,
            opacity: dot.o,
            background: 'radial-gradient(circle, rgba(255,244,214,0.95) 0%, rgba(255,226,170,0.28) 42%, transparent 70%)',
            filter: 'blur(1px)',
          }}
          aria-hidden
        />
      ))}
      {SPARKS.map(([x, y], index) => (
        <span
          key={`${x}-${y}`}
          className="mono-spark pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,236,190,0.9)]"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(index % 5) * 0.35}s` }}
          aria-hidden
        />
      ))}
      <svg className="pointer-events-none absolute left-[8%] top-0 h-40 w-24 text-[#8ea488]/50" viewBox="0 0 80 160" aria-hidden>
        <path d="M40 0c8 28 6 48-8 78" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <ellipse cx="28" cy="48" rx="14" ry="6" transform="rotate(-30 28 48)" fill="currentColor" />
        <ellipse cx="46" cy="72" rx="12" ry="5" transform="rotate(20 46 72)" fill="currentColor" />
      </svg>
      <svg className="pointer-events-none absolute right-[10%] top-0 h-44 w-24 text-[#8ea488]/45" viewBox="0 0 80 170" aria-hidden>
        <path d="M36 0c-6 32 4 54 10 86" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <ellipse cx="48" cy="56" rx="14" ry="6" transform="rotate(24 48 56)" fill="currentColor" />
        <ellipse cx="30" cy="84" rx="12" ry="5" transform="rotate(-18 30 84)" fill="currentColor" />
      </svg>

      <div className={`relative z-10 flex w-full max-w-[420px] flex-col items-center ${opening ? 'mono-leave' : 'mono-float'}`}>
        <div className="relative aspect-[5/4.7] w-[min(78vw,340px)]">
          <div className="absolute inset-x-[8%] bottom-[-18px] h-8 rounded-[100%] bg-[rgba(120,96,60,0.16)] blur-md" aria-hidden />
          <div className="absolute inset-0 bg-[#fbf8f3] shadow-[0_22px_40px_rgba(92,70,40,0.18)]">
            <div
              className="absolute inset-x-0 top-0 h-[54%] bg-[#f3ece2]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            />
            <div
              className="absolute inset-x-0 top-0 h-[54%]"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.35), transparent 42%, rgba(190,164,120,0.18))',
              }}
            />
          </div>
          <div
            className="absolute bottom-0 left-1/2 top-0 z-10 w-[15%] -translate-x-1/2 border-x-2 border-[#c6a56a]"
            style={{ background: 'linear-gradient(90deg, #d5e3d6, #f4f8f2 46%, #c5d4c8 54%, #e7f0e4)' }}
            aria-hidden
          />
          <div
            className="absolute left-0 right-0 top-[40%] z-20 h-[16%] border-y-2 border-[#c6a56a]"
            style={{ background: 'linear-gradient(180deg, #e7f1e6, #c9d8ca 48%, #b7c9b8)' }}
            aria-hidden
          />
          <WhiteBouquet className="pointer-events-none absolute left-1/2 top-[63%] z-40 w-[74%] -translate-x-1/2" />
          <button
            type="button"
            onClick={open}
            className="absolute left-1/2 top-[46%] z-30 w-[46%] -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#c6a56a] focus-visible:ring-offset-2"
            aria-label={hint}
          >
            <MonogramMark mark={mark} />
          </button>
        </div>
        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.28em] text-[#8d7352]">{hint}</p>
        {dateLabel ? <p className="mt-3 font-display text-2xl text-[#5c5348]">{dateLabel}</p> : null}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%]"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(255,255,255,0.55) 18%, #f7f4ef 40%), repeating-linear-gradient(115deg, transparent 0 18px, rgba(210,206,198,0.35) 19px 20px)',
        }}
        aria-hidden
      />
      <span className="pointer-events-none absolute bottom-[9%] left-[12%] h-3 w-3 rounded-full bg-white/90 shadow-sm" aria-hidden />
      <span className="pointer-events-none absolute bottom-[14%] left-[18%] h-2 w-2 rounded-full bg-white/80" aria-hidden />
      <span className="pointer-events-none absolute bottom-[8%] right-[16%] h-2.5 w-2.5 rounded-full bg-white/90 shadow-sm" aria-hidden />
      <span className="pointer-events-none absolute bottom-[12%] right-[22%] h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden />
    </div>
  )
}
