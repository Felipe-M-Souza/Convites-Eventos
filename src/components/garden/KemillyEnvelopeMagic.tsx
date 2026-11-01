import { motion } from 'framer-motion'

type Props = {
  open: boolean
}

const SURFACE = [
  { left: '18%', top: '74%', delay: 0.1 },
  { left: '78%', top: '70%', delay: 0.4 },
  { left: '46%', top: '86%', delay: 0.2 },
  { left: '30%', top: '64%', delay: 0.7 },
  { left: '68%', top: '62%', delay: 0.15 },
  { left: '58%', top: '80%', delay: 0.55 },
  { left: '24%', top: '48%', delay: 0.3 },
  { left: '74%', top: '46%', delay: 0.85 },
]

const INTERIOR = [
  { left: '42%', top: '28%', size: 10, delay: 0 },
  { left: '56%', top: '24%', size: 7, delay: 0.4 },
  { left: '48%', top: '36%', size: 14, delay: 0.2 },
  { left: '36%', top: '34%', size: 6, delay: 0.7 },
  { left: '62%', top: '33%', size: 8, delay: 0.15 },
  { left: '50%', top: '20%', size: 5, delay: 0.5 },
]

const DUST = [
  { x: -34, delay: 0.0, size: 7, rise: 230 },
  { x: -16, delay: 0.18, size: 5, rise: 260 },
  { x: 2, delay: 0.05, size: 10, rise: 280 },
  { x: 20, delay: 0.32, size: 6, rise: 240 },
  { x: -24, delay: 0.48, size: 6, rise: 270 },
  { x: 12, delay: 0.12, size: 8, rise: 250 },
  { x: -6, delay: 0.62, size: 11, rise: 300 },
  { x: 30, delay: 0.28, size: 5, rise: 220 },
  { x: -42, delay: 0.55, size: 6, rise: 236 },
  { x: 4, delay: 0.78, size: 7, rise: 268 },
  { x: 24, delay: 0.9, size: 5, rise: 248 },
  { x: -12, delay: 1.05, size: 9, rise: 286 },
  { x: 16, delay: 0.4, size: 4, rise: 210 },
  { x: -8, delay: 1.2, size: 8, rise: 274 },
  { x: 36, delay: 0.7, size: 6, rise: 232 },
  { x: -20, delay: 0.22, size: 5, rise: 256 },
]

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path d="M8 0.4 L9.2 6.1 L15.4 8 L9.2 9.9 L8 15.6 L6.8 9.9 L0.6 8 L6.8 6.1 Z" fill="#fff1c2" />
    </svg>
  )
}

function TinyButterfly({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 64 48" className="h-7 w-10 drop-shadow-[0_3px_4px_rgba(120,40,70,0.35)]" aria-hidden>
      <motion.g
        style={{ transformOrigin: '32px 24px' }}
        animate={{ scaleX: [1, 0.4, 1] }}
        transition={{ duration: 0.38, delay, repeat: Infinity, ease: 'easeInOut' }}
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

/**
 * Luz, pó dourado e borboletas no envelope da Kemilly.
 * O miolo acende quando a aba abre; o papel brilha o tempo todo.
 */
export function KemillyEnvelopeMagic({ open }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[16] overflow-visible" data-envelope-magic={open ? 'open' : 'closed'} aria-hidden>
      {SURFACE.map((item) => (
        <motion.span
          key={`${item.left}-${item.top}`}
          className="absolute"
          style={{ left: item.left, top: item.top }}
          animate={{ opacity: open ? [0.35, 1, 0.4] : [0.15, 0.85, 0.2], scale: [0.7, 1.15, 0.8] }}
          transition={{ duration: open ? 1.15 : 1.8, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Spark className={open ? 'h-5 w-5 drop-shadow-[0_0_8px_rgba(255,196,80,1)]' : 'h-3.5 w-3.5 drop-shadow-[0_0_6px_rgba(255,210,120,0.95)]'} />
        </motion.span>
      ))}

      <motion.div
        className="absolute left-1/2 top-[66%] h-24 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,206,110,0.85) 0%, rgba(255,170,60,0.28) 46%, rgba(255,170,60,0) 72%)',
        }}
        animate={{ opacity: open ? 0 : 0.7, scale: open ? 0.8 : [0.9, 1.08, 0.9] }}
        transition={open ? { duration: 0.35 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute left-1/2 top-[31%] w-[54%] -translate-x-1/2 -translate-y-1/2"
        style={{ height: '46%' }}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-0 rounded-[50%]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,186,55,0.98) 0%, rgba(255,128,24,0.9) 26%, rgba(255,168,60,0.55) 52%, rgba(255,196,110,0) 76%)',
          }}
          animate={open ? { scale: [0.78, 1.08, 0.94], opacity: [0.72, 1, 0.86] } : { scale: 0.7, opacity: 0 }}
          transition={open ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        />
        {INTERIOR.map((dot) => (
          <motion.span
            key={`${dot.left}-${dot.top}`}
            className="absolute rounded-full bg-white"
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              boxShadow: '0 0 10px rgba(255,244,210,0.95)',
            }}
            animate={{ opacity: [0.15, 0.95, 0.2], scale: [0.7, 1.25, 0.8] }}
            transition={{ duration: 1.5, delay: dot.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <motion.div className="absolute left-[30%] top-[38%]" animate={{ y: [0, -8, 2, 0], x: [0, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <TinyButterfly delay={0} />
        </motion.div>
        <motion.div className="absolute left-[58%] top-[22%]" animate={{ y: [0, 6, -4, 0], x: [0, -5, 0] }} transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}>
          <TinyButterfly delay={0.2} />
        </motion.div>
      </motion.div>

      {open ? (
        <>
          <motion.div
            className="absolute left-1/2 top-[-42%] h-[78%] w-[42%] -translate-x-1/2"
            style={{
              background:
                'linear-gradient(to top, rgba(255,176,48,0.92), rgba(255,214,120,0.55) 38%, rgba(255,232,170,0.18) 68%, rgba(255,232,170,0))',
              filter: 'blur(5px)',
            }}
            initial={{ opacity: 0, scaleY: 0.45 }}
            animate={{ opacity: [0.55, 1, 0.7], scaleY: [0.7, 1.05, 0.88] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />
          {DUST.map((mote) => (
            <motion.span
              key={`${mote.x}-${mote.delay}`}
              className="absolute left-1/2 top-[40%] rounded-full bg-[#ffe7a6]"
              style={{
                width: mote.size,
                height: mote.size,
                marginLeft: mote.x,
                boxShadow: '0 0 8px rgba(255,214,120,0.95)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0.7, 0], y: [10, -mote.rise], x: [0, mote.x > 0 ? 16 : -16] }}
              transition={{ duration: 2.05, delay: mote.delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="absolute left-[42%] top-[28%] origin-center scale-125"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: -210, x: -28 }}
            transition={{ duration: 2.5, delay: 0.2, repeat: Infinity, ease: 'easeOut' }}
          >
            <TinyButterfly delay={0.1} />
          </motion.div>
          <motion.div
            className="absolute left-[54%] top-[32%] origin-center scale-110"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0.8, 0], y: -180, x: 26 }}
            transition={{ duration: 2.7, delay: 0.85, repeat: Infinity, ease: 'easeOut' }}
          >
            <TinyButterfly delay={0.3} />
          </motion.div>
          <motion.div
            className="absolute inset-y-[8%] w-[34%]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,248,220,0.55), transparent)',
            }}
            initial={{ left: '-32%' }}
            animate={{ left: ['-32%', '108%'] }}
            transition={{ duration: 1.35, delay: 0.15, ease: 'easeInOut' }}
          />
        </>
      ) : null}
    </div>
  )
}
