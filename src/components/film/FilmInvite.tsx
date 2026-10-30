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
    }, 28)
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
    }, 650)
    return () => window.clearInterval(id)
  }, [text, lines.length])
  return (
    <div className={className}>
      {lines.slice(0, count).map((line) => (
        <p key={line} className="mt-3">
          {line}
        </p>
      ))}
    </div>
  )
}

function GoldFrame({ children }: { children: ReactNode }) {
  const bar = 'pointer-events-none absolute border-[#c6a56a]'
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f7f2ea] px-6 py-16 text-center text-[#3e3832]">
      <span className={`${bar} left-4 top-4 h-16 w-16 border-l-2 border-t-2`} />
      <span className={`${bar} left-6 top-6 h-10 w-10 border-l border-t`} />
      <span className={`${bar} right-4 top-4 h-16 w-16 border-r-2 border-t-2`} />
      <span className={`${bar} right-6 top-6 h-10 w-10 border-r border-t`} />
      <span className={`${bar} bottom-4 left-4 h-16 w-16 border-b-2 border-l-2`} />
      <span className={`${bar} bottom-6 left-6 h-10 w-10 border-b border-l`} />
      <span className={`${bar} bottom-4 right-4 h-16 w-16 border-b-2 border-r-2`} />
      <span className={`${bar} bottom-6 right-6 h-10 w-10 border-b border-r`} />
      <WhiteBouquet className="pointer-events-none absolute -left-10 -top-2 w-44 -rotate-6 opacity-95" />
      <WhiteBouquet className="pointer-events-none absolute -bottom-6 -right-10 w-40 rotate-12 opacity-95" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  )
}

function MarbleStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f6f1e8] text-[#3f4a38]">
      <div className="absolute inset-y-0 left-0 w-[34%] bg-[linear-gradient(180deg,#e4efe4,#f7f2ea)]" aria-hidden />
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(255,255,255,0.45) 30%, #f7f4ef), repeating-linear-gradient(115deg, transparent 0 16px, rgba(210,206,198,0.28) 17px 18px)',
        }}
        aria-hidden
      />
      <WhiteBouquet className="pointer-events-none absolute -left-16 top-6 w-56" />
      <div className="pointer-events-none absolute bottom-[18%] left-[8%] h-14 w-8 rounded-sm bg-[#fbf8f3] shadow-md" aria-hidden>
        <span className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#ffe7a3] blur-[1px]" />
      </div>
      <div className="relative z-10 flex min-h-dvh items-center pl-[36%] pr-5">
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}

function EnvelopeStill({ mark }: { mark: string }) {
  return (
    <div className="relative mx-auto aspect-[5/4.7] w-[min(78vw,320px)]">
      <div className="absolute inset-0 bg-[#fbf8f3] shadow-[0_22px_40px_rgba(92,70,40,0.18)]">
        <div className="absolute inset-x-0 top-0 h-[54%] bg-[#f3ece2]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
      </div>
      <div
        className="absolute bottom-0 left-1/2 top-0 z-10 w-[15%] -translate-x-1/2 border-x-2 border-[#c6a56a]"
        style={{ background: 'linear-gradient(90deg, #d5e3d6, #f4f8f2 46%, #c5d4c8 54%, #e7f0e4)' }}
      />
      <div
        className="absolute left-0 right-0 top-[40%] z-20 h-[16%] border-y-2 border-[#c6a56a]"
        style={{ background: 'linear-gradient(180deg, #e7f1e6, #c9d8ca 48%, #b7c9b8)' }}
      />
      <WhiteBouquet className="pointer-events-none absolute left-1/2 top-[63%] z-40 w-[74%] -translate-x-1/2" />
      <div className="absolute left-1/2 top-[46%] z-30 w-[46%] -translate-x-1/2 -translate-y-1/2">
        <MonogramMark mark={mark} />
      </div>
    </div>
  )
}

function buildScenes(data: EventData): Scene[] {
  const scenes: Scene[] = [
    { id: 'envelope', ms: 3800 },
    { id: 'arrived', ms: 3600 },
    { id: 'names', ms: 4600 },
  ]
  const messageLines = data.message.split(/\n+/).filter((line) => line.trim()).length
  if (data.message.trim()) scenes.push({ id: 'message', ms: Math.max(5200, messageLines * 700 + 1600) })
  const parents = [data.parentsLeftNames, data.parentsRightNames].some((value) => value.trim())
  if (parents) scenes.push({ id: 'parents', ms: 5400 })
  if (parseIsoLocal(data.weddingDateTime)) scenes.push({ id: 'calendar', ms: 5200 })
  const hasPlace = inviteMomentFilled(data.ceremonyTime, data.ceremonyVenue, data.ceremonyAddress) || inviteMomentFilled(data.receptionTime, data.receptionVenue, data.receptionAddress) || Boolean(data.venue.trim())
  if (hasPlace) scenes.push({ id: 'details', ms: 6200 })
  if (data.dressCodeEnabled !== false && (data.dressCode.trim() || data.guestGuideDress.trim())) {
    scenes.push({ id: 'dress', ms: 4600 })
  }
  if (data.verse.trim()) scenes.push({ id: 'verse', ms: 6400 })
  scenes.push({ id: 'closing', ms: 1200 })
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
      <div className="flex min-h-dvh items-center justify-center bg-[#f3ecdf]">
        <EnvelopeStill mark={mark} />
      </div>
    )
  } else if (scene.id === 'arrived') {
    body = (
      <GoldFrame>
        <p className="font-script text-5xl leading-tight text-[#b8956b]">
          <TypeChars text={t('invite.filmArrived')} />
        </p>
      </GoldFrame>
    )
  } else if (scene.id === 'names') {
    body = (
      <GoldFrame>
        <p className="font-display text-3xl italic text-[#5f734f]">{t('invite.filmWeMarry')}</p>
        <div className="mt-4 font-script text-6xl leading-none text-[#b8956b]">
          {names.map((name) => (
            <span key={name} className="mt-2 block">
              {name}
            </span>
          ))}
        </div>
        <svg viewBox="0 0 78 36" className="mx-auto mt-8 h-8 w-16" aria-hidden>
          <ellipse cx="26" cy="18" rx="16" ry="11" fill="none" stroke="#c6a56a" strokeWidth="3" />
          <ellipse cx="48" cy="18" rx="16" ry="11" fill="none" stroke="#e6d3a4" strokeWidth="3" />
        </svg>
      </GoldFrame>
    )
  } else if (scene.id === 'message') {
    body = (
      <MarbleStage>
        <TypeLines text={data.message} className="font-display text-[1.65rem] leading-snug text-[#4d5c45]" />
      </MarbleStage>
    )
  } else if (scene.id === 'parents') {
    body = (
      <GoldFrame>
        <p className="font-script text-4xl leading-tight text-[#b8956b]">{t('invite.filmFamilies')}</p>
        <div className="mt-8 space-y-5 text-sm">
          {data.parentsRightNames.trim() ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d7352]">{data.parentsRightLabel.trim() || t('invite.filmGroomFamily')}</p>
              <p className="mt-1 whitespace-pre-line font-display text-2xl">{data.parentsRightNames}</p>
            </div>
          ) : null}
          {data.parentsLeftNames.trim() ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d7352]">{data.parentsLeftLabel.trim() || t('invite.filmBrideFamily')}</p>
              <p className="mt-1 whitespace-pre-line font-display text-2xl">{data.parentsLeftNames}</p>
            </div>
          ) : null}
        </div>
      </GoldFrame>
    )
  } else if (scene.id === 'calendar' && when) {
    const cells = monthCells(when)
    const weekdays = weekdayLabels(locale)
    body = (
      <GoldFrame>
        <p className="font-script text-4xl text-[#3f4a38]">{t('invite.filmSaveDate')}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#8d7352]">{t('invite.filmJoin')}</p>
        <p className="mt-4 font-script text-5xl capitalize text-[#b8956b]">
          {when.toLocaleDateString(locale, { month: 'long' })}
        </p>
        <p className="font-display text-2xl text-[#7d6a4a]">{when.getFullYear()}</p>
        <div className="mx-auto mt-4 grid max-w-[280px] grid-cols-7 gap-1 text-xs text-[#8d7352]">
          {weekdays.map((label) => (
            <span key={label} className="py-1 text-[10px] uppercase">
              {label.slice(0, 3)}
            </span>
          ))}
          {cells.map((day, cell) => {
            const marked = day === when.getDate()
            return (
              <span key={`${day ?? 'e'}-${cell}`} className={`flex h-8 items-center justify-center ${marked ? 'font-semibold text-[#5f734f]' : ''}`}>
                {marked ? '♡' : day ?? ''}
              </span>
            )
          })}
        </div>
      </GoldFrame>
    )
  } else if (scene.id === 'details') {
    body = (
      <MarbleStage>
        <p className="font-script text-5xl text-[#5f734f]">{t('invite.filmBigDay')}</p>
        {when ? (
          <p className="mt-3 font-display text-2xl tracking-wide text-[#3e3832]">
            {when.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        ) : null}
        <div className="mt-5 space-y-4">
          {moments.map((item) => (
            <div key={item.title}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#7d9480]">{item.title}</p>
              {item.time.trim() ? <p className="mt-1 font-display text-3xl text-[#3e3832]">{displayClock(item.time)}</p> : null}
              {item.venue.trim() ? <p className="mt-1 text-sm">{item.venue}</p> : null}
              {item.address.trim() ? <p className="text-sm leading-5 text-[#5c534c]">{item.address}</p> : null}
            </div>
          ))}
        </div>
      </MarbleStage>
    )
  } else if (scene.id === 'dress') {
    body = (
      <GoldFrame>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#5f734f]">{t('invite.filmDress')}</p>
        {data.dressCode.trim() ? <p className="mt-3 font-script text-5xl text-[#b8956b]">{data.dressCode}</p> : null}
        {data.guestGuideDress.trim() && data.guestGuideDress.trim() !== data.dressCode.trim() ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5c534c]">{data.guestGuideDress}</p>
        ) : null}
      </GoldFrame>
    )
  } else if (scene.id === 'verse') {
    body = (
      <MarbleStage>
        <p className="font-display text-[1.7rem] leading-snug text-[#4d5c45]">
          <TypeChars text={data.verse} />
        </p>
      </MarbleStage>
    )
  } else {
    body = (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f3ecdf] px-6 text-center">
        <p className="font-script text-5xl text-[#5f734f]">{t('invite.filmWaiting')}</p>
        <div className="mt-8">
          <EnvelopeStill mark={mark} />
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
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
          <button type="button" onClick={replay} className="mt-2 text-xs uppercase tracking-[0.2em] text-[#8d7352]">
            {t('invite.filmReplay')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f6f1e8]">
      <div className="absolute left-0 right-0 top-0 z-50 h-1 bg-[#eadfca]" aria-hidden>
        <div className="h-full bg-[#c6a56a] transition-[width] duration-700" style={{ width: `${((index + 1) / scenes.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          className="min-h-dvh"
          initial={prefersReduce() ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduce() ? undefined : { opacity: 0, y: -14 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
