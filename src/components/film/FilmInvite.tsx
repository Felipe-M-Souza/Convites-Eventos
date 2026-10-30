import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { EventData } from '../../data/eventData'
import { coupleNameParts, inviteMomentFilled, resolveSealMark } from '../../data/eventData'
import { MonogramMark, WhiteBouquet } from '../monogram/MonogramArt'
import { useI18n } from '../../i18n/useI18n'
import { monthCells, parseIsoLocal, weekdayLabels } from '../../lib/inviteCalendar'
import { buildRsvpWhatsappHref } from '../../lib/whatsappLink'
import { getCurrentPagePath, trackEvent } from '../../lib/analytics'

type Props = {
  data: EventData
  onOpenGesture?: () => void
}

type Scene = {
  id: string
  ms: number
}

const SPARKS = [
  [12, 18], [22, 30], [70, 14], [82, 24], [46, 10], [58, 22],
  [16, 48], [86, 42], [34, 62], [74, 58], [8, 70], [90, 68],
]

const BOKEH = [
  { x: '6%', y: '10%', s: 120, o: 0.55 },
  { x: '68%', y: '6%', s: 160, o: 0.4 },
  { x: '18%', y: '22%', s: 64, o: 0.7 },
  { x: '78%', y: '28%', s: 88, o: 0.45 },
  { x: '40%', y: '4%', s: 42, o: 0.8 },
]

function displayClock(time: string): string {
  const match = time.trim().match(/^(\d{1,2})h(\d{2})$/i)
  return match ? `${match[1]}:${match[2]}` : time.trim()
}

function prefersReduce(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function TypeChars({ text, className = '' }: { text: string; className?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (prefersReduce()) {
      setCount(text.length)
      return undefined
    }
    setCount(0)
    const id = window.setInterval(() => {
      setCount((value) => (value >= text.length ? value : value + 1))
    }, 26)
    return () => window.clearInterval(id)
  }, [text])
  return <span className={className}>{text.slice(0, count)}</span>
}

function TypeLines({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (prefersReduce()) {
      setCount(lines.length)
      return undefined
    }
    setCount(0)
    const id = window.setInterval(() => {
      setCount((value) => Math.min(lines.length, value + 1))
    }, 700)
    return () => window.clearInterval(id)
  }, [text, lines.length])
  return (
    <div className={className}>
      {lines.slice(0, count).map((line, lineIndex) => (
        <motion.p
          key={line}
          className="mt-3"
          initial={prefersReduce() ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: lineIndex === count - 1 ? 0.05 : 0 }}
        >
          {line}
        </motion.p>
      ))}
    </div>
  )
}

function GoldCorner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 92 92" className={`absolute h-20 w-20 ${className}`} aria-hidden>
      <path d="M6 86 V12 H80" fill="none" stroke="#c6a56a" strokeWidth="1.8" />
      <path d="M13 78 V20 H72" fill="none" stroke="#e2d0a4" strokeWidth="0.9" />
    </svg>
  )
}

function CornerBouquet({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 130" className={className} aria-hidden>
      <path d="M16 112c24-10 44-34 50-60-20 12-38 10-52 2 10 20 12 38 2 58z" fill="#8ea488" />
      <path d="M30 98c20-4 40-20 46-42-16 14-32 14-46 4 8 14 10 26 0 38z" fill="#a7ba9e" />
      <path d="M78 78c10 8 8 20-2 26 12-2 22-12 26-24-10 2-18 0-24-2z" fill="#c6a56a" />
      <circle cx="86" cy="46" r="14" fill="#fff" />
      <circle cx="102" cy="58" r="12" fill="#f4efe6" />
      <circle cx="74" cy="60" r="13" fill="#fff" />
      <circle cx="88" cy="54" r="8" fill="#fbf8f2" />
      <circle cx="88" cy="54" r="3.2" fill="#efd7a4" />
      <circle cx="52" cy="38" r="2.3" fill="#fff" />
      <circle cx="64" cy="28" r="1.6" fill="#fff" />
      <circle cx="112" cy="34" r="2" fill="#fff" />
      <circle cx="120" cy="48" r="1.5" fill="#fff" />
      <circle cx="44" cy="54" r="1.8" fill="#fff" />
    </svg>
  )
}

function Portrait({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[#efe6d8]">
      <div className={`relative min-h-dvh w-full max-w-[430px] overflow-hidden ${className}`}>{children}</div>
    </div>
  )
}

/** Cartão com moldura dourada dupla, flores nos cantos e o texto no centro. */
function FramedScene({ children }: { children: ReactNode }) {
  return (
    <Portrait className="flex items-center justify-center bg-[#f7f3ec] px-7 pb-28 pt-20 text-center text-[#3e3832]">
      <div className="pointer-events-none absolute inset-x-3.5 bottom-[5.25rem] top-[4.35rem]" aria-hidden>
        <GoldCorner className="left-0 top-0" />
        <GoldCorner className="right-0 top-0 -scale-x-100" />
        <GoldCorner className="bottom-0 left-0 -scale-y-100" />
        <GoldCorner className="bottom-0 right-0 -scale-100" />
        <CornerBouquet className="absolute -left-1 -top-2 w-32" />
        <CornerBouquet className="absolute -bottom-1 -right-1 w-32 rotate-180" />
      </div>
      <div className="relative z-10 w-full max-w-[18.5rem]">{children}</div>
    </Portrait>
  )
}

function AtelierBackdrop({ children, float = false }: { children: ReactNode; float?: boolean }) {
  return (
    <Portrait className="flex items-center justify-center bg-[#f3ecdf] px-5 pb-24 pt-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 16%, rgba(255,248,230,0.95), transparent 48%), radial-gradient(ellipse at 50% 100%, #e7dfd2 0%, transparent 46%)',
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
            background: 'radial-gradient(circle, rgba(255,244,214,0.95) 0%, rgba(255,226,170,0.25) 46%, transparent 72%)',
          }}
          aria-hidden
        />
      ))}
      {SPARKS.map(([x, y], spark) => (
        <span
          key={`${x}-${y}`}
          className="mono-spark pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,236,190,0.9)]"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(spark % 5) * 0.35}s` }}
          aria-hidden
        />
      ))}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%]"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(255,255,255,0.55) 20%, #f7f4ef 46%), repeating-linear-gradient(115deg, transparent 0 18px, rgba(210,206,198,0.35) 19px 20px)',
        }}
        aria-hidden
      />
      <div className={`relative z-10 w-full max-w-[340px] ${float ? 'mono-float' : ''}`}>{children}</div>
    </Portrait>
  )
}

function EnvelopeStill({ mark }: { mark: string }) {
  return (
    <div className="relative mx-auto aspect-[5/4.7] w-[min(76vw,320px)]">
      <div className="absolute inset-x-[10%] -bottom-3 h-6 rounded-[100%] bg-[rgba(120,96,60,0.16)] blur-md" aria-hidden />
      <div className="absolute inset-0 overflow-hidden bg-[#fbf8f3] shadow-[0_22px_40px_rgba(92,70,40,0.18)]">
        <div className="absolute inset-x-0 top-0 h-[54%] bg-[#f3ece2]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
        <div className="film-shimmer pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>
      <div
        className="absolute bottom-0 left-1/2 top-0 z-10 w-[14%] -translate-x-1/2 border-x-2 border-[#c6a56a]"
        style={{ background: 'linear-gradient(90deg, #d5e3d6, #f4f8f2 46%, #c5d4c8 54%, #e7f0e4)' }}
      />
      <div
        className="absolute left-0 right-0 top-[40%] z-20 h-[15%] border-y-2 border-[#c6a56a]"
        style={{ background: 'linear-gradient(180deg, #e7f1e6, #c9d8ca 48%, #b7c9b8)' }}
      />
      <WhiteBouquet className="pointer-events-none absolute left-1/2 top-[62%] z-40 w-[72%] -translate-x-1/2" />
      <div className="absolute left-1/2 top-[46%] z-30 w-[46%] -translate-x-1/2 -translate-y-1/2">
        <MonogramMark mark={mark} />
      </div>
    </div>
  )
}

function buildScenes(data: EventData): Scene[] {
  const scenes: Scene[] = [
    { id: 'envelope', ms: 4200 },
    { id: 'arrived', ms: 4200 },
    { id: 'names', ms: 4800 },
  ]
  const messageLines = data.message.split(/\n+/).filter((line) => line.trim()).length
  if (data.message.trim()) scenes.push({ id: 'message', ms: Math.max(5600, messageLines * 760 + 1800) })
  const parents = [data.parentsLeftNames, data.parentsRightNames].some((value) => value.trim())
  if (parents) scenes.push({ id: 'parents', ms: 5600 })
  if (parseIsoLocal(data.weddingDateTime)) scenes.push({ id: 'calendar', ms: 5400 })
  const hasPlace =
    inviteMomentFilled(data.ceremonyTime, data.ceremonyVenue, data.ceremonyAddress) ||
    inviteMomentFilled(data.receptionTime, data.receptionVenue, data.receptionAddress) ||
    Boolean(data.venue.trim())
  if (hasPlace) scenes.push({ id: 'details', ms: 6400 })
  if (data.dressCodeEnabled !== false && (data.dressCode.trim() || data.guestGuideDress.trim())) {
    scenes.push({ id: 'dress', ms: 4800 })
  }
  if (data.verse.trim()) scenes.push({ id: 'verse', ms: 6400 })
  scenes.push({ id: 'closing', ms: 1400 })
  return scenes
}

export function FilmInvite({ data, onOpenGesture }: Props) {
  const { locale, t } = useI18n()
  const scenes = useMemo(() => buildScenes(data), [data])
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const scene = scenes[Math.min(index, scenes.length - 1)]!
  const names = coupleNameParts(data.coupleNames)
  const when = parseIsoLocal(data.weddingDateTime)
  const mark = resolveSealMark(data)
  const rsvpHref = buildRsvpWhatsappHref(data)
  const mapsHref = data.receptionMapsLink.trim() || data.ceremonyMapsLink.trim() || data.mapsLink.trim()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (!onOpenGesture) return undefined
    const prime = () => onOpenGesture()
    window.addEventListener('pointerdown', prime, { once: true })
    return () => window.removeEventListener('pointerdown', prime)
  }, [onOpenGesture])

  useEffect(() => {
    if (held) return undefined
    const id = window.setTimeout(() => {
      if (index >= scenes.length - 1) {
        setHeld(true)
        return
      }
      setIndex(index + 1)
    }, scene.ms)
    return () => window.clearTimeout(id)
  }, [held, index, scene.ms, scenes.length])

  const replay = () => {
    setHeld(false)
    setIndex(0)
  }

  const ceremony = inviteMomentFilled(data.ceremonyTime, data.ceremonyVenue, data.ceremonyAddress, data.ceremonyImageUrl)
  const reception = inviteMomentFilled(data.receptionTime, data.receptionVenue, data.receptionAddress, data.receptionImageUrl)
  const moments = [
    ceremony
      ? { title: data.ceremonyTitle.trim() || t('invite.ceremonyTitle'), time: data.ceremonyTime, venue: data.ceremonyVenue, address: data.ceremonyAddress }
      : null,
    reception
      ? { title: data.receptionTitle.trim() || t('invite.receptionTitle'), time: data.receptionTime, venue: data.receptionVenue, address: data.receptionAddress }
      : null,
  ].filter((item): item is { title: string; time: string; venue: string; address: string } => Boolean(item))
  if (!moments.length && data.venue.trim()) {
    moments.push({ title: t('invite.filmBigDay'), time: data.time, venue: data.venue, address: data.address })
  }

  let body: ReactNode = null
  if (scene.id === 'envelope') {
    body = (
      <AtelierBackdrop float>
        <EnvelopeStill mark={mark} />
      </AtelierBackdrop>
    )
  } else if (scene.id === 'arrived') {
    body = (
      <FramedScene>
        <p className="font-script text-[2.7rem] leading-tight text-[#b8956b]">
          <TypeChars text={t('invite.filmArrived')} />
        </p>
      </FramedScene>
    )
  } else if (scene.id === 'names') {
    body = (
      <FramedScene>
        <p className="font-display text-3xl italic text-[#5f734f]">{t('invite.filmWeMarry')}</p>
        <div className="mt-5 font-script text-[3.15rem] leading-[0.95] text-[#b8956b]">
          {names.map((name) => (
            <span key={name} className="mt-1 block">
              {name}
            </span>
          ))}
        </div>
        <svg viewBox="0 0 78 36" className="mx-auto mt-8 h-9 w-[4.5rem]" aria-hidden>
          <ellipse cx="26" cy="18" rx="16" ry="11" fill="none" stroke="#c6a56a" strokeWidth="3" />
          <ellipse cx="48" cy="18" rx="16" ry="11" fill="none" stroke="#e6d3a4" strokeWidth="3" />
        </svg>
      </FramedScene>
    )
  } else if (scene.id === 'message') {
    body = (
      <FramedScene>
        <TypeLines text={data.message} className="font-display text-[1.35rem] leading-snug text-[#4d5c45]" />
      </FramedScene>
    )
  } else if (scene.id === 'parents') {
    body = (
      <FramedScene>
        <p className="font-script text-[2.15rem] leading-tight text-[#b8956b]">{t('invite.filmFamilies')}</p>
        <div className="mt-7 space-y-5">
          {data.parentsRightNames.trim() ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d7352]">{data.parentsRightLabel.trim() || t('invite.filmGroomFamily')}</p>
              <p className="mt-1 whitespace-pre-line font-display text-[1.65rem] leading-tight">{data.parentsRightNames}</p>
            </div>
          ) : null}
          {data.parentsLeftNames.trim() ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d7352]">{data.parentsLeftLabel.trim() || t('invite.filmBrideFamily')}</p>
              <p className="mt-1 whitespace-pre-line font-display text-[1.65rem] leading-tight">{data.parentsLeftNames}</p>
            </div>
          ) : null}
        </div>
      </FramedScene>
    )
  } else if (scene.id === 'calendar' && when) {
    const cells = monthCells(when)
    const weekdays = weekdayLabels(locale)
    body = (
      <FramedScene>
        <p className="font-script text-[2.35rem] leading-none text-[#3f4a38]">{t('invite.filmSaveDate')}</p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#8d7352]">{t('invite.filmJoin')}</p>
        <p className="mt-3 font-script text-5xl capitalize leading-none text-[#b8956b]">
          {when.toLocaleDateString(locale, { month: 'long' })}
        </p>
        <p className="mt-1 font-display text-2xl text-[#7d6a4a]">{when.getFullYear()}</p>
        <div className="mx-auto mt-4 grid max-w-[16.5rem] grid-cols-7 gap-y-1 text-[11px] text-[#8d7352]">
          {weekdays.map((label) => (
            <span key={label} className="py-1 uppercase">
              {label.slice(0, 3)}
            </span>
          ))}
          {cells.map((day, cell) => {
            const marked = day === when.getDate()
            return (
              <span key={`${day ?? 'e'}-${cell}`} className="relative flex h-8 items-center justify-center">
                <span className={marked ? 'relative z-10 font-semibold text-[#3e3832]' : ''}>{day ?? ''}</span>
                {marked ? (
                  <motion.span
                    className="absolute text-[1.65rem] leading-none text-[#7d9480]"
                    initial={prefersReduce() ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45 }}
                    aria-hidden
                  >
                    ♡
                  </motion.span>
                ) : null}
              </span>
            )
          })}
        </div>
      </FramedScene>
    )
  } else if (scene.id === 'details') {
    body = (
      <FramedScene>
        <p className="inline-block rounded-full border border-[#e4d3ae] bg-white/70 px-5 py-1.5 font-script text-[2.4rem] leading-none text-[#5f734f]">
          {t('invite.filmBigDay')}
        </p>
        {when ? (
          <p className="mt-4 font-display text-2xl tracking-wide text-[#3e3832]">
            {when.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        ) : null}
        <div className="mt-5 space-y-4">
          {moments.map((item) => (
            <div key={item.title}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#7d9480]">{item.title}</p>
              {item.time.trim() ? <p className="mt-1 font-display text-3xl text-[#3e3832]">{displayClock(item.time)}</p> : null}
              {item.venue.trim() ? <p className="mt-1 font-display text-xl leading-tight">{item.venue}</p> : null}
              {item.address.trim() ? <p className="mt-1 text-sm leading-5 text-[#5c534c]">{item.address}</p> : null}
            </div>
          ))}
        </div>
      </FramedScene>
    )
  } else if (scene.id === 'dress') {
    body = (
      <FramedScene>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#5f734f]">{t('invite.filmDress')}</p>
        {data.dressCode.trim() ? <p className="mt-3 font-script text-5xl text-[#b8956b]">{data.dressCode}</p> : null}
        {data.guestGuideDress.trim() && data.guestGuideDress.trim() !== data.dressCode.trim() ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#5c534c]">{data.guestGuideDress}</p>
        ) : null}
      </FramedScene>
    )
  } else if (scene.id === 'verse') {
    body = (
      <FramedScene>
        <p className="font-display text-[1.55rem] leading-snug text-[#4d5c45]">
          <TypeChars text={data.verse} />
        </p>
      </FramedScene>
    )
  } else {
    body = (
      <AtelierBackdrop>
        <p className="mx-auto mb-6 w-fit rounded-full bg-[#e7f0e6]/90 px-6 py-2 font-script text-[2.4rem] leading-none text-[#5f734f]">
          {t('invite.filmWaiting')}
        </p>
        <EnvelopeStill mark={mark} />
        <div className="mt-7 flex flex-col items-center gap-3">
          {rsvpHref ? (
            <a
              href={rsvpHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('invite_action_click', { action_type: 'rsvp', page_path: getCurrentPagePath() })}
              className="text-sm uppercase tracking-[0.18em] text-[#7d6a4a] underline decoration-[#c6a56a] underline-offset-4"
            >
              {data.rsvpButtonLabel?.trim() || t('invite.rsvpButton')}
            </a>
          ) : null}
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('invite_action_click', { action_type: 'maps', page_path: getCurrentPagePath() })}
              className="text-sm text-[#7d9480] underline decoration-[#c6a56a] underline-offset-4"
            >
              {data.mapsButtonLabel?.trim() || t('invite.sageDirections')}
            </a>
          ) : null}
          <button type="button" onClick={replay} className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8d7352]">
            {t('invite.filmReplay')}
          </button>
        </div>
      </AtelierBackdrop>
    )
  }

  const reduce = prefersReduce()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f6f1e8]">
      <div className="absolute left-0 right-0 top-0 z-40 h-0.5 bg-[#eadfca]/80" aria-hidden>
        <div
          className="h-full bg-[#c6a56a] transition-[width] duration-700"
          style={{ width: `${((index + 1) / scenes.length) * 100}%` }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          className="min-h-dvh"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -22 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
