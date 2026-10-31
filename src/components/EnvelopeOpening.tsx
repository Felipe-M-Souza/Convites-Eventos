import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { resolveSealMark, type EventData } from '../data/eventData'
import { useI18n } from '../i18n/useI18n'

type Props = {
  data: EventData
  /** Slug do convite (`/c/:slug`) — usado só para fallback do modo futebol. */
  inviteSlug?: string
  onOpen: () => void
  onSealUserGesture?: () => void
}

type OpeningPhase = 'idle' | 'seal' | 'flap' | 'card'

const OPENING_FRAME_SRC = '/images/moldura-elegante-aliancas.png'

/** Slugs que usam abertura «bola no gol» mesmo sem `openingInteractionMode` no JSON guardado. */
const SOCCER_GOAL_SLUG_FALLBACKS: readonly string[] = ['san-barssoti']
/** Slugs que usam borboleta no lugar do selo mesmo sem `openingInteractionMode` no JSON guardado. */
const BUTTERFLY_SEAL_SLUG_FALLBACKS: readonly string[] = ['cleyzamara']
/** Borboleta de joia (rosa, azul e dourado), no lugar do selo de cera. */
const JEWEL_BUTTERFLY_SLUGS: readonly string[] = ['eduarda-monteiro-18']
/** Slugs que usam um pandeiro no lugar do selo (tema pagode). */
const PANDEIRO_SEAL_SLUGS: readonly string[] = ['rafaele-41-anos']
/** Brinde (chopp + caipirinha) no lugar do selo, antes de abrir o envelope. */
const TOAST_BEFORE_FLAP_MS = 980

/**
 * Envelopes com fundo branco recortado (PNG com transparência) para que a moldura apareça
 * ao redor da arte, sem “bordas brancas” — fechado e aberto. Sobrepõe o URL guardado no CMS.
 */
type EnvelopeTransparentOverride = {
  /** Vazio = mantém a arte guardada no convite. */
  closed?: string
  open?: string
  /** Dimensões nativas da arte fechada (define a proporção da caixa). */
  naturalWidth?: number
  naturalHeight?: number
  /** Dimensões nativas da arte aberta, quando diferem da fechada (ativa object-contain). */
  openNaturalWidth?: number
  openNaturalHeight?: number
  /** Zoom da textura (1 = sem crop; mostra a arte inteira). */
  textureZoom?: number
  /** Reposiciona o selo (fração vertical da caixa) quando a moldura muda a geometria. */
  sealAnchorY?: number
  /** Teto de altura da caixa em vh (dá mais espaço a artes altas/retrato). */
  boxHeightVhCap?: number
  /** Teto da largura da caixa, em px. */
  boxWidthMaxPx?: number
  /** Teto da altura da caixa, em px. */
  boxMaxHeightPx?: number
  /** Largura da caixa no celular, em vw. */
  compactWidthVw?: number
  /** Sobe o envelope para encostar na moldura (valor CSS, ex.: -1.5rem). */
  marginTop?: string
  /**
   * A caixa usa a proporção da arte que está na tela.
   * Evita o letterbox da arte fechada quando o PNG aberto é mais alto.
   */
  fitVisibleArt?: boolean
}

/**
 * Tamanho e posição da abertura, só por slug. Não grava no Supabase e não altera os outros convites.
 * O texto do selo, a data, o local e o horário andam juntos com o envelope.
 */
type EnvelopeSizeOverride = {
  boxWidthMaxPx?: number
  boxHeightVhCap?: number
  boxMaxHeightPx?: number
  textureZoom?: number
  /** Empurra o envelope e o texto para baixo, sem recentralizar o bloco. */
  shiftY?: string
  /** Corrige o centro horizontal dentro da moldura. */
  shiftX?: string
  /** Aproxima o texto do envelope. No desktop o espaço padrão de 32px cai no buquê. */
  columnGap?: string
}

const ENVELOPE_SIZE_OVERRIDES: Record<string, EnvelopeSizeOverride> = {
  /**
   * Moldura 1087×1447. O miolo útil fica abaixo do «15 Anos» e acima das rosas.
   * 300px ainda cobria o título; 10vh enterrava a data no buquê.
   */
  'kemilly-15-anos': {
    boxWidthMaxPx: 268,
    boxHeightVhCap: 28,
    boxMaxHeightPx: 210,
    textureZoom: 1,
    shiftY: '4vh',
    shiftX: '8px',
    columnGap: '12px',
  },
}

const ENVELOPE_TRANSPARENT_OVERRIDES: Record<string, EnvelopeTransparentOverride> = {
  cleyzamara: {
    closed: '/images/envelopes/cleyzamara-closed.png',
    open: '/images/envelopes/cleyzamara-open.png',
  },
  'exemplo-60-anos': {
    closed: '/images/envelopes/exemplo-60-anos-closed.png',
    open: '/images/envelopes/exemplo-60-anos-open.png',
    naturalWidth: 1448,
    naturalHeight: 1086,
    openNaturalWidth: 1122,
    openNaturalHeight: 1402,
    textureZoom: 1,
    sealAnchorY: 0.57,
    boxHeightVhCap: 52,
  },
  /**
   * JPG 1536×1024 com margem branca. Zoom 1 mostra o envelope inteiro;
   * a mistura multiply (no slug) some com a faixa branca que cortava a moldura.
   * O pandeiro fica na ponta da aba.
   */
  'rafaele-41-anos': {
    naturalWidth: 1536,
    naturalHeight: 1024,
    textureZoom: 1,
    sealAnchorY: 0.71,
  },
  /**
   * Churrasco 1657×949 (fechado) e 1202×1309 (aberto). O painel gravou 1024×682,
   * e o zoom padrão cortava as laterais — mais no celular. O selo fica na ponta da aba.
   */
  'paloma-48': {
    naturalWidth: 1657,
    naturalHeight: 949,
    openNaturalWidth: 1202,
    openNaturalHeight: 1309,
    textureZoom: 1,
    /** O par de copos fica na ponta da aba; o centro do desenho é um pouco acima do V. */
    sealAnchorY: 0.66,
    boxHeightVhCap: 58,
    boxWidthMaxPx: 300,
    boxMaxHeightPx: 420,
    compactWidthVw: 58,
    fitVisibleArt: true,
  },
  /**
   * Galáxia 1657×949 (fechado) e 1536×1024 (aberto). O painel gravou 1024×682
   * e o zoom padrão cortava as bordas. A borboleta fica na ponta da aba.
   */
  'eduarda-monteiro-18': {
    naturalWidth: 1657,
    naturalHeight: 949,
    openNaturalWidth: 1536,
    openNaturalHeight: 1024,
    textureZoom: 1,
    sealAnchorY: 0.6,
    boxHeightVhCap: 48,
    boxWidthMaxPx: 340,
    boxMaxHeightPx: 380,
    compactWidthVw: 68,
    fitVisibleArt: true,
  },
  /**
   * Kemilly: envelope floral 1536×1024 sem selo pintado.
   * O laço fica na ponta da aba (o ouro do V termina por volta de 77% da altura).
   */
  'kemilly-15-anos': {
    closed: '/images/envelopes/kemilly-15-anos-closed.png',
    /** Sem arte aberta nova: o cartão sobe deste envelope, sem cruzar para o PNG antigo. */
    open: '/images/envelopes/kemilly-15-anos-closed.png',
    naturalWidth: 1536,
    naturalHeight: 1024,
    textureZoom: 1,
    sealAnchorY: 0.72,
  },
}
/** Artes de envelope com canvas claro que deve mesclar com a moldura do convite. */
const ENVELOPE_BLEND_SLUG_FALLBACKS: readonly string[] = ['fernando-correia']

/**
 * Artes de envelope completas (envelope centrado com margem branca, ex.: borboleta) não devem
 * levar o zoom padrão que corta as bordas: mostra a arte inteira, fechada e aberta.
 */
const BUTTERFLY_ENVELOPE_TEXTURE_ZOOM = 1

/**
 * Centro vertical do selo (% da altura da caixa do envelope fechado).
 * ~0,8 aproxima o selo à ponta do aba nos PNGs 1536×1024; ajuste por convite em `openingSealAnchorY`.
 */
const SEAL_ANCHOR_Y = 0.8
/** Centro horizontal do selo (0–1). */
const SEAL_ANCHOR_X = 0.5

/** Pausa com o envelope aberto (arte estática) antes do cartão subir (ms). */
const OPEN_ENVELOPE_HOLD_BEFORE_CARD_MS = 720
/** Crossfade fechado → aberto (s). */
const ENVELOPE_CROSSFADE_S = 0.45

/** Metadados do PNG em `public/images/envelope-burgundy.png` (para caixa sem “letterbox”). */
const ENVELOPE_NATURAL_W = 1024
const ENVELOPE_NATURAL_H = 682
/** Margens brancas no PNG; >1 aproxima o bordô (cortando o “quadro” branco). */
const ENVELOPE_TEXTURE_ZOOM_DESKTOP = 1.24
/** Telefone: envelope mais estreito + zoom um pouco menor que antes para não cortar filigranas. */
const ENVELOPE_TEXTURE_ZOOM_COMPACT = 1.32
/** Demo padrão: preserva as bordas e a aba do envelope durante a abertura. */
const DEFAULT_INVITE_ENVELOPE_TEXTURE_ZOOM = 1.12

/** Largura da caixa do envelope em vw (≤767px vs maior). */
const ENVELOPE_WIDTH_VW_COMPACT = 84
const ENVELOPE_WIDTH_VW_DESKTOP = 94

function isOpeningCompactViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

function positiveOverride(...values: Array<number | null | undefined>): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  }
  return 400
}

function subscribeOpeningCompactViewport(onChange: () => void) {
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
 * Margem vazia do PNG (fração da imagem). A caixa usa a proporção do arquivo inteiro,
 * igual às outras molduras; a imagem cresce só o bastante para a faixa branca sair.
 */
type FrameMarginCrop = {
  top: number
  right: number
  bottom: number
  left: number
  naturalWidth: number
  naturalHeight: number
}

const RAFAELE_FRAME_CROP: FrameMarginCrop = {
  top: 16 / 1536,
  right: 27 / 1024,
  bottom: 31 / 1536,
  left: 38 / 1024,
  naturalWidth: 1024,
  naturalHeight: 1536,
}

/**
 * Moldura de fundo: em viewports estreitas o PNG (muito alto) com object-contain deixa
 * faixas laterais largas; object-cover + object-bottom preenche a largura e preserva
 * sobretudo a base (alianças). A partir de md volta contain para não cortar no desktop.
 */
function FloralBackdrop({
  frameSrc,
  backdropColor,
  crop,
  flushTop = false,
}: {
  frameSrc: string
  /** Vazio = creme padrão; ex. `#141416` para molduras escuras. */
  backdropColor?: string
  crop?: FrameMarginCrop
  /** Encosta a moldura no topo da tela, sem a faixa creme. */
  flushTop?: boolean
}) {
  const bg =
    backdropColor?.trim() ||
    'var(--color-cream)'
  const contentW = crop ? 1 - crop.left - crop.right : 1
  const contentH = crop ? 1 - crop.top - crop.bottom : 1
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        flushTop ? 'px-2.5 pb-2 pt-0 sm:px-3 sm:pb-3 sm:pt-0 md:px-6 md:pb-6 md:pt-0' : 'px-2.5 py-2 sm:px-3 sm:py-3 md:p-6'
      }`}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {crop ? (
        <div className="flex h-full w-full items-end justify-center overflow-hidden md:items-center">
          <div
            className="relative h-full max-h-full overflow-hidden"
            style={{ aspectRatio: `${crop.naturalWidth} / ${crop.naturalHeight}` }}
          >
            <img
              src={frameSrc}
              alt=""
              className="absolute max-w-none"
              style={{
                width: `${(1 / contentW) * 100}%`,
                height: `${(1 / contentH) * 100}%`,
                left: `${(-crop.left / contentW) * 100}%`,
                top: `${(-crop.top / contentH) * 100}%`,
              }}
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </div>
      ) : (
        <img
          src={frameSrc}
          alt=""
          className={
            flushTop
              ? 'h-[calc(100%+22px)] w-full -translate-y-3 object-cover object-top md:h-[calc(100%+16px)] md:-translate-y-3 md:object-contain md:object-top'
              : 'h-full w-full object-cover object-bottom md:object-contain md:object-center'
          }
          decoding="async"
          fetchPriority="high"
        />
      )}
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

type SoccerGoalKickProps = {
  reduce: boolean
  torn: boolean
  /** Primeiro gesto do convidado (ex.: dar play ao áudio) — no início do toque, não só ao golo. */
  onUserGesture?: () => void
  onScored: () => void
  ariaLabel: string
}

/** Trave + bola: o toque dispara a animação até à baliza e chama `onScored` (abre o envelope). */
function SoccerGoalKick({ reduce, torn, onUserGesture, onScored, ariaLabel }: SoccerGoalKickProps) {
  const [kickStarted, setKickStarted] = useState(false)
  const scoredRef = useRef(false)

  const handleActivate = () => {
    if (torn || kickStarted || scoredRef.current) return
    onUserGesture?.()
    if (reduce) {
      scoredRef.current = true
      onScored()
      return
    }
    setKickStarted(true)
  }

  const handleAnimComplete = () => {
    if (scoredRef.current || !kickStarted) return
    scoredRef.current = true
    onScored()
  }

  return (
    <motion.div
      className="relative select-none"
      style={{ width: 96, height: 84 }}
      animate={{ opacity: torn ? 0 : 1, scale: torn ? 0.88 : 1 }}
      transition={{ duration: reduce ? 0.12 : 0.22 }}
    >
      <svg
        viewBox="0 0 88 52"
        className="pointer-events-none absolute bottom-5 left-1/2 w-[88px] -translate-x-1/2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
        aria-hidden
      >
        <path d="M12 10 V46" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
        <path d="M76 10 V46" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 10 H76" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M16 14 H72 M20 20 H68 M24 26 H64"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.2"
        />
      </svg>

      <motion.div
        className="pointer-events-none absolute left-[6px] top-[36px] flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[1.85rem] leading-none shadow-md ring-1 ring-black/10"
        initial={false}
        animate={
          kickStarted
            ? { x: 44, y: -36, rotate: 96, scale: 0.92 }
            : { x: 0, y: 0, rotate: 0, scale: 1 }
        }
        transition={{ duration: reduce ? 0 : 0.82, ease: [0.22, 0.58, 0.36, 1] }}
        onAnimationComplete={handleAnimComplete}
      >
        <span className="select-none" aria-hidden>
          ⚽
        </span>
      </motion.div>

      <button
        type="button"
        disabled={torn || kickStarted}
        onClick={handleActivate}
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl border-0 bg-transparent p-0 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500/75 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-55"
        style={{ touchAction: 'manipulation' }}
        aria-label={ariaLabel}
      />
    </motion.div>
  )
}

type RockGuitarSealProps = {
  reduce: boolean
  torn: boolean
  onUserGesture?: () => void
  onStrummed: () => void
  ariaLabel: string
}

function RockGuitarSeal({ reduce, torn, onUserGesture, onStrummed, ariaLabel }: RockGuitarSealProps) {
  const [strummed, setStrummed] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!strummed || completedRef.current) return undefined
    const id = window.setTimeout(() => {
      completedRef.current = true
      onStrummed()
    }, reduce ? 0 : 720)
    return () => window.clearTimeout(id)
  }, [onStrummed, reduce, strummed])

  const handleActivate = () => {
    if (torn || strummed || completedRef.current) return
    onUserGesture?.()
    if (reduce) {
      completedRef.current = true
      onStrummed()
      return
    }
    setStrummed(true)
  }

  const notes = [
    { label: '♪', x: -26, y: -58, delay: 0 },
    { label: '♫', x: 4, y: -72, delay: 0.08 },
    { label: '♪', x: 30, y: -52, delay: 0.16 },
  ]

  return (
    <motion.div
      className="relative h-20 w-20 select-none"
      animate={{ opacity: torn ? 0 : 1, scale: torn ? 0.88 : strummed ? 1.05 : 1 }}
      transition={{ duration: reduce ? 0.12 : 0.22 }}
    >
      {strummed
        ? notes.map((note) => (
            <motion.span
              key={`${note.label}-${note.x}`}
              className="pointer-events-none absolute left-1/2 top-1/2 z-20 font-display text-2xl font-bold text-red-700 drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]"
              initial={{ opacity: 0, x: -4, y: -12, scale: 0.65, rotate: -8 }}
              animate={{ opacity: [0, 1, 0], x: note.x, y: note.y, scale: [0.65, 1, 1.08], rotate: 10 }}
              transition={{ duration: 0.78, delay: note.delay, ease: 'easeOut' }}
              aria-hidden
            >
              {note.label}
            </motion.span>
          ))
        : null}

      <motion.svg
        viewBox="0 0 96 96"
        className="pointer-events-none absolute inset-0 z-10 drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]"
        aria-hidden
        animate={strummed ? { rotate: [-18, -28, -16], scale: [1, 1.08, 1.02] } : { rotate: -18, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.42, ease: 'easeOut' }}
      >
        <g transform="translate(1 3)">
          <path d="M51 42 L77 13" stroke="#15100e" strokeWidth="11" strokeLinecap="round" />
          <path d="M51 42 L77 13" stroke="#d8c4a0" strokeWidth="5" strokeLinecap="round" />
          <path d="M74 6 L90 5 L87 21 L79 24 L70 15 Z" fill="#16110f" stroke="#c7a45e" strokeWidth="2" />
          <path
            d="M47 39 L20 82 L43 67 L50 90 L57 67 L80 82 L54 39 Z"
            fill="#7b0d12"
            stroke="#d8c4a0"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M47 46 L33 72 L45 63 L50 77 L55 63 L68 72 L54 46 Z"
            fill="#17110f"
            opacity="0.88"
          />
          <circle cx="50" cy="53" r="6" fill="#0f0d0c" stroke="#f5e8c8" strokeWidth="2" />
          <rect x="42" y="61" width="16" height="4" rx="1.5" fill="#d8c4a0" />
          <path d="M39 52 L76 15 M44 55 L79 18 M49 58 L82 21" stroke="#f5e8c8" strokeWidth="1" opacity="0.78" />
          <circle cx="84" cy="8" r="2" fill="#d8c4a0" />
          <circle cx="88" cy="13" r="2" fill="#d8c4a0" />
          <circle cx="78" cy="19" r="2" fill="#d8c4a0" />
        </g>
      </motion.svg>

      <button
        type="button"
        disabled={torn || strummed}
        onClick={handleActivate}
        className="absolute inset-0 z-30 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-red-700/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none"
        style={{ touchAction: 'manipulation' }}
        aria-label={ariaLabel}
      />
    </motion.div>
  )
}

type ButterflySealProps = {
  reduce: boolean
  torn: boolean
  onUserGesture?: () => void
  onFlewAway: () => void
  ariaLabel: string
  /** Asas de joia rosa, azul e dourado, no lugar da borboleta clara. */
  jewel?: boolean
}

function JewelButterflyArt({ gone }: { gone: boolean }) {
  const wingBeat = gone ? { scaleX: [1, 0.28, 1, 0.34, 1] } : { scaleX: [1, 0.88, 1] }
  return (
    <svg
      viewBox="0 0 160 124"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full drop-shadow-[0_8px_16px_rgba(90,8,70,0.6)]"
      aria-hidden
    >
      <defs>
        <linearGradient id="jewelUpper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ec8ff" />
          <stop offset="42%" stopColor="#b44bff" />
          <stop offset="100%" stopColor="#ff3ec4" />
        </linearGradient>
        <linearGradient id="jewelLower" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5ad0" />
          <stop offset="55%" stopColor="#7a3cff" />
          <stop offset="100%" stopColor="#3d6dff" />
        </linearGradient>
        <linearGradient id="jewelGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6cc" />
          <stop offset="40%" stopColor="#f2c14d" />
          <stop offset="100%" stopColor="#9a6412" />
        </linearGradient>
        <radialGradient id="jewelGem" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ff86e4" />
          <stop offset="100%" stopColor="#7a22e8" />
        </radialGradient>
      </defs>

      <g stroke="#f6c15a" strokeWidth="1.3" strokeLinecap="round" fill="none">
        <path d="M80 42 C70 28 60 20 50 15" />
        <path d="M80 42 C90 28 100 20 110 15" />
      </g>
      <circle cx="49" cy="14" r="2.4" fill="#fff6d0" stroke="#e2b043" strokeWidth="0.7" />
      <circle cx="111" cy="14" r="2.4" fill="#fff6d0" stroke="#e2b043" strokeWidth="0.7" />

      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: '80px 64px' }}
        initial={false}
        animate={wingBeat}
        transition={
          gone
            ? { duration: 0.24, repeat: 4, ease: 'easeInOut' }
            : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <g stroke="url(#jewelGold)" strokeWidth="2.4" strokeLinejoin="round">
          <path
            fill="url(#jewelUpper)"
            d="M80 56 C96 22 122 8 142 20 C154 30 152 52 136 64 C118 76 96 70 80 60 Z"
          />
          <path
            fill="url(#jewelUpper)"
            d="M80 56 C64 22 38 8 18 20 C6 30 8 52 24 64 C42 76 64 70 80 60 Z"
          />
          <path fill="url(#jewelLower)" d="M82 64 C104 70 132 96 116 114 C98 122 84 96 78 72 Z" />
          <path fill="url(#jewelLower)" d="M78 64 C56 70 28 96 44 114 C62 122 76 96 82 72 Z" />
        </g>
        <g>
          <path d="M108 24 C128 18 146 34 136 52 C120 40 108 34 108 24 Z" fill="#4aa6ff" opacity="0.9" />
          <path d="M52 24 C32 18 14 34 24 52 C40 40 52 34 52 24 Z" fill="#4aa6ff" opacity="0.9" />
          <path d="M86 46 C108 32 128 44 116 60 C100 56 86 52 86 46 Z" fill="#ff4fd2" opacity="0.85" />
          <path d="M74 46 C52 32 32 44 44 60 C60 56 74 52 74 46 Z" fill="#ff4fd2" opacity="0.85" />
          <path d="M100 86 C118 92 124 106 110 110 C98 104 94 92 100 86 Z" fill="#6d4bff" opacity="0.8" />
          <path d="M60 86 C42 92 36 106 50 110 C62 104 66 92 60 86 Z" fill="#6d4bff" opacity="0.8" />
        </g>
        <g fill="#ffe9a8" stroke="#c8891d" strokeWidth="0.6">
          <circle cx="132" cy="28" r="2.3" />
          <circle cx="28" cy="28" r="2.3" />
          <circle cx="124" cy="58" r="1.8" />
          <circle cx="36" cy="58" r="1.8" />
          <circle cx="112" cy="104" r="1.8" />
          <circle cx="48" cy="104" r="1.8" />
        </g>
        <g stroke="#fff4c2" strokeWidth="0.8" fill="none" opacity="0.8">
          <path d="M84 54 C104 40 126 34 140 40" />
          <path d="M76 54 C56 40 34 34 20 40" />
          <path d="M84 68 C104 86 118 100 112 110" />
          <path d="M76 68 C56 86 42 100 48 110" />
        </g>
        <g fill="#ffffff">
          <circle cx="118" cy="36" r="1.3" />
          <circle cx="42" cy="36" r="1.3" />
          <circle cx="108" cy="96" r="1.1" />
          <circle cx="52" cy="96" r="1.1" />
        </g>
      </motion.g>

      <path
        d="M80 40 C85 40 87 50 87 62 C87 76 83.5 88 80 88 C76.5 88 73 76 73 62 C73 50 75 40 80 40 Z"
        fill="url(#jewelGold)"
      />
      <circle cx="80" cy="58" r="5.2" fill="url(#jewelGem)" stroke="#f6c15a" strokeWidth="1" />
      <circle cx="78.4" cy="56" r="1.4" fill="#ffffff" opacity="0.9" />
    </svg>
  )
}

/** Voo (ms) antes de abrir o envelope — deixa a borboleta sair de cena. */
const BUTTERFLY_FLY_MS = 1000

/**
 * Borboleta no lugar do selo: bate as asas em repouso e, ao toque, sai voando
 * (sobe, gira e desvanece) chamando `onFlewAway`, que abre o envelope.
 */
function ButterflySeal({ reduce, torn, onUserGesture, onFlewAway, ariaLabel, jewel = false }: ButterflySealProps) {
  const [flew, setFlew] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!flew || completedRef.current) return undefined
    const id = window.setTimeout(
      () => {
        completedRef.current = true
        onFlewAway()
      },
      reduce ? 0 : BUTTERFLY_FLY_MS,
    )
    return () => window.clearTimeout(id)
  }, [flew, onFlewAway, reduce])

  const handleActivate = () => {
    if (torn || flew || completedRef.current) return
    onUserGesture?.()
    if (reduce) {
      completedRef.current = true
      onFlewAway()
      return
    }
    setFlew(true)
  }

  const gone = flew || torn

  const sparkles = [
    { x: -22, y: 30, delay: 0.05 },
    { x: 16, y: 44, delay: 0.16 },
    { x: -6, y: 56, delay: 0.28 },
  ]

  return (
    <motion.div
      className={`relative select-none ${jewel ? 'h-[96px] w-[128px]' : 'h-20 w-20'}`}
      initial={false}
      animate={
        gone
          ? reduce
            ? { opacity: 0, scale: 0.82 }
            : {
                x: [0, -16, 20, 44],
                y: [0, -48, -156, -300],
                rotate: [0, -9, 7, 16],
                scale: [1, 1.06, 0.82, 0.48],
                opacity: [1, 1, 0.85, 0],
              }
          : { x: 0, y: [0, -4, 0], rotate: [-2, 2, -2], scale: 1, opacity: 1 }
      }
      transition={
        gone
          ? { duration: reduce ? 0.2 : BUTTERFLY_FLY_MS / 1000, ease: [0.4, 0, 0.2, 1] }
          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      {gone && !reduce
        ? sparkles.map((s) => (
            <motion.span
              key={`${s.x}-${s.y}`}
              className="pointer-events-none absolute left-1/2 top-1/2 z-20 text-sm text-amber-300 drop-shadow-[0_1px_3px_rgba(200,120,40,0.5)]"
              initial={{ opacity: 0, x: -4, y: -2, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], x: s.x, y: s.y, scale: [0.5, 1, 0.4] }}
              transition={{ duration: 0.7, delay: s.delay, ease: 'easeOut' }}
              aria-hidden
            >
              ✦
            </motion.span>
          ))
        : null}

      {jewel ? (
        <JewelButterflyArt gone={gone} />
      ) : (
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full drop-shadow-[0_6px_10px_rgba(120,50,60,0.35)]"
        aria-hidden
      >
        <defs>
          <radialGradient id="bfWing" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#fff2f5" />
            <stop offset="42%" stopColor="#f5aec0" />
            <stop offset="78%" stopColor="#e57e9c" />
            <stop offset="100%" stopColor="#cf5f80" />
          </radialGradient>
          <linearGradient id="bfBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5a3a" />
            <stop offset="100%" stopColor="#4f2f1e" />
          </linearGradient>
        </defs>

        {/* Antenas */}
        <g stroke="#7a4a2e" strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d="M49 39 C45 30 41 27 38 25" />
          <path d="M51 39 C55 30 59 27 62 25" />
        </g>
        <circle cx="37.6" cy="24.6" r="1.7" fill="#c9852f" />
        <circle cx="62.4" cy="24.6" r="1.7" fill="#c9852f" />

        {/* Asas — grupo animado (bate as asas) */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '50px 52px' }}
          initial={false}
          animate={gone ? { scaleX: [1, 0.25, 1, 0.3, 1] } : { scaleX: [1, 0.82, 1] }}
          transition={
            gone
              ? { duration: 0.24, repeat: 4, ease: 'easeInOut' }
              : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* Lado direito (mirror gera o esquerdo) */}
          <g id="bf-wing" fill="url(#bfWing)" stroke="#c9852f" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M51 47 C63 24 86 21 90 36 C92 49 71 53 52 51 Z" />
            <path d="M51 53 C60 62 80 74 81 62 C82 51 63 51 51 55 Z" />
          </g>
          <g transform="translate(100 0) scale(-1 1)">
            <use href="#bf-wing" />
          </g>
          {/* Detalhes nas asas */}
          <g fill="#fff4d6" opacity="0.9">
            <circle cx="74" cy="34" r="2.4" />
            <circle cx="26" cy="34" r="2.4" />
            <circle cx="70" cy="63" r="1.8" />
            <circle cx="30" cy="63" r="1.8" />
          </g>
        </motion.g>

        {/* Corpo */}
        <path
          d="M50 40 C52.4 40 53.4 43 53.4 50 C53.4 59 51.8 66 50 66 C48.2 66 46.6 59 46.6 50 C46.6 43 47.6 40 50 40 Z"
          fill="url(#bfBody)"
        />
      </svg>
      )}

      <button
        type="button"
        disabled={torn || flew}
        onClick={handleActivate}
        className="absolute inset-0 z-30 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-rose-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none"
        style={{ touchAction: 'manipulation' }}
        aria-label={ariaLabel}
      />
    </motion.div>
  )
}

type PandeiroSealProps = {
  torn: boolean
  reduce: boolean
}

const PANDEIRO_NOTES = [
  { glyph: '♪', x: -54, y: -62, rotate: -24, delay: 0, size: 26 },
  { glyph: '♫', x: 2, y: -72, rotate: 12, delay: 0.05, size: 24 },
  { glyph: '♪', x: 56, y: -46, rotate: 22, delay: 0.1, size: 22 },
  { glyph: '♫', x: -28, y: -44, rotate: -16, delay: 0.14, size: 20 },
  { glyph: '♪', x: 32, y: -58, rotate: 28, delay: 0.08, size: 22 },
] as const

/** Pandeiro no lugar do selo. O toque gira o aro e solta notas antes de abrir o envelope. */
function PandeiroSeal({ torn, reduce }: PandeiroSealProps) {
  const jingleAngles = [0, 60, 120, 180, 240, 300]
  const playNotes = torn && !reduce

  return (
    <div className="relative h-[68px] w-[68px] overflow-visible" aria-hidden>
      {playNotes
        ? PANDEIRO_NOTES.map((note) => (
            <motion.span
              key={`${note.glyph}-${note.x}-${note.y}`}
              className="pointer-events-none absolute z-10 select-none font-serif leading-none text-[#fff6d2]"
              style={{
                left: 34 - note.size / 2,
                top: 28 - note.size / 2,
                fontSize: note.size,
                textShadow:
                  '0 0 1px #3a220c, 1px 0 0 #3a220c, -1px 0 0 #3a220c, 0 1px 0 #3a220c, 0 -1px 0 #3a220c, 0 2px 6px rgba(40,24,8,0.45)',
              }}
              initial={{ opacity: 0, x: 0, y: 6, scale: 0.4, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [0, note.x * 0.45, note.x, note.x],
                y: [6, note.y * 0.45, note.y, note.y - 8],
                scale: [0.4, 1.08, 1, 0.92],
                rotate: [0, note.rotate * 0.4, note.rotate, note.rotate],
              }}
              transition={{
                duration: 0.86,
                delay: note.delay,
                ease: [0.16, 0.72, 0.28, 1],
                times: [0, 0.28, 0.7, 1],
              }}
            >
              {note.glyph}
            </motion.span>
          ))
        : null}
      <motion.div
        className="relative h-full w-full"
        animate={
          torn
            ? reduce
              ? { opacity: 0, scale: 0.92 }
              : { rotate: [0, 400, 360], scale: [1, 1.08, 1] }
            : { rotate: [-6, 6, -6] }
        }
        transition={
          torn
            ? { duration: reduce ? 0.2 : 0.78, ease: [0.16, 0.7, 0.3, 1] }
            : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
        }
      >
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_6px_12px_rgba(40,24,8,0.38)]">
        <defs>
          <radialGradient id="pandeiroSkin" cx="38%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#fff6e4" />
            <stop offset="58%" stopColor="#f0d7a8" />
            <stop offset="100%" stopColor="#d7b27a" />
          </radialGradient>
          <linearGradient id="pandeiroWood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e7c48a" />
            <stop offset="42%" stopColor="#b57a3a" />
            <stop offset="100%" stopColor="#6d3e16" />
          </linearGradient>
          <radialGradient id="pandeiroMetal" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="42%" stopColor="#d9dde4" />
            <stop offset="100%" stopColor="#8b919a" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill="url(#pandeiroWood)" />
        <circle cx="50" cy="50" r="41.5" fill="none" stroke="#5c3414" strokeWidth="1.3" opacity="0.6" />
        {jingleAngles.map((deg) => {
          const rad = (deg * Math.PI) / 180
          const rx = 50 + Math.cos(rad) * 39.2
          const ry = 50 + Math.sin(rad) * 39.2
          const px = -Math.sin(rad) * 3.15
          const py = Math.cos(rad) * 3.15
          return (
            <g key={deg}>
              <circle cx={rx - px} cy={ry - py} r="3.2" fill="url(#pandeiroMetal)" stroke="#6d5424" strokeWidth="0.45" />
              <circle cx={rx + px} cy={ry + py} r="3.2" fill="url(#pandeiroMetal)" stroke="#6d5424" strokeWidth="0.45" />
            </g>
          )
        })}
        <circle cx="50" cy="50" r="32" fill="#6a3d16" />
        <circle cx="50" cy="50" r="29" fill="url(#pandeiroSkin)" />
        <ellipse cx="41" cy="41" rx="8" ry="4.5" fill="#ffffff" opacity="0.28" />
      </svg>
      </motion.div>
    </div>
  )
}

type ChurrascoToastProps = {
  torn: boolean
  reduce: boolean
}

/** Caneca de chopp e caipirinha. Em repouso balançam; no toque brindam. */
function ChurrascoToast({ torn, reduce }: ChurrascoToastProps) {
  const cheering = torn && !reduce

  return (
    <div className="relative h-[72px] w-[118px] overflow-visible" aria-hidden>
      {cheering ? (
        <>
          <motion.span
            className="pointer-events-none absolute left-1/2 top-1 z-20 text-lg text-amber-100"
            style={{ textShadow: '0 1px 4px rgba(80,40,8,0.45)' }}
            initial={{ opacity: 0, x: '-50%', y: 8, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: [8, -18, -28], scale: [0.4, 1.15, 0.7] }}
            transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut' }}
          >
            ✦
          </motion.span>
          <motion.span
            className="pointer-events-none absolute left-[18%] top-2 z-20 font-serif text-xl text-[#fff3c4]"
            style={{ textShadow: '0 1px 3px rgba(60,30,8,0.5)' }}
            initial={{ opacity: 0, y: 4, rotate: -12 }}
            animate={{ opacity: [0, 1, 0], y: [4, -26, -36], rotate: -20 }}
            transition={{ duration: 0.8, delay: 0.18, ease: 'easeOut' }}
          >
            ♪
          </motion.span>
          <motion.span
            className="pointer-events-none absolute right-[14%] top-3 z-20 font-serif text-lg text-[#fff3c4]"
            style={{ textShadow: '0 1px 3px rgba(60,30,8,0.5)' }}
            initial={{ opacity: 0, y: 6, rotate: 10 }}
            animate={{ opacity: [0, 1, 0], y: [6, -22, -34], rotate: 18 }}
            transition={{ duration: 0.8, delay: 0.26, ease: 'easeOut' }}
          >
            ♫
          </motion.span>
        </>
      ) : null}

      <motion.div
        className="absolute bottom-0 left-0 h-[68px] w-[62px]"
        style={{ transformOrigin: '78% 92%' }}
        initial={false}
        animate={
          torn
            ? reduce
              ? { opacity: 0, x: 8, rotate: 10 }
              : { x: [0, 12, 7, 9], rotate: [0, 16, 8, 11], opacity: 1 }
            : { x: 0, rotate: [-3, 2, -3], y: [0, -2, 0] }
        }
        transition={
          torn
            ? { duration: reduce ? 0.2 : 0.82, ease: [0.22, 1, 0.36, 1], times: [0, 0.38, 0.58, 1] }
            : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <svg viewBox="0 0 70 78" className="h-full w-full drop-shadow-[0_5px_8px_rgba(40,20,6,0.35)]">
          <defs>
            <linearGradient id="choppGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="40%" stopColor="#e7f4ff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#9ec4de" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="choppBeer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6c14a" />
              <stop offset="55%" stopColor="#e0921a" />
              <stop offset="100%" stopColor="#b86a0c" />
            </linearGradient>
            <radialGradient id="choppFoam" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fff6e4" />
              <stop offset="100%" stopColor="#f0e0c0" />
            </radialGradient>
          </defs>
          <path
            d="M16 26 C4 26 4 52 16 52"
            fill="none"
            stroke="#f4e7c8"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path d="M16 27 C8 27 8 51 16 51" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.55" />
          <path
            d="M20 18 h32 a4 4 0 0 1 4 4 v32 c0 10 -8 16 -20 16 s-20 -6 -20 -16 V22 a4 4 0 0 1 4 -4 z"
            fill="url(#choppGlass)"
            stroke="#fffaf0"
            strokeWidth="1.2"
          />
          <path
            d="M22 34 h28 v20 c0 8 -6 12 -14 12 s-14 -4 -14 -12 z"
            fill="url(#choppBeer)"
          />
          <ellipse cx="36" cy="34" rx="14" ry="3.2" fill="#f6d98a" opacity="0.9" />
          <path d="M26 22 h4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          <circle cx="28" cy="16" r="7" fill="url(#choppFoam)" />
          <circle cx="38" cy="13" r="8" fill="url(#choppFoam)" />
          <circle cx="48" cy="17" r="6" fill="url(#choppFoam)" />
          <ellipse cx="36" cy="20" rx="16" ry="6" fill="url(#choppFoam)" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-0 h-[64px] w-[52px]"
        style={{ transformOrigin: '22% 94%' }}
        initial={false}
        animate={
          torn
            ? reduce
              ? { opacity: 0, x: -8, rotate: -10 }
              : { x: [0, -12, -7, -9], rotate: [0, -16, -8, -11], opacity: 1 }
            : { x: 0, rotate: [3, -2, 3], y: [0, -2, 0] }
        }
        transition={
          torn
            ? { duration: reduce ? 0.2 : 0.82, ease: [0.22, 1, 0.36, 1], times: [0, 0.38, 0.58, 1] }
            : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <svg viewBox="0 0 58 72" className="h-full w-full drop-shadow-[0_5px_8px_rgba(40,20,6,0.35)]">
          <defs>
            <linearGradient id="caipiGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d5efe4" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="caipiDrink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e7f5a8" />
              <stop offset="45%" stopColor="#b6d84a" />
              <stop offset="100%" stopColor="#6ea318" />
            </linearGradient>
          </defs>
          <path d="M8 16 H50 L44 58 Q29 66 14 58 Z" fill="url(#caipiGlass)" stroke="#fffaf0" strokeWidth="1.2" />
          <path d="M14 34 H44 L40 56 Q29 62 18 56 Z" fill="url(#caipiDrink)" />
          <g fill="#ffffff" opacity="0.72">
            <rect x="20" y="36" width="8" height="7" rx="1.2" transform="rotate(-12 24 39)" />
            <rect x="30" y="40" width="7" height="6" rx="1.2" transform="rotate(8 33 43)" />
          </g>
          <path d="M16 22 h3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
          <g transform="translate(42 6) rotate(-28)">
            <path d="M2 10 A 12 12 0 0 1 16 2 L 2 2 Z" fill="#7fbf2a" stroke="#4e7a12" strokeWidth="1.1" />
            <path d="M2 10 A 8 8 0 0 1 12 4 L 2 4 Z" fill="#e4f58a" />
            <path d="M2 10 L 2 3" stroke="#f7f8d2" strokeWidth="1.2" />
          </g>
        </svg>
      </motion.div>
    </div>
  )
}

type OpeningEnvelopeProps = {
  closedSrc: string
  openSrc: string
  naturalWidth: number
  naturalHeight: number
  /** Se o PNG aberto tiver outra proporção, define-o (ambos > 0). */
  openNaturalWidth?: number
  openNaturalHeight?: number
  sealAnchorX: number
  sealAnchorY: number
  /** null/omitido: zoom por viewport; número (ex.: 1) evita cortar bordas em PNGs sensíveis. */
  textureZoomOverride: number | null | undefined
  /** Zoom mínimo forçado para artes JPG com canvas branco à volta (ex.: envelope futebol). */
  textureZoomMin?: number
  /** Proporção visual forçada (largura / altura) para artes com canvas grande à volta. */
  visualAspectRatio?: number
  /** Ajuste fino horizontal do crop, em px CSS (negativo mostra mais à direita da imagem). */
  textureOffsetX?: number
  /** Ajuste fino vertical do crop, em px CSS (positivo desce a imagem). */
  textureOffsetY?: number
  /** Máscara opcional só para a arte aberta (ex.: remover cantos brancos da aba). */
  openClipPath?: string
  /** Máscara opcional só para a arte fechada (ex.: remover moldura clara do arquivo). */
  closedClipPath?: string
  /** Centraliza o crop do zoom para cortar canvas branco tanto acima como abaixo. */
  centerTextureCrop?: boolean
  /** A caixa acompanha a arte visível, sem letterbox entre fechado e aberto. */
  fitVisibleArt?: boolean
  /** Moldura escura: mistura multiplicativa suavisa halos claros residuais no PNG. */
  multiplyBlend: boolean
  showOpenArt: boolean
  cardOut: boolean
  reduce: boolean
  children: ReactNode
  /** Omite = 400px — alinhar ao `openingEnvelopeBoxWidthMaxPx` do convite. */
  boxWidthMaxPx?: number
  /** Omite = 42 — `openingEnvelopeBoxHeightVhCap`. */
  boxHeightVhCap?: number
  /** Omite = 440 — `openingEnvelopeBoxMaxHeightPx`. */
  boxMaxHeightPx?: number
  /** Largura em vw no celular. Omite = a largura padrão da abertura. */
  compactWidthVw?: number
  /**
   * Fundo por detrás das texturas (letterbox / camadas GPU).
   * Usar a cor do pergaminho ou `openingBackdropColor` evita o halo branco no Chrome com 3D/transform.
   */
  paperBackgroundColor: string
}

/** Envelope fechado (uma textura) → após o selo, crossfade para PNG do envelope aberto. */
type RibbonBowSealProps = {
  torn: boolean
  reduce: boolean
  onUntie: () => void
  ariaLabel: string
}

/**
 * Laço de cetim na ponta da aba. Em repouso as alças respiram e as fitas balançam;
 * ao toque, o laço desata e o envelope abre.
 */
function RibbonBowSeal({ torn, reduce, onUntie, ariaLabel }: RibbonBowSealProps) {
  const loopTransition = torn
    ? { duration: reduce ? 0.16 : 0.72, ease: [0.4, 0, 0.2, 1] as const }
    : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }
  const tailTransition = torn
    ? { duration: reduce ? 0.16 : 0.78, ease: [0.22, 1, 0.36, 1] as const }
    : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <motion.div
      className="relative h-[100px] w-[112px] select-none"
      initial={false}
      animate={torn || reduce ? { y: 0 } : { y: [0, -3, 0] }}
      transition={torn || reduce ? { duration: 0.2 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        viewBox="0 0 200 180"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_7px_10px_rgba(150,40,70,0.38)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="kemillyBowPink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff0f6" />
            <stop offset="32%" stopColor="#f7b3cb" />
            <stop offset="68%" stopColor="#e56d98" />
            <stop offset="100%" stopColor="#c43b70" />
          </linearGradient>
          <linearGradient id="kemillyBowGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff6d2" />
            <stop offset="42%" stopColor="#e8c15a" />
            <stop offset="100%" stopColor="#a56d10" />
          </linearGradient>
          <radialGradient id="kemillyBowKnot" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#fff7df" />
            <stop offset="45%" stopColor="#f0c56a" />
            <stop offset="100%" stopColor="#b47416" />
          </radialGradient>
        </defs>

        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '94px 90px' }}
          initial={false}
          animate={torn ? { y: 34, rotate: -18, opacity: 0 } : { rotate: [-4, 3, -4], y: 0, opacity: 1 }}
          transition={tailTransition}
        >
          <path
            d="M94 90 C76 114 50 136 32 164 L50 168 C64 140 86 118 108 96 Z"
            fill="url(#kemillyBowPink)"
            stroke="url(#kemillyBowGold)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M86 108 C68 126 52 144 42 160" stroke="#fff7fb" strokeWidth="1.6" fill="none" opacity="0.75" />
        </motion.g>
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '106px 90px' }}
          initial={false}
          animate={torn ? { y: 34, rotate: 18, opacity: 0 } : { rotate: [4, -3, 4], y: 0, opacity: 1 }}
          transition={tailTransition}
        >
          <path
            d="M106 90 C124 114 150 136 168 164 L150 168 C136 140 114 118 92 96 Z"
            fill="url(#kemillyBowPink)"
            stroke="url(#kemillyBowGold)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M114 108 C132 126 148 144 158 160" stroke="#fff7fb" strokeWidth="1.6" fill="none" opacity="0.75" />
        </motion.g>

        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '100px 82px' }}
          initial={false}
          animate={
            torn
              ? { x: -48, y: -8, rotate: -26, scale: 0.72, opacity: 0 }
              : { x: 0, y: 0, rotate: 0, scaleX: [1, 0.9, 1], scaleY: [1, 1.05, 1], opacity: 1 }
          }
          transition={loopTransition}
        >
          <path
            d="M100 80 C90 40 34 22 18 50 C4 74 28 106 72 96 C86 92 96 86 100 80 Z"
            fill="url(#kemillyBowPink)"
            stroke="url(#kemillyBowGold)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M92 74 C80 50 48 40 32 56 C24 68 42 84 68 82"
            stroke="#fff7fb"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
        </motion.g>
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '100px 82px' }}
          initial={false}
          animate={
            torn
              ? { x: 48, y: -8, rotate: 26, scale: 0.72, opacity: 0 }
              : { x: 0, y: 0, rotate: 0, scaleX: [1, 0.9, 1], scaleY: [1, 1.05, 1], opacity: 1 }
          }
          transition={{ ...loopTransition, delay: torn || reduce ? 0 : 0.15 }}
        >
          <path
            d="M100 80 C110 40 166 22 182 50 C196 74 172 106 128 96 C114 92 104 86 100 80 Z"
            fill="url(#kemillyBowPink)"
            stroke="url(#kemillyBowGold)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M108 74 C120 50 152 40 168 56 C176 68 158 84 132 82"
            stroke="#fff7fb"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
        </motion.g>

        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '100px 84px' }}
          initial={false}
          animate={torn ? { scale: 0.2, opacity: 0 } : { scale: [1, 1.06, 1], opacity: 1 }}
          transition={torn ? { duration: reduce ? 0.16 : 0.45 } : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="100" cy="84" rx="15" ry="13" fill="url(#kemillyBowKnot)" stroke="#8d5a0c" strokeWidth="1.2" />
          <ellipse cx="96" cy="80" rx="5" ry="3.2" fill="#fff8e4" opacity="0.85" />
        </motion.g>
      </svg>
      <button
        type="button"
        disabled={torn}
        onClick={onUntie}
        className="absolute inset-0 z-10 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-600/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none"
        style={{ touchAction: 'manipulation' }}
        aria-label={ariaLabel}
      />
    </motion.div>
  )
}

function OpeningEnvelope({
  closedSrc,
  openSrc,
  naturalWidth,
  naturalHeight,
  openNaturalWidth,
  openNaturalHeight,
  sealAnchorX,
  sealAnchorY,
  textureZoomOverride,
  textureZoomMin,
  visualAspectRatio,
  textureOffsetX = 0,
  textureOffsetY = 0,
  openClipPath,
  closedClipPath,
  centerTextureCrop = false,
  fitVisibleArt = false,
  multiplyBlend,
  showOpenArt,
  cardOut,
  reduce,
  children,
  boxWidthMaxPx = 400,
  boxHeightVhCap = 42,
  boxMaxHeightPx = 440,
  compactWidthVw,
  paperBackgroundColor,
}: OpeningEnvelopeProps) {
  const compact = useSyncExternalStore(
    subscribeOpeningCompactViewport,
    isOpeningCompactViewport,
    () => false,
  )
  const requestedTextureZoom =
    typeof textureZoomOverride === 'number' && Number.isFinite(textureZoomOverride) && textureZoomOverride > 0
      ? textureZoomOverride
      : compact
        ? ENVELOPE_TEXTURE_ZOOM_COMPACT
        : ENVELOPE_TEXTURE_ZOOM_DESKTOP
  const textureZoom =
    typeof textureZoomMin === 'number' && Number.isFinite(textureZoomMin) && textureZoomMin > 0
      ? Math.max(requestedTextureZoom, textureZoomMin)
      : requestedTextureZoom
  const envelopeVw = compact
    ? compactWidthVw && compactWidthVw > 0
      ? compactWidthVw
      : ENVELOPE_WIDTH_VW_COMPACT
    : ENVELOPE_WIDTH_VW_DESKTOP

  const rClosed = naturalHeight / naturalWidth
  const rOpen =
    typeof openNaturalWidth === 'number' &&
    typeof openNaturalHeight === 'number' &&
    Number.isFinite(openNaturalWidth) &&
    Number.isFinite(openNaturalHeight) &&
    openNaturalWidth > 0 &&
    openNaturalHeight > 0
      ? openNaturalHeight / openNaturalWidth
      : rClosed
  /** Inclui a arte aberta mais alta (ex. aba) quando os PNGs têm proporções diferentes. */
  const useVisualCrop =
    typeof visualAspectRatio === 'number' && Number.isFinite(visualAspectRatio) && visualAspectRatio > 0
  const visualBoxHeightOverWidth = useVisualCrop ? 1 / visualAspectRatio : undefined
  const visibleRatio = showOpenArt ? rOpen : rClosed
  const boxHeightOverWidth = visualBoxHeightOverWidth ?? (fitVisibleArt ? visibleRatio : Math.max(rClosed, rOpen))

  const hasDistinctOpenDims =
    typeof openNaturalWidth === 'number' &&
    typeof openNaturalHeight === 'number' &&
    Number.isFinite(openNaturalWidth) &&
    Number.isFinite(openNaturalHeight) &&
    openNaturalWidth > 0 &&
    openNaturalHeight > 0
  /** Fechado 3:2 + aberto 1:1: caixa quadrada com cover cortava as laterais do fechado → contain. */
  const useObjectContain = !fitVisibleArt && hasDistinctOpenDims && Math.abs(rOpen - rClosed) > 0.001

  const wMax = boxWidthMaxPx > 0 ? boxWidthMaxPx : 400
  const vhCap = boxHeightVhCap > 0 ? boxHeightVhCap : 42
  const pxCap = boxMaxHeightPx > 0 ? boxMaxHeightPx : 440

  const boxStyle: CSSProperties = {
    width: `min(${envelopeVw}vw, ${wMax}px)`,
    /** Tecto vh/px: artes 1∶1; altura efetiva também limitada por largura × proporção. */
    height: `min(min(${vhCap}vh, ${pxCap}px), calc(min(${envelopeVw}vw, ${wMax}px) * ${boxHeightOverWidth}))`,
    backgroundColor: paperBackgroundColor,
  }

  const imgShared = useVisualCrop
    ? 'pointer-events-none absolute left-1/2 top-0 block h-full w-full select-none object-cover object-center'
    : useObjectContain
    ? 'pointer-events-none absolute left-1/2 top-0 block h-full w-full max-w-full select-none bg-transparent object-contain object-center'
    : 'pointer-events-none absolute left-1/2 top-0 block h-full max-w-none select-none bg-transparent object-cover object-center'

  const imgZoomStyle = {
    top: centerTextureCrop ? '50%' : 0,
    width: (useVisualCrop || useObjectContain ? '100%' : 'auto') as '100%' | 'auto',
    minWidth: useVisualCrop || useObjectContain ? ('auto' as const) : '100%',
    transform: centerTextureCrop
      ? `translate(calc(-50% + ${textureOffsetX}px), calc(-50% + ${textureOffsetY}px)) scale(${textureZoom})`
      : `translate(calc(-50% + ${textureOffsetX}px), ${textureOffsetY}px) scale(${textureZoom})`,
    transformOrigin: centerTextureCrop ? ('center center' as const) : ('top center' as const),
    ...(multiplyBlend ? { mixBlendMode: 'multiply' as const } : {}),
  }
  const openImgZoomStyle = {
    ...imgZoomStyle,
    ...(openClipPath ? { clipPath: openClipPath } : {}),
  }
  const closedImgZoomStyle = {
    ...imgZoomStyle,
    ...(closedClipPath ? { clipPath: closedClipPath } : {}),
  }

  const fade = reduce ? 0.16 : ENVELOPE_CROSSFADE_S

  return (
    <motion.div
      className="relative mx-auto"
      style={boxStyle}
      initial={false}
      animate={{ opacity: cardOut ? 0 : 1 }}
      transition={{ duration: reduce ? 0.2 : 0.48, ease: 'easeOut' }}
    >
      {/*
        Sem `isolate`: com `mix-blend-mode: multiply` no PNG, `isolate` fazia o blend
        só contra o interior do grupo (transparente ≈ branco), gerando moldura branca à volta do envelope.
      */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        style={{ backgroundColor: paperBackgroundColor }}
      >
        <motion.img
          src={closedSrc}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className={imgShared}
          style={closedImgZoomStyle}
          initial={false}
          animate={{ opacity: showOpenArt ? 0 : 1 }}
          transition={{ duration: fade, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.img
          src={openSrc}
          alt=""
          draggable={false}
          decoding="async"
          className={imgShared}
          style={openImgZoomStyle}
          initial={false}
          animate={{ opacity: showOpenArt ? 1 : 0 }}
          transition={{ duration: fade, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[30]">
        {/* Selo: (sealAnchorX, sealAnchorY) em % da caixa; translate(-50%,-50%) no centro do selo. */}
        <div
          className="pointer-events-none absolute transition-opacity duration-200 ease-out"
          style={{
            left: `${sealAnchorX * 100}%`,
            top: `${sealAnchorY * 100}%`,
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

export function EnvelopeOpening({ data, inviteSlug, onOpen, onSealUserGesture }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const [phase, setPhase] = useState<OpeningPhase>('idle')
  const defaultInviteMode = inviteSlug === 'default'
  const soccerGoalMode =
    data.openingInteractionMode === 'soccer_goal' ||
    (typeof inviteSlug === 'string' && SOCCER_GOAL_SLUG_FALLBACKS.includes(inviteSlug))
  const jewelButterflyMode = typeof inviteSlug === 'string' && JEWEL_BUTTERFLY_SLUGS.includes(inviteSlug)
  const butterflySealMode =
    data.openingInteractionMode === 'butterfly' ||
    jewelButterflyMode ||
    (typeof inviteSlug === 'string' && BUTTERFLY_SEAL_SLUG_FALLBACKS.includes(inviteSlug))
  const pandeiroSealMode = typeof inviteSlug === 'string' && PANDEIRO_SEAL_SLUGS.includes(inviteSlug)
  const envelopeBlendMode =
    typeof inviteSlug === 'string' && ENVELOPE_BLEND_SLUG_FALLBACKS.includes(inviteSlug)
  const rockGuitarSealMode = envelopeBlendMode
  const frameSrc = data.openingFrameImageUrl?.trim() || OPENING_FRAME_SRC
  const backdropColor = data.openingBackdropColor?.trim()
  /**
   * Em convites com envelopes JPG (ex.: futebol), a margem clara vem dentro da própria imagem.
   * Deixar a camada transparente + multiply faz o branco do JPG assumir a textura real da moldura.
   */
  const shouldMultiplyEnvelope = Boolean(backdropColor) || soccerGoalMode || envelopeBlendMode || pandeiroSealMode
  /** Arte de envelope com fundo recortado (transparente) para o slug atual, se existir. */
  const envelopeOverride =
    typeof inviteSlug === 'string' ? ENVELOPE_TRANSPARENT_OVERRIDES[inviteSlug] : undefined
  const sizeOverride = typeof inviteSlug === 'string' ? ENVELOPE_SIZE_OVERRIDES[inviteSlug] : undefined
  const openingStagePaperBg =
    (soccerGoalMode || envelopeBlendMode || butterflySealMode || pandeiroSealMode || Boolean(envelopeOverride)) && !backdropColor
      ? 'transparent'
      : backdropColor || 'var(--color-cream)'
  const darkOpeningBackdrop = Boolean(backdropColor)
  const soccerOpeningTextClass = soccerGoalMode && !darkOpeningBackdrop
  const layoutOffsetTop = data.openingLayoutOffsetTop?.trim() || (envelopeBlendMode ? 'clamp(2rem, 5vh, 3.75rem)' : '')
  const palomaEnvelope = inviteSlug === 'paloma-48'
  const kemillyBowMode = inviteSlug === 'kemilly-15-anos'
  const envelopeMarginTopOnly = data.openingEnvelopeMarginTop?.trim() || envelopeOverride?.marginTop || ''
  const envelopeSrc =
    envelopeOverride?.closed || data.openingEnvelopeImageUrl?.trim() || '/images/envelope-burgundy.png'
  const envelopeOpenSrc =
    envelopeOverride?.open || data.openingEnvelopeOpenImageUrl?.trim() || '/images/envelope-open.png'
  const envelopeNaturalW = envelopeOverride?.naturalWidth || data.openingEnvelopeNaturalWidth || ENVELOPE_NATURAL_W
  const envelopeNaturalH = envelopeOverride?.naturalHeight || data.openingEnvelopeNaturalHeight || ENVELOPE_NATURAL_H
  const sealAnchorY =
    typeof envelopeOverride?.sealAnchorY === 'number' && Number.isFinite(envelopeOverride.sealAnchorY)
      ? envelopeOverride.sealAnchorY
      : typeof data.openingSealAnchorY === 'number' && Number.isFinite(data.openingSealAnchorY)
      ? data.openingSealAnchorY
      : SEAL_ANCHOR_Y
  const sealAnchorXRaw =
    typeof data.openingSealAnchorX === 'number' && Number.isFinite(data.openingSealAnchorX)
      ? data.openingSealAnchorX
      : SEAL_ANCHOR_X
  const sealAnchorX = Math.min(0.92, Math.max(0.08, sealAnchorXRaw))
  const previewTitle = data.openingPreviewTitle?.trim() || t('invite.openingFallback')

  const envBoxWMax = positiveOverride(
    sizeOverride?.boxWidthMaxPx,
    envelopeOverride?.boxWidthMaxPx,
    data.openingEnvelopeBoxWidthMaxPx,
    400,
  )
  const envBoxVhCap = positiveOverride(
    sizeOverride?.boxHeightVhCap,
    envelopeOverride?.boxHeightVhCap,
    data.openingEnvelopeBoxHeightVhCap,
    42,
  )
  const envBoxPxCap = positiveOverride(
    sizeOverride?.boxMaxHeightPx,
    envelopeOverride?.boxMaxHeightPx,
    data.openingEnvelopeBoxMaxHeightPx,
    440,
  )

  /** Pré-carrega o PNG aberto para o crossfade não “piscar”. */
  useEffect(() => {
    const img = new Image()
    img.src = envelopeOpenSrc
  }, [envelopeOpenSrc])

  const timing = useMemo(
    () => ({
      /** No modo futebol o «rasgar» do selo não existe — abre um pouco mais cedo. O pandeiro espera o giro e as notas. O brinde espera as taças se tocarem. */
      sealToFlapMs: reduce
        ? 220
        : soccerGoalMode
          ? 420
          : pandeiroSealMode
            ? 1000
            : palomaEnvelope
              ? TOAST_BEFORE_FLAP_MS
              : kemillyBowMode
                ? 860
                : 780,
      /** Após mostrar o envelope aberto (crossfade + pausa), o cartão sobe. */
      flapToCardMs: reduce ? 200 : OPEN_ENVELOPE_HOLD_BEFORE_CARD_MS,
      cardToLeaveMs: reduce ? 480 : 2200,
    }),
    [reduce, soccerGoalMode, pandeiroSealMode, palomaEnvelope, kemillyBowMode],
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
    if (!soccerGoalMode) onSealUserGesture?.()
    setPhase('seal')
  }

  const handleRockStrum = () => {
    if (phase !== 'idle') return
    setPhase('seal')
  }

  const handleButterflyFly = () => {
    if (phase !== 'idle') return
    setPhase('seal')
  }

  const sealTorn = phase !== 'idle'
  const flapOpen = phase === 'flap' || phase === 'card'
  const cardOut = phase === 'card'

  const cardDur = reduce ? 0.22 : 0.72
  const sealMark = resolveSealMark(data)
  const inProgress = phase !== 'idle'
  const openingFrameSubtitle = data.heroSubtitle.trim()
  const customOpeningTextColor = data.openingTextColor?.trim()
  const customOpeningTextOpacity =
    typeof data.openingTextOpacity === 'number' && Number.isFinite(data.openingTextOpacity)
      ? Math.min(1, Math.max(0, data.openingTextOpacity))
      : null
  const openingTextStyle = (): CSSProperties | undefined => {
    if (
      !customOpeningTextColor &&
      customOpeningTextOpacity == null &&
      !data.openingTextBold &&
      !data.openingTextItalic &&
      !data.openingTextUnderline
    ) {
      return undefined
    }
    const opacity = customOpeningTextOpacity ?? 1
    return {
      ...(customOpeningTextColor ? { color: customOpeningTextColor } : {}),
      opacity: inProgress ? opacity * 0.45 : opacity,
      ...(data.openingTextBold ? { fontWeight: 700 } : {}),
      ...(data.openingTextItalic ? { fontStyle: 'italic' as const } : {}),
      ...(data.openingTextUnderline ? { textDecorationLine: 'underline' as const } : {}),
    }
  }

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
      <FloralBackdrop
        frameSrc={frameSrc}
        backdropColor={backdropColor}
        crop={pandeiroSealMode ? RAFAELE_FRAME_CROP : undefined}
        flushTop={palomaEnvelope}
      />
      {openingFrameSubtitle ? (
        <div className="pointer-events-none absolute inset-x-0 top-[clamp(6.1rem,15vh,8.5rem)] z-[12] flex justify-center px-8 text-center">
          <p className="max-w-[min(82vw,520px)] whitespace-pre-wrap font-display text-sm leading-snug text-emerald-950/85 [text-shadow:0_1px_10px_rgba(255,255,255,0.78)] md:text-base">
            {openingFrameSubtitle}
          </p>
        </div>
      ) : null}

      <div
        className={`relative z-10 mx-auto flex min-h-dvh w-full max-w-full flex-col items-center px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-4 md:max-w-none md:px-5 md:py-10 ${
          palomaEnvelope
            ? 'justify-start pt-[25vh] md:justify-center md:pt-10'
            : 'justify-center py-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:py-5'
        }`}
      >
        <div
          className="flex w-full max-w-full flex-col items-center justify-center gap-3 sm:gap-4 md:gap-8"
          style={{
            ...(layoutOffsetTop ? { marginTop: layoutOffsetTop } : {}),
            ...(sizeOverride?.columnGap ? { gap: sizeOverride.columnGap } : {}),
            ...(sizeOverride?.shiftX || sizeOverride?.shiftY
              ? { transform: `translate(${sizeOverride.shiftX || '0px'}, ${sizeOverride.shiftY || '0px'})` }
              : {}),
          }}
        >
        <div className="flex w-full shrink-0 flex-col items-center justify-center overflow-visible [perspective:1400px]">
          <div
            className="relative mx-auto min-w-0 w-[min(84vw,var(--opening-env-w-max))] transform-gpu md:w-[min(94vw,var(--opening-env-w-max))]"
            style={
              {
                ['--opening-env-w-max' as string]: `${envBoxWMax}px`,
                transformStyle: 'preserve-3d',
                backgroundColor: 'transparent',
              } as CSSProperties
            }
          >
            <motion.div
              className="pointer-events-none absolute left-1/2 top-[50%] z-[5] w-[min(78%,300px)] max-w-[300px] -translate-x-1/2 rounded-sm border border-rose-200/70 bg-white/85 px-4 py-5 text-center shadow-md backdrop-blur-[1px]"
              initial={{ y: 32, rotateX: 0, opacity: 0 }}
              animate={{
                y: cardOut ? -116 : 32,
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
              <p className="font-display text-lg italic text-rose-900/55">{previewTitle}</p>
              <p className="mt-2 font-display text-xl font-semibold text-stone-800">
                {data.coupleNames}
              </p>
              {data.heroSubtitle.trim() ? (
                <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-stone-600">
                  {data.heroSubtitle}
                </p>
              ) : null}
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                {data.weddingDateLabel}
                <br />
                {data.time} · {data.venue}
              </p>
            </motion.div>

            <div
              className={`relative z-[20] mx-auto flex w-full justify-center ${
                palomaEnvelope ? 'md:-mt-8' : ''
              }`}
              style={{
                maxWidth: envBoxWMax,
                ...(envelopeMarginTopOnly ? { marginTop: envelopeMarginTopOnly } : {}),
              }}
            >
              <OpeningEnvelope
                closedSrc={envelopeSrc}
                openSrc={envelopeOpenSrc}
                naturalWidth={envelopeNaturalW}
                naturalHeight={envelopeNaturalH}
                openNaturalWidth={
                  envelopeOverride?.openNaturalWidth ??
                  (typeof data.openingEnvelopeOpenNaturalWidth === 'number' &&
                  Number.isFinite(data.openingEnvelopeOpenNaturalWidth) &&
                  data.openingEnvelopeOpenNaturalWidth > 0
                    ? data.openingEnvelopeOpenNaturalWidth
                    : undefined)
                }
                openNaturalHeight={
                  envelopeOverride?.openNaturalHeight ??
                  (typeof data.openingEnvelopeOpenNaturalHeight === 'number' &&
                  Number.isFinite(data.openingEnvelopeOpenNaturalHeight) &&
                  data.openingEnvelopeOpenNaturalHeight > 0
                    ? data.openingEnvelopeOpenNaturalHeight
                    : undefined)
                }
                sealAnchorX={sealAnchorX}
                sealAnchorY={sealAnchorY}
                textureZoomOverride={
                  sizeOverride?.textureZoom ??
                  data.openingEnvelopeTextureZoom ??
                  envelopeOverride?.textureZoom ??
                  (butterflySealMode
                    ? BUTTERFLY_ENVELOPE_TEXTURE_ZOOM
                    : defaultInviteMode
                      ? DEFAULT_INVITE_ENVELOPE_TEXTURE_ZOOM
                      : null)
                }
                textureZoomMin={soccerGoalMode ? (flapOpen ? 1.1 : 1.17) : undefined}
                visualAspectRatio={soccerGoalMode ? (flapOpen ? 1.36 : 1.9) : undefined}
                textureOffsetX={soccerGoalMode && !flapOpen ? -6 : 0}
                textureOffsetY={soccerGoalMode && flapOpen ? 5 : 0}
                openClipPath={
                  pandeiroSealMode
                    ? 'polygon(50% 0.3%, 55.4% 2.5%, 87.6% 32.4%, 90.8% 40%, 90.8% 95%, 9.2% 95%, 9.2% 38.5%, 12.4% 31.3%, 44.8% 2.4%)'
                    : soccerGoalMode
                    ? 'polygon(50% 0%, 94.5% 35%, 94.5% 100%, 5.5% 100%, 5.5% 35%)'
                    : envelopeBlendMode
                      ? 'polygon(50% 5%, 88% 34%, 88% 90%, 12% 90%, 12% 34%)'
                    : undefined
                }
                closedClipPath={
                  pandeiroSealMode
                    ? 'inset(13.2% 3.7% 13.7% 3.9%)'
                    : envelopeBlendMode
                      ? 'inset(12% 7% 8% 7%)'
                      : undefined
                }
                centerTextureCrop={soccerGoalMode}
                fitVisibleArt={envelopeOverride?.fitVisibleArt}
                compactWidthVw={envelopeOverride?.compactWidthVw ?? (pandeiroSealMode ? 70 : undefined)}
                boxWidthMaxPx={envBoxWMax}
                boxHeightVhCap={envBoxVhCap}
                boxMaxHeightPx={envBoxPxCap}
                multiplyBlend={shouldMultiplyEnvelope}
                paperBackgroundColor={openingStagePaperBg}
                showOpenArt={flapOpen}
                cardOut={cardOut}
                reduce={Boolean(reduce)}
              >
                <div className="pointer-events-auto">
                  {soccerGoalMode ? (
                    <SoccerGoalKick
                      reduce={Boolean(reduce)}
                      torn={sealTorn}
                      onUserGesture={onSealUserGesture}
                      onScored={handleSealClick}
                      ariaLabel={data.openingSealHint?.trim() || t('invite.openingFallback')}
                    />
                  ) : butterflySealMode ? (
                    <ButterflySeal
                      reduce={Boolean(reduce)}
                      torn={sealTorn}
                      jewel={jewelButterflyMode}
                      onUserGesture={onSealUserGesture}
                      onFlewAway={handleButterflyFly}
                      ariaLabel={
                        jewelButterflyMode
                          ? 'Clique na borboleta para abrir o convite'
                          : data.openingSealHint?.trim() || t('invite.openingFallback')
                      }
                    />
                  ) : rockGuitarSealMode ? (
                    <RockGuitarSeal
                      reduce={Boolean(reduce)}
                      torn={sealTorn}
                      onUserGesture={onSealUserGesture}
                      onStrummed={handleRockStrum}
                      ariaLabel={data.openingSealHint?.trim() || t('invite.openingFallback')}
                    />
                  ) : pandeiroSealMode ? (
                    <button
                      type="button"
                      disabled={inProgress}
                      onClick={handleSealClick}
                      className="cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none transition hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-amber-700/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none"
                      style={{ touchAction: 'manipulation' }}
                      aria-label="Clique no pandeiro para abrir o convite"
                    >
                      <PandeiroSeal torn={sealTorn} reduce={Boolean(reduce)} />
                    </button>
                  ) : kemillyBowMode ? (
                    <RibbonBowSeal
                      torn={sealTorn}
                      reduce={Boolean(reduce)}
                      onUntie={handleSealClick}
                      ariaLabel="Clique no laço para abrir o convite"
                    />
                  ) : palomaEnvelope ? (
                    <button
                      type="button"
                      disabled={inProgress}
                      onClick={handleSealClick}
                      className="cursor-pointer border-0 bg-transparent p-0 outline-none transition hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none"
                      style={{ touchAction: 'manipulation' }}
                      aria-label="Clique no brinde para abrir o convite"
                    >
                      <ChurrascoToast torn={sealTorn} reduce={Boolean(reduce)} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={inProgress}
                      onClick={handleSealClick}
                      className="cursor-pointer rounded-full border-0 bg-transparent p-1 outline-none transition hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-amber-600/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none"
                      style={{ touchAction: 'manipulation' }}
                      aria-label={data.openingSealHint}
                    >
                      <TearingGoldSeal torn={sealTorn} reduce={Boolean(reduce)} mark={sealMark} />
                    </button>
                  )}
                </div>
              </OpeningEnvelope>
            </div>
          </div>
        </div>

        <div
          className={`mb-7 flex w-full max-w-[min(94vw,320px)] shrink-0 flex-col items-center space-y-2 px-1 text-center sm:max-w-[min(90vw,300px)] md:mb-9 md:max-w-[300px] ${
            palomaEnvelope ? 'md:mt-8' : ''
          } ${
            darkOpeningBackdrop
              ? '[&_p]:[text-shadow:0_1px_14px_rgba(0,0,0,0.88),0_0_20px_rgba(0,0,0,0.55)]'
              : '[&_p]:[text-shadow:0_0_10px_rgba(250,247,242,0.95),0_0_22px_rgba(250,247,242,0.82)]'
          }`}
          style={
            envelopeMarginTopOnly
              ? { marginTop: `calc(-1 * (${envelopeMarginTopOnly}))` }
              : undefined
          }
        >
          <p
            className={`text-[11px] uppercase tracking-[0.3em] transition-opacity duration-300 ${
              darkOpeningBackdrop
                ? inProgress
                  ? 'text-red-500/30'
                  : 'text-red-500/95'
                : soccerOpeningTextClass
                  ? inProgress
                    ? 'text-rose-950/35'
                    : 'text-rose-950/75'
                : inProgress
                  ? 'text-rose-900/15'
                  : 'text-rose-900/40'
            }`}
            style={openingTextStyle()}
          >
            {pandeiroSealMode
              ? 'Clique no pandeiro para abrir o convite'
              : jewelButterflyMode
                ? 'Clique na borboleta para abrir o convite'
              : palomaEnvelope
                ? 'Clique no brinde para abrir o convite'
                : kemillyBowMode
                  ? 'Clique no laço para abrir o convite'
                  : data.openingSealHint}
          </p>
          <p
            className={`font-display text-sm tracking-wide transition-opacity duration-300 ${
              darkOpeningBackdrop
                ? inProgress
                  ? 'text-red-400/35'
                  : 'text-red-400'
                : soccerOpeningTextClass
                  ? inProgress
                    ? 'text-rose-950/35'
                    : 'text-rose-950/70'
                : inProgress
                  ? 'text-rose-900/20'
                  : 'text-rose-900/45'
            }`}
            style={openingTextStyle()}
          >
            {data.weddingDateLabel}
          </p>
          <p
            className={`font-display text-xs leading-snug transition-opacity duration-300 ${
              darkOpeningBackdrop
                ? inProgress
                  ? 'text-red-400/30'
                  : 'text-red-400/95'
                : soccerOpeningTextClass
                  ? inProgress
                    ? 'text-rose-950/30'
                    : 'text-rose-950/65'
                : inProgress
                  ? 'text-rose-900/18'
                  : 'text-rose-900/40'
            }`}
            style={openingTextStyle()}
          >
            {data.venue}
          </p>
          <p
            className={`-translate-y-1 font-display text-xs transition-opacity duration-300 md:-translate-y-1.5 ${
              darkOpeningBackdrop
                ? inProgress
                  ? 'text-red-300/30'
                  : 'text-red-300'
                : soccerOpeningTextClass
                  ? inProgress
                    ? 'text-rose-950/30'
                    : 'text-rose-950/65'
                : inProgress
                  ? 'text-rose-900/18'
                  : 'text-rose-900/40'
            }`}
            style={openingTextStyle()}
          >
            {data.time}
          </p>
        </div>
        </div>
      </div>
    </motion.div>
  )
}
