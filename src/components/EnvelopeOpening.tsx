import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { resolveSealMark, type EventData } from '../data/eventData'

type Props = {
  data: EventData
  onOpen: () => void
  onSealUserGesture?: () => void
}

type OpeningPhase = 'idle' | 'seal' | 'flap' | 'card'

const OPENING_FRAME_SRC = '/images/moldura-elegante-aliancas.png'

/**
 * Centro vertical do selo (% da altura da caixa do envelope fechado).
 * Ajuste se mudar o PNG fechado ou os valores ENVELOPE_TEXTURE_ZOOM_*.
 */
const SEAL_ANCHOR_Y = 0.68

/** Pausa com o envelope aberto (arte estática) antes do cartão subir (ms). */
const OPEN_ENVELOPE_HOLD_BEFORE_CARD_MS = 720
/** Crossfade fechado → aberto (s). */
const ENVELOPE_CROSSFADE_S = 0.45

/** Metadados do PNG em `public/images/envelope-burgundy.png` (para caixa sem “letterbox”). */
const ENVELOPE_NATURAL_W = 1024
const ENVELOPE_NATURAL_H = 682
/** Margens brancas no PNG; >1 aproxima o bordô (cortando o “quadro” branco). */
const ENVELOPE_TEXTURE_ZOOM_DESKTOP = 1.24
/** Em viewports estreitas o envelope ocupa mais área útil; zoom maior corta mais o branco. */
const ENVELOPE_TEXTURE_ZOOM_COMPACT = 1.4

function envelopeTextureZoomForViewport(): number {
  if (typeof window === 'undefined') return ENVELOPE_TEXTURE_ZOOM_DESKTOP
  return window.matchMedia('(max-width: 767px)').matches
    ? ENVELOPE_TEXTURE_ZOOM_COMPACT
    : ENVELOPE_TEXTURE_ZOOM_DESKTOP
}

function subscribeEnvelopeTextureZoom(onChange: () => void) {
  const mq = window.matchMedia('(max-width: 767px)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

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

/**
 * Moldura de fundo: em viewports estreitas o PNG (muito alto) com object-contain deixa
 * faixas laterais largas; object-cover + object-bottom preenche a largura e preserva
 * sobretudo a base (alianças). A partir de md volta contain para não cortar no desktop.
 */
function FloralBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[color:var(--color-cream)] px-1 py-2 sm:px-3 sm:py-3 md:p-6"
      aria-hidden
    >
      <img
        src={OPENING_FRAME_SRC}
        alt=""
        className="h-full w-full object-cover object-bottom md:object-contain md:object-center"
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
  const textureZoom = useSyncExternalStore(
    subscribeEnvelopeTextureZoom,
    envelopeTextureZoomForViewport,
    () => ENVELOPE_TEXTURE_ZOOM_DESKTOP,
  )

  const boxStyle = {
    width: 'min(96vw, 400px)',
    height: `min(min(42vh, 320px), calc(min(96vw, 400px) * ${ENVELOPE_NATURAL_H} / ${ENVELOPE_NATURAL_W}))`,
  }

  const imgShared =
    'pointer-events-none absolute left-1/2 top-0 block h-full max-w-none select-none bg-transparent object-cover object-center'

  const imgZoomStyle = {
    width: 'auto' as const,
    minWidth: '100%',
    transform: `translateX(-50%) scale(${textureZoom})`,
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
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden bg-transparent">
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
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: reduce ? 1 : 1.02,
        filter: reduce ? 'none' : 'blur(10px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <FloralBackdrop />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-full flex-col items-center justify-center gap-3 px-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 sm:px-4 sm:py-5 md:max-w-none md:gap-8 md:px-5 md:py-10">
        <p className="shrink-0 px-1 text-center font-display text-base italic leading-snug text-rose-900/35 md:text-xl">
          {data.openingEyebrow}
        </p>

        <div className="flex w-full shrink-0 flex-col items-center justify-center overflow-visible [perspective:1400px]">
          <div
            className="relative mx-auto w-[min(96vw,420px)] min-w-0 transform-gpu md:w-[min(94vw,420px)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.div
              className="pointer-events-none absolute left-1/2 top-[50%] z-[5] w-[min(78%,300px)] max-w-[300px] -translate-x-1/2 rounded-sm border border-rose-200/80 bg-[color:var(--color-blush)] px-4 py-5 text-center shadow-md"
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

        <div className="mb-7 flex w-full max-w-[min(94vw,320px)] shrink-0 flex-col items-center space-y-2 px-1 text-center [&_p]:[text-shadow:0_0_10px_rgba(250,247,242,0.95),0_0_22px_rgba(250,247,242,0.82)] sm:max-w-[min(90vw,300px)] md:mb-9 md:max-w-[300px]">
          <p
            className={`text-[11px] uppercase tracking-[0.3em] transition-opacity duration-300 ${
              inProgress ? 'text-rose-900/15' : 'text-rose-900/40'
            }`}
          >
            {data.openingSealHint}
          </p>
          <p
            className={`font-display text-sm tracking-wide transition-opacity duration-300 ${
              inProgress ? 'text-rose-900/20' : 'text-rose-900/45'
            }`}
          >
            {data.weddingDateLabel}
          </p>
          <p
            className={`font-display text-xs leading-snug transition-opacity duration-300 ${
              inProgress ? 'text-rose-900/18' : 'text-rose-900/40'
            }`}
          >
            {data.venue}
          </p>
          <p
            className={`-translate-y-1 font-display text-xs transition-opacity duration-300 md:-translate-y-1.5 ${
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
