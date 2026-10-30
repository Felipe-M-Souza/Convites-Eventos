import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { EventData } from '../../data/eventData'
import { coupleNameParts, inviteMomentFilled, resolveSealMark } from '../../data/eventData'
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

const PLATES = {
  envelope: '/images/film/envelope-scene.jpg',
  atelier: '/images/film/atelier-atmosphere.jpg',
  framed: '/images/film/framed-card.jpg',
  floral: '/images/film/floral-desk.jpg',
}

const SPARKLES = Array.from({ length: 34 }, (_, index) => {
  const n = (index * 47 + 13) % 97
  return {
    x: (n * 9) % 100,
    y: (n * 13) % 100,
    s: 3 + (n % 4),
    d: (n % 9) * 0.32,
    star: n % 3 === 0,
  }
})

const BURST = [
  { x: -78, y: -36 },
  { x: 82, y: -24 },
  { x: -46, y: 54 },
  { x: 64, y: 48 },
  { x: 4, y: -70 },
  { x: -96, y: 10 },
  { x: 102, y: 8 },
  { x: 24, y: 74 },
]

function displayClock(time: string): string {
  const match = time.trim().match(/^(\d{1,2})h(\d{2})$/i)
  return match ? `${match[1]}:${match[2]}` : time.trim()
}

function prefersReduce(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function TypeChars({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (prefersReduce()) {
      setCount(text.length)
      return undefined
    }
    setCount(0)
    let interval = 0
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((value) => (value >= text.length ? value : value + 1))
      }, 34)
    }, delay)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
    }
  }, [text, delay])
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
          key={`${line}-${lineIndex}`}
          className="mt-3"
          initial={prefersReduce() ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {line}
        </motion.p>
      ))}
    </div>
  )
}

function Mist() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      <span className="film-smoke film-smoke-a" />
      <span className="film-smoke film-smoke-b" />
      <span className="film-smoke film-smoke-c" />
      <span className="film-orb film-orb-a" />
      <span className="film-orb film-orb-b" />
    </div>
  )
}

function SparkleField() {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden>
      {SPARKLES.map((spark, index) => (
        <span
          key={index}
          className={spark.star ? 'film-star' : 'film-spark'}
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: spark.s,
            height: spark.s,
            animationDelay: `${spark.d}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Palco vertical: foto de fundo, fumaça, brilho e o conteúdo por cima. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[#efe6d8]">
      <div className="relative min-h-dvh w-full max-w-[430px] overflow-hidden">
        {children}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: 'radial-gradient(ellipse at center, transparent 54%, rgba(70, 52, 30, 0.18) 100%)' }}
          aria-hidden
        />
        <Mist />
        <SparkleField />
        <div className="film-sweep pointer-events-none absolute inset-0 z-50" aria-hidden />
      </div>
    </div>
  )
}

function Plate({ src, children }: { src: string; children: ReactNode }) {
  return (
    <Stage>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-30 min-h-dvh">{children}</div>
    </Stage>
  )
}

function Copy({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="mx-auto w-full max-w-[16.75rem]"
      initial={prefersReduce() ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
    >
      {children}
    </motion.div>
  )
}

function FramedCopy({ children }: { children: ReactNode }) {
  return (
    <Plate src={PLATES.framed}>
      <div className="flex min-h-dvh items-center justify-center px-8 pb-24 pt-20 text-center">
        <Copy>{children}</Copy>
      </div>
    </Plate>
  )
}

function FloralCopy({ children }: { children: ReactNode }) {
  return (
    <Plate src={PLATES.floral}>
      <div className="flex min-h-dvh items-center justify-end px-5 pb-20 pt-16">
        <div className="max-h-[74dvh] w-[63%] overflow-y-auto text-left">
          <Copy>{children}</Copy>
        </div>
      </div>
    </Plate>
  )
}

function Opening({ mark, phrase }: { mark: string; phrase: string }) {
  const [phase, setPhase] = useState<'seal' | 'card'>(prefersReduce() ? 'card' : 'seal')
  useEffect(() => {
    if (prefersReduce() || phase === 'card') return undefined
    const id = window.setTimeout(() => setPhase('card'), 2300)
    return () => window.clearTimeout(id)
  }, [phase])
  const risen = phase === 'card'

  return (
    <Stage>
      <img src={PLATES.envelope} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <motion.img
        src={PLATES.atelier}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        initial={false}
        animate={{ opacity: risen ? 1 : 0 }}
        transition={{ duration: 1.15 }}
      />
      <motion.svg
        viewBox="0 0 120 100"
        className="film-heart pointer-events-none absolute left-1/2 top-[7%] z-30 h-24 w-28 -translate-x-1/2"
        animate={{ opacity: risen ? 0 : 1 }}
        transition={{ duration: 0.6 }}
        aria-hidden
      >
        <path
          d="M60 86 C18 56 8 34 24 20 C36 10 52 16 60 30 C68 16 84 10 96 20 C112 34 102 56 60 86 Z"
          fill="none"
          stroke="#f4d48a"
          strokeWidth="1.6"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255, 214, 140, 0.95))' }}
        />
      </motion.svg>
      <motion.span
        className="pointer-events-none absolute left-1/2 top-[57%] z-20 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f3d7a4]/80"
        animate={risen ? { opacity: 0 } : { scale: [0.75, 1.45], opacity: [0.75, 0] }}
        transition={risen ? { duration: 0.3 } : { duration: 1.7, repeat: Infinity }}
        aria-hidden
      />
      <motion.p
        className={`film-gold pointer-events-none absolute left-1/2 top-[57%] z-30 max-w-[5.5rem] -translate-x-1/2 -translate-y-1/2 text-center font-script leading-none ${mark.length > 6 ? 'text-xl' : 'text-[1.85rem]'}`}
        animate={{ opacity: risen ? 0 : 1 }}
        transition={{ duration: 0.35 }}
      >
        {mark}
      </motion.p>
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[34%] z-20 h-36 w-28 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,214,140,0.75),transparent_70%)] blur-md"
        animate={{ opacity: risen ? 0.85 : 0 }}
        transition={{ duration: 0.8 }}
        aria-hidden
      />
      <motion.div
        className="absolute left-1/2 z-30 w-[min(78%,320px)]"
        initial={false}
        animate={
          risen
            ? { top: '19%', x: '-50%', scale: 1, opacity: 1 }
            : { top: '52%', x: '-50%', scale: 0.42, opacity: 0 }
        }
        transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative">
          {risen
            ? BURST.map((bit) => (
                <motion.span
                  key={`${bit.x}-${bit.y}`}
                  className="absolute left-1/2 top-1/2 z-10 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,220,160,0.95)]"
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], x: bit.x, y: bit.y }}
                  transition={{ duration: 1.15, delay: 0.15 }}
                />
              ))
            : null}
          <div className="film-card-float">
            <div className="film-paper relative overflow-hidden px-6 py-8 text-center">
              <div className="pointer-events-none absolute inset-2 border border-[#e4cc96]/80" aria-hidden />
              <div className="film-shimmer pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <p className="film-gold relative font-script text-[2.35rem] leading-tight">
                <TypeChars text={phrase} delay={risen ? 0 : 2500} />
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </Stage>
  )
}

function buildScenes(data: EventData): Scene[] {
  const scenes: Scene[] = [
    { id: 'envelope', ms: 7400 },
    { id: 'names', ms: 5200 },
  ]
  const messageLines = data.message.split(/\n+/).filter((line) => line.trim()).length
  if (data.message.trim()) scenes.push({ id: 'message', ms: Math.max(5600, messageLines * 760 + 1800) })
  const parents = [data.parentsLeftNames, data.parentsRightNames].some((value) => value.trim())
  if (parents) scenes.push({ id: 'parents', ms: 5600 })
  if (parseIsoLocal(data.weddingDateTime)) scenes.push({ id: 'calendar', ms: 5600 })
  const hasPlace =
    inviteMomentFilled(data.ceremonyTime, data.ceremonyVenue, data.ceremonyAddress) ||
    inviteMomentFilled(data.receptionTime, data.receptionVenue, data.receptionAddress) ||
    Boolean(data.venue.trim())
  if (hasPlace) scenes.push({ id: 'details', ms: 6800 })
  if (data.dressCodeEnabled !== false && (data.dressCode.trim() || data.guestGuideDress.trim())) {
    scenes.push({ id: 'dress', ms: 5200 })
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
    for (const src of Object.values(PLATES)) {
      const image = new Image()
      image.src = src
    }
  }, [])

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
    body = <Opening mark={mark} phrase={t('invite.filmArrived')} />
  } else if (scene.id === 'names') {
    body = (
      <FramedCopy>
        <p className="font-display text-[1.85rem] italic text-[#5f734f]">{t('invite.filmWeMarry')}</p>
        <div className="film-gold mt-4 font-script text-[3.15rem] leading-[0.95]">
          {names.map((name) => (
            <span key={name} className="mt-1 block">
              {name}
            </span>
          ))}
        </div>
      </FramedCopy>
    )
  } else if (scene.id === 'message') {
    body = (
      <FloralCopy>
        <TypeLines text={data.message} className="film-ink font-display text-[1.2rem] leading-snug" />
      </FloralCopy>
    )
  } else if (scene.id === 'parents') {
    body = (
      <FramedCopy>
        <p className="film-gold font-script text-[2.15rem] leading-tight">{t('invite.filmFamilies')}</p>
        <div className="film-ink mt-6 space-y-4">
          {data.parentsRightNames.trim() ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d7352]">{data.parentsRightLabel.trim() || t('invite.filmGroomFamily')}</p>
              <p className="mt-1 whitespace-pre-line font-display text-[1.45rem] leading-tight">{data.parentsRightNames}</p>
            </div>
          ) : null}
          {data.parentsLeftNames.trim() ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d7352]">{data.parentsLeftLabel.trim() || t('invite.filmBrideFamily')}</p>
              <p className="mt-1 whitespace-pre-line font-display text-[1.45rem] leading-tight">{data.parentsLeftNames}</p>
            </div>
          ) : null}
        </div>
      </FramedCopy>
    )
  } else if (scene.id === 'calendar' && when) {
    const cells = monthCells(when)
    const weekdays = weekdayLabels(locale)
    body = (
      <FramedCopy>
        <p className="film-ink font-script text-[2.2rem] leading-none">{t('invite.filmSaveDate')}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#8d7352]">{t('invite.filmJoin')}</p>
        <p className="film-gold mt-2 font-script text-[2.8rem] capitalize leading-none">
          {when.toLocaleDateString(locale, { month: 'long' })}
        </p>
        <p className="mt-1 font-display text-xl text-[#7d6a4a]">{when.getFullYear()}</p>
        <div className="mx-auto mt-3 grid max-w-[15.5rem] grid-cols-7 gap-y-0.5 text-[11px] text-[#8d7352]">
          {weekdays.map((label) => (
            <span key={label} className="py-0.5 uppercase">
              {label.slice(0, 3)}
            </span>
          ))}
          {cells.map((day, cell) => {
            const marked = day === when.getDate()
            return (
              <span key={`${day ?? 'e'}-${cell}`} className="relative flex h-7 items-center justify-center">
                <span className={marked ? 'relative z-10 font-semibold text-[#3e3832]' : ''}>{day ?? ''}</span>
                {marked ? (
                  <motion.span
                    className="absolute text-[1.55rem] leading-none text-[#7d9480]"
                    initial={prefersReduce() ? false : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.55, delay: 0.35 }}
                    aria-hidden
                  >
                    ♡
                  </motion.span>
                ) : null}
              </span>
            )
          })}
        </div>
      </FramedCopy>
    )
  } else if (scene.id === 'details') {
    body = (
      <FloralCopy>
        <p className="inline-block rounded-full border border-[#e4d3ae] bg-white/75 px-4 py-1 font-script text-[2rem] leading-none text-[#5f734f]">
          {t('invite.filmBigDay')}
        </p>
        {when ? (
          <p className="film-ink mt-3 font-display text-2xl tracking-wide">
            {when.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          {moments.map((item) => (
            <div key={item.title}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#7d9480]">{item.title}</p>
              {item.time.trim() ? <p className="film-ink mt-1 font-display text-[1.7rem]">{displayClock(item.time)}</p> : null}
              {item.venue.trim() ? <p className="film-ink mt-1 font-display text-lg leading-tight">{item.venue}</p> : null}
              {item.address.trim() ? <p className="mt-1 text-sm leading-5 text-[#5c534c]">{item.address}</p> : null}
            </div>
          ))}
        </div>
      </FloralCopy>
    )
  } else if (scene.id === 'dress') {
    body = (
      <FloralCopy>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#5f734f]">{t('invite.filmDress')}</p>
        {data.dressCode.trim() ? <p className="film-gold mt-2 font-script text-[2.6rem] leading-none">{data.dressCode}</p> : null}
        {data.guestGuideDress.trim() && data.guestGuideDress.trim() !== data.dressCode.trim() ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#5c534c]">{data.guestGuideDress}</p>
        ) : null}
      </FloralCopy>
    )
  } else if (scene.id === 'verse') {
    body = (
      <FloralCopy>
        <p className="film-ink font-display text-[1.25rem] leading-snug">
          <TypeChars text={data.verse} delay={280} />
        </p>
      </FloralCopy>
    )
  } else {
    body = (
      <Plate src={PLATES.envelope}>
        <motion.p
          className="absolute left-1/2 top-[9%] z-40 w-[min(88%,340px)] -translate-x-1/2 rounded-full bg-[#e7f0e6]/92 px-5 py-2 text-center font-script text-[1.85rem] leading-none text-[#5f734f] shadow-[0_10px_30px_rgba(80,60,30,0.12)]"
          initial={prefersReduce() ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('invite.filmWaiting')}
        </motion.p>
        <p
          className={`film-gold pointer-events-none absolute left-1/2 top-[57%] z-30 max-w-[5.5rem] -translate-x-1/2 -translate-y-1/2 text-center font-script leading-none ${mark.length > 6 ? 'text-xl' : 'text-[1.85rem]'}`}
        >
          {mark}
        </p>
        <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#f7f1e8] via-[#f7f1e8]/88 to-transparent px-6 pb-8 pt-16 text-center">
          <div className="flex flex-col items-center gap-3">
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
        </div>
      </Plate>
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
          initial={reduce ? false : { opacity: 0, y: 36, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: -28, scale: 1.02 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
