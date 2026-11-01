import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Phase = 'life' | 'wash' | 'done'

const LIFE_MS = 4600
const WASH_MS = 1800
const SKIP_WASH_MS = 700

const BUTTERFLIES = [
  { left: '1%', top: '46%', x: ['0vw', '16vw', '36vw'], y: ['0vh', '-10vh', '-4vh'], delay: 0.05, duration: 4.5, scale: 1.05 },
  { left: '78%', top: '34%', x: ['0vw', '-16vw', '-38vw'], y: ['0vh', '6vh', '-8vh'], delay: 0.35, duration: 4.3, scale: 0.92 },
  { left: '18%', top: '16%', x: ['0vw', '10vw', '22vw'], y: ['0vh', '8vh', '4vh'], delay: 0.2, duration: 4.1, scale: 0.78 },
  { left: '62%', top: '68%', x: ['0vw', '8vw', '-6vw'], y: ['0vh', '-16vh', '-28vh'], delay: 0.55, duration: 4.2, scale: 0.96 },
  { left: '40%', top: '78%', x: ['0vw', '-12vw', '6vw'], y: ['0vh', '-20vh', '-36vh'], delay: 0.9, duration: 3.8, scale: 0.7 },
]

const SPARKLES = [
  { left: '16%', top: '20%' },
  { left: '30%', top: '34%' },
  { left: '72%', top: '16%' },
  { left: '84%', top: '40%' },
  { left: '12%', top: '74%' },
  { left: '78%', top: '78%' },
  { left: '48%', top: '14%' },
  { left: '58%', top: '66%' },
]

const MOTES = [
  { x: -40, delay: 0.35, size: 7 },
  { x: -18, delay: 0.7, size: 5 },
  { x: 4, delay: 0.2, size: 8 },
  { x: 28, delay: 0.9, size: 6 },
  { x: -26, delay: 1.15, size: 5 },
  { x: 16, delay: 0.5, size: 6 },
  { x: -6, delay: 1.4, size: 9 },
  { x: 42, delay: 1.05, size: 5 },
  { x: -50, delay: 1.6, size: 6 },
  { x: 8, delay: 1.85, size: 7 },
  { x: 24, delay: 2.1, size: 5 },
  { x: -16, delay: 2.3, size: 8 },
  { x: 0, delay: 2.55, size: 6 },
  { x: -32, delay: 2.7, size: 5 },
  { x: 34, delay: 2.4, size: 7 },
]

type Props = {
  envelopeSrc: string
  onClear: () => void
}

function ButterflyGlyph() {
  return (
    <svg viewBox="0 0 64 48" className="h-16 w-24 drop-shadow-[0_8px_10px_rgba(120,40,70,0.4)]" aria-hidden>
      <motion.g
        style={{ transformOrigin: '32px 24px' }}
        animate={{ scaleX: [1, 0.45, 1] }}
        transition={{ duration: 0.42, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M32 24 C40 8 58 6 58 20 C58 32 42 34 32 26 Z" fill="#f7b7cb" stroke="#e7c56a" strokeWidth="1" />
        <path d="M32 24 C24 8 6 6 6 20 C6 32 22 34 32 26 Z" fill="#f7b7cb" stroke="#e7c56a" strokeWidth="1" />
        <path d="M32 26 C40 30 50 40 42 44 C34 40 32 32 32 26 Z" fill="#e56b98" />
        <path d="M32 26 C24 30 14 40 22 44 C30 40 32 32 32 26 Z" fill="#e56b98" />
      </motion.g>
      <path d="M32 14 C33.2 20 33.2 32 32 40 C30.8 32 30.8 20 32 14 Z" fill="#c9892f" />
    </svg>
  )
}

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path d="M8 0.6 L9.1 6.2 L15.2 8 L9.1 9.8 L8 15.4 L6.9 9.8 L0.8 8 L6.9 6.2 Z" fill="#fff4c8" />
    </svg>
  )
}

/**
 * Abertura curta da Kemilly: o envelope da cliente acende, as borboletas cruzam
 * e um pó dourado sobe. Em seguida um véu branco com brilhos revela o laço.
 * Desenho próprio — não usa o vídeo da loja de referência.
 */
export function KemillyOpeningLife({ envelopeSrc, onClear }: Props) {
  const [phase, setPhase] = useState<Phase>('life')
  const [washMs, setWashMs] = useState(WASH_MS)
  const phaseRef = useRef<Phase>('life')
  const onClearRef = useRef(onClear)
  onClearRef.current = onClear

  const beginWash = (ms: number) => {
    if (phaseRef.current !== 'life') return
    phaseRef.current = 'wash'
    setWashMs(ms)
    setPhase('wash')
    onClearRef.current()
  }
  const beginWashRef = useRef(beginWash)
  beginWashRef.current = beginWash

  useEffect(() => {
    const id = window.setTimeout(() => beginWashRef.current(WASH_MS), LIFE_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (phase !== 'wash') return undefined
    const id = window.setTimeout(() => {
      phaseRef.current = 'done'
      setPhase('done')
    }, washMs)
    return () => window.clearTimeout(id)
  }, [phase, washMs])

  if (phase === 'done') return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[30] overflow-hidden"
      data-kemilly-intro={phase}
      aria-hidden={phase !== 'life'}
    >
      {phase === 'life' ? (
        <IntroLife envelopeSrc={envelopeSrc} onSkip={() => beginWashRef.current(SKIP_WASH_MS)} />
      ) : (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: washMs / 1000, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-white" />
          {SPARKLES.map((item, index) => (
            <span
              key={`wash-${item.left}`}
              className="absolute"
              style={{ left: item.left, top: item.top, opacity: 0.35 + (index % 3) * 0.2 }}
            >
              <Spark className="h-2.5 w-2.5" />
            </span>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function IntroLife({ envelopeSrc, onSkip }: { envelopeSrc: string; onSkip: () => void }) {
  return (
    <>
      {SPARKLES.map((item, index) => (
        <motion.span
          key={`${item.left}-${item.top}`}
          className="absolute"
          style={{ left: item.left, top: item.top }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0.25, 1, 0.4], scale: [0.4, 1, 0.7, 1.05, 0.6] }}
          transition={{ duration: 2.4, delay: index * 0.18, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Spark className="h-5 w-5 drop-shadow-[0_0_8px_rgba(255,210,120,0.95)]" />
        </motion.span>
      ))}

      {BUTTERFLIES.map((item) => (
        <motion.div
          key={item.left + item.top}
          className="absolute"
          style={{ left: item.left, top: item.top, scale: item.scale }}
          initial={{ opacity: 0 }}
          animate={{ x: item.x, y: item.y, opacity: [0, 1, 1, 0.85] }}
          transition={{ duration: item.duration, delay: item.delay, ease: 'easeInOut' }}
        >
          <ButterflyGlyph />
        </motion.div>
      ))}

      <div className="absolute left-1/2 top-[48%] w-[min(76vw,320px)] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="absolute left-1/2 top-[46%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,214,120,0.95) 0%, rgba(255,170,60,0.45) 36%, rgba(255,170,60,0) 70%)',
          }}
          initial={{ opacity: 0.35, scale: 0.72 }}
          animate={{ opacity: [0.4, 0.85, 0.55, 1], scale: [0.8, 1.15, 0.95, 1.7] }}
          transition={{ duration: 4.4, times: [0, 0.28, 0.5, 1], ease: 'easeInOut' }}
        />
        <motion.img
          src={envelopeSrc}
          alt=""
          className="relative w-full drop-shadow-[0_16px_28px_rgba(120,40,70,0.32)]"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: [18, 0, -5, 0], scale: 1 }}
          transition={{
            opacity: { duration: 0.7 },
            scale: { duration: 0.7 },
            y: { duration: 4.2, ease: 'easeInOut' },
          }}
          draggable={false}
        />
        <motion.div
          className="absolute left-1/2 top-[8%] h-44 w-28 -translate-x-1/2"
          style={{
            background:
              'linear-gradient(to top, rgba(255,196,80,0.9), rgba(255,226,160,0.28) 58%, rgba(255,226,160,0))',
            filter: 'blur(8px)',
          }}
          initial={{ opacity: 0.15, scaleY: 0.45 }}
          animate={{ opacity: [0.2, 0.45, 0.95], scaleY: [0.45, 0.8, 1.25] }}
          transition={{ duration: 4.2, times: [0, 0.4, 1], ease: 'easeInOut' }}
        />
        {MOTES.map((mote) => (
          <motion.span
            key={`${mote.x}-${mote.delay}`}
            className="absolute left-1/2 top-[58%] rounded-full bg-[#ffe7a6]"
            style={{
              width: mote.size,
              height: mote.size,
              marginLeft: mote.x,
              boxShadow: '0 0 8px rgba(255,214,120,0.95)',
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0.85, 0], y: [8, -230], x: [0, mote.x > 0 ? 22 : -22] }}
            transition={{ duration: 2.6, delay: mote.delay, ease: 'easeOut' }}
          />
        ))}
      </div>

      <motion.div
        className="absolute -inset-y-10 w-[42%]"
        style={{
          background:
            'linear-gradient(100deg, transparent 0%, rgba(255,248,230,0.05) 35%, rgba(255,236,190,0.42) 50%, rgba(255,248,230,0.05) 65%, transparent 100%)',
        }}
        initial={{ left: '-46%' }}
        animate={{ left: ['-46%', '120%'] }}
        transition={{ duration: 2.4, delay: 2.5, ease: 'easeInOut' }}
      />

      <button
        type="button"
        onClick={onSkip}
        className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#a24b68] shadow-sm"
      >
        Pular animação
      </button>
    </>
  )
}
