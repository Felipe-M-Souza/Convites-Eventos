import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'

type Props = {
  data: EventData
  onContinue: () => void
}

export function HeroSection({ data, onContinue }: Props) {
  const reduce = useReducedMotion()

  return (
    <header className="relative isolate flex min-h-[100dvh] flex-col items-center justify-end overflow-hidden px-6 pb-14 pt-24 text-center text-white">
      <div
        className="absolute inset-0 bg-stone-900"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55"
        style={{ backgroundImage: `url(${data.coverImageUrl})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/35 to-stone-900/50"
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex max-w-lg flex-col items-center gap-5"
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-display text-lg font-normal italic text-white/90 md:text-xl">
          {data.verse}
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-wide md:text-5xl">
          {data.coupleNames}
        </h1>
        <p className="text-sm font-light uppercase tracking-[0.35em] text-white/80">
          {data.weddingDateLabel}
        </p>
        <motion.button
          type="button"
          onClick={onContinue}
          className="mt-4 rounded-full border border-white/40 bg-white/10 px-8 py-3 text-sm font-medium uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          whileTap={{ scale: reduce ? 1 : 0.97 }}
        >
          Ver convite
        </motion.button>
      </motion.div>
    </header>
  )
}
