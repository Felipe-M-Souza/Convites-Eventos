import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { resolveSealMark, type EventData } from '../data/eventData'

type Props = {
  data: EventData
  onOpen: () => void
  onSealUserGesture?: () => void
}

type OpeningPhase = 'idle' | 'seal' | 'flap' | 'card'

const OPENING_FRAME_SRC = '/images/floral-convite-frame.png'

/**
 * Centro vertical do selo (% da altura da caixa do envelope fechado).
 * Ajuste se mudar o PNG fechado ou ENVELOPE_TEXTURE_ZOOM.
 */
const SEAL_ANCHOR_Y = 0.68

/** Pausa com o envelope aberto (arte estática) antes do cartão subir (ms). */
const OPEN_ENVELOPE_HOLD_BEFORE_CARD_MS = 720
/** Crossfade fechado → aberto (s). */
const ENVELOPE_CROSSFADE_S = 0.45

/** Metadados do PNG em `public/images/envelope-burgundy.png` (para caixa sem “letterbox”). */
const ENVELOPE_NATURAL_W = 1024
const ENVELOPE_NATURAL_H = 682
/** O ficheiro tem margens brancas à volta do bordô; >1 recorta-as (ideal: PNG com transparência). */
const ENVELOPE_TEXTURE_ZOOM = 1.19

const sealGold = {
  background: `
    radial-gradient(circle at 32% 28%, #fff8e7 0%, #e8d5a8 18%, #c9a24d 42%, #a67c2e 68%, #6b4a1c 100%)
  `,
  boxShadow: `
    inset 0 2px 5px rgba(255,255,255,0.55),
    inset 0 -4px 10px rgba(60,40,10,0.35),
    0 10px 24px rgba(60, 20, 20, 0.28),
    0 2px 0 rgba(255,255,255,0.2)
  `,
}

function FloralBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[color:var(--color-cream)]"
      aria-hidden
    >
      <img
        src={OPENING_FRAME_SRC}
        alt=""
        className="h-full min-h-full w-full object-cover object-center md:object-contain"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  )
}

type TearingGoldSealProps = {
  torn: boolean
  reduce: boolean
  mark: string
}

function TearingGoldSeal({ torn, reduce, mark }: TearingGoldSealProps) {
  const compact = mark.replace(/\s/g, '').length <= 2
  const sz = compact ? 54 : 58
  const half = sz / 2

  const tearL = reduce
    ? { x: 0, rotate: 0, opacity: 0 }
    : { x: -24, rotate: -32, opacity: 0 }
  const tearR = reduce
    ? { x: 0, rotate: 0, opacity: 0 }
    : { x: 24, rotate: 32, opacity: 0 }

  return (
    <motion.div
      className="relative"
      style={{ width: sz, height: sz }}
      animate={torn || reduce ? { scale: 1 } : { scale: [1, 1.045, 1] }}
      transition={
        torn || reduce
          ? { duration: 0.2 }
          : { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
      }
    >
      <motion.div
        className="absolute left-0 top-0 overflow-hidden rounded-l-full"
        style={{ width: half, height: sz }}
        initial={false}
        animate={torn ? tearL : { x: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: reduce ? 0.18 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute left-0 top-0 rounded-full"
          style={{ width: sz, height: sz, ...sealGold }}
        >
          <div
            className="pointer-events-none absolute inset-[5px] rounded-full border border-amber-950/20"
            style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35)' }}
          />
        </div>
      </motion.div>

      <motion.div
        className="absolute right-0 top-0 overflow-hidden rounded-r-full"
        style={{ width: half, height: sz }}
        initial={false}
        animate={torn ? tearR : { x: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: reduce ? 0.18 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute top-0 rounded-full"
          style={{ width: sz, height: sz, right: 0, ...sealGold }}
        >
          <div
            className="pointer-events-none absolute inset-[5px] rounded-full border border-amber-950/20"
            style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35)' }}
          />
        </div>
      </motion.div>

      <svg
        className="pointer-events-none absolute inset-0 text-amber-950/15"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
      >
        <circle cx="50" cy="50" r="46" />
        <circle cx="50" cy="50" r="38" />
      </svg>

      <motion.span
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-center font-display font-semibold leading-tight text-amber-950/85 ${
          compact ? 'text-[1.35rem] tracking-tight' : 'text-[0.82rem] tracking-wide'
        }`}
        animate={torn ? { opacity: 0, scale: 0.72, y: 3 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.14, ease: 'easeOut' }}
      >
        {mark}
      </motion.span>

      {torn && !reduce ? (
        <motion.div
          key="tear-glint"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
          initial={{ opacity: 0, scaleX: 0.15 }}
          animate={{ opacity: [0, 0.95, 0], scaleX: [0.15, 1, 1.05] }}
          transition={{ duration: 0.26, delay: 0.04, ease: 'easeOut' }}
          aria-hidden
        />
      ) : null}
    </motion.div>
  )
}

type OpeningEnvelopeProps = {
  closedSrc: string
  openSrc: string
  showOpenArt: boolean
  cardOut: boolean
  reduce: boolean
  children: ReactNode
}

/** Envelope fechado (uma textura) → após o selo, crossfade para PNG do envelope aberto. */
function OpeningEnvelope({
  closedSrc,
  openSrc,
  showOpenArt,
  cardOut,
  reduce,
  children,
}: OpeningEnvelopeProps) {
  const boxStyle = {
    width: 'min(94vw, 400px)',
    height: `min(min(42vh, 320px), calc(min(94vw, 400px) * ${ENVELOPE_NATURAL_H} / ${ENVELOPE_NATURAL_W}))`,
  }

  const imgShared =
    'pointer-events-none absolute left-1/2 top-0 block h-full max-w-none select-none object-cover object-center'

  const imgZoomStyle = {
    width: 'auto' as const,
    minWidth: '100%',
    transform: `translateX(-50%) scale(${ENVELOPE_TEXTURE_ZOOM})`,
    transformOrigin: 'top center' as const,
  }

  const fade = reduce ? 0.16 : ENVELOPE_CROSSFADE_S

  return (
    <motion.div
      className="relative mx-auto bg-transparent"
      style={boxStyle}
      initial={false}
      animate={{ opacity: cardOut ? 0 : 1 }}
      transition={{ duration: reduce ? 0.2 : 0.48, ease: 'easeOut' }}
    >
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <motion.img
          src={closedSrc}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className={`${imgShared} drop-shadow-[0_14px_28px_rgba(50,10,20,0.2)]`}
          style={imgZoomStyle}
          initial={false}
          animate={{ opacity: showOpenArt ? 0 : 1 }}
          transition={{ duration: fade, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.img
          src={openSrc}
          alt=""
          draggable={false}
          decoding="async"
          className={`${imgShared} drop-shadow-[0_14px_28px_rgba(50,10,20,0.2)]`}
          style={imgZoomStyle}
          initial={false}
          animate={{ opacity: showOpenArt ? 1 : 0 }}
          transition={{ duration: fade, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[30]">
        <div
          className="pointer-events-none absolute left-1/2 transition-opacity duration-200 ease-out"
          style={{
            top: `${SEAL_ANCHOR_Y * 100}%`,
            transform: 'translate(-50%, -50%)',
            opacity: showOpenArt ? 0 : 1,
          }}
        >
          {children}
        </div>
      </div>
    </motion.div>
  )
}

export function EnvelopeOpening({ data, onOpen, onSealUserGesture }: Props) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<OpeningPhase>('idle')

  const envelopeSrc = data.openingEnvelopeImageUrl?.trim() || '/images/envelope-burgundy.png'
  const envelopeOpenSrc =
    data.openingEnvelopeOpenImageUrl?.trim() || '/images/envelope-open.png'

  /** Pré-carrega o PNG aberto para o crossfade não “piscar”. */
  useEffect(() => {
    const img = new Image()
    img.src = envelopeOpenSrc
  }, [envelopeOpenSrc])

  const timing = useMemo(
    () => ({
      sealToFlapMs: reduce ? 220 : 780,
      /** Após mostrar o envelope aberto (crossfade + pausa), o cartão sobe. */
      flapToCardMs: reduce ? 200 : OPEN_ENVELOPE_HOLD_BEFORE_CARD_MS,
      cardToLeaveMs: reduce ? 480 : 2200,
    }),
    [reduce],
  )

  useEffect(() => {
    if (phase !== 'seal') return undefined
    const id = window.setTimeout(() => setPhase('flap'), timing.sealToFlapMs)
    return () => window.clearTimeout(id)
  }, [phase, timing.sealToFlapMs])

  useEffect(() => {
    if (phase !== 'flap') return undefined
    const id = window.setTimeout(() => setPhase('card'), timing.flapToCardMs)
    return () => window.clearTimeout(id)
  }, [phase, timing.flapToCardMs])

  useEffect(() => {
    if (phase !== 'card') return undefined
    const id = window.setTimeout(() => onOpen(), timing.cardToLeaveMs)
    return () => window.clearTimeout(id)
  }, [phase, timing.cardToLeaveMs, onOpen])

  const handleSealClick = () => {
    if (phase !== 'idle') return
    onSealUserGesture?.()
    setPhase('seal')
  }

  const sealTorn = phase !== 'idle'
  const flapOpen = phase === 'flap' || phase === 'card'
  const cardOut = phase === 'card'

  const cardDur = reduce ? 0.22 : 0.72
  const sealMark = resolveSealMark(data)
  const inProgress = phase !== 'idle'

  return (
    <motion.div
      className="fixed inset-0 z-[60] px-5"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: reduce ? 1 : 1.02,
        filter: reduce ? 'none' : 'blur(10px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <FloralBackdrop />

      <div className="relative z-10 flex min-h-dvh flex-col items-center pb-8 pt-10 max-md:justify-between max-md:pb-[max(1rem,env(safe-area-inset-bottom))] max-md:pt-[max(1rem,env(safe-area-inset-top))] md:justify-center">
        <p className="mb-3 max-w-xs shrink-0 -translate-y-2 text-center font-display text-lg italic text-rose-900/35 max-md:mb-1 max-md:translate-y-0 md:-translate-y-3 md:text-xl">
          {data.openingEyebrow}
        </p>

        <div className="-mt-3 flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center overflow-visible [perspective:1400px] max-md:my-1 md:my-0 md:-mt-4 md:block md:flex-none">
          <div
            className="relative mx-auto min-h-0 w-[min(94vw,420px)] transform-gpu"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.div
              className="pointer-events-none absolute left-1/2 top-[50%] z-[5] w-[min(78%,300px)] max-w-[300px] -translate-x-1/2 rounded-sm border border-rose-100/90 bg-white px-4 py-5 text-center shadow-md"
              initial={{ y: 32, rotateX: 0, opacity: 0 }}
              animate={{
                y: cardOut ? -122 : 32,
                rotateX: cardOut ? 4 : 0,
                /** Invisível atrás do envelope até a fase do cartão — evita “moldura” branca nas laterais. */
                opacity: cardOut ? 1 : 0,
              }}
              transition={{
                duration: cardDur,
                delay: 0,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformStyle: 'preserve-3d' }}
              aria-hidden={!cardOut}
            >
              <p className="font-display text-lg italic text-rose-900/55">Save the Date</p>
              <p className="mt-2 font-display text-xl font-semibold text-stone-800">
                {data.coupleNames}
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                {data.weddingDateLabel}
                <br />
                {data.time} · {data.venue}
              </p>
            </motion.div>

            <div className="relative z-[20] mx-auto flex w-full max-w-[400px] justify-center">
              <OpeningEnvelope
                closedSrc={envelopeSrc}
                openSrc={envelopeOpenSrc}
                showOpenArt={flapOpen}
                cardOut={cardOut}
                reduce={Boolean(reduce)}
              >
                <div className="pointer-events-auto">
                  <button
                    type="button"
                    disabled={inProgress}
                    onClick={handleSealClick}
                    className="cursor-pointer rounded-full border-0 bg-transparent p-1 outline-none transition hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-amber-600/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none"
                    style={{ touchAction: 'manipulation' }}
                    aria-label={data.openingSealHint}
                  >
                    <TearingGoldSeal
                      torn={sealTorn}
                      reduce={Boolean(reduce)}
                      mark={sealMark}
                    />
                  </button>
                </div>
              </OpeningEnvelope>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-[280px] shrink-0 flex-col items-center pt-6 max-md:pt-2 md:pt-0">
          <p
            className={`text-center text-[11px] uppercase tracking-[0.32em] transition-opacity duration-300 md:mt-8 ${
              inProgress ? 'text-rose-900/15' : 'text-rose-900/40'
            }`}
          >
            {data.openingSealHint}
          </p>
          <p
            className={`mt-2.5 text-center font-display text-sm tracking-wide transition-opacity duration-300 ${
              inProgress ? 'text-rose-900/20' : 'text-rose-900/45'
            }`}
          >
            {data.weddingDateLabel}
          </p>
          <p
            className={`mt-1.5 text-center font-display text-xs leading-snug transition-opacity duration-300 ${
              inProgress ? 'text-rose-900/18' : 'text-rose-900/40'
            }`}
          >
            {data.venue}
          </p>
          <p
            className={`mt-0.5 text-center font-display text-xs transition-opacity duration-300 ${
              inProgress ? 'text-rose-900/18' : 'text-rose-900/40'
            }`}
          >
            {data.time}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
