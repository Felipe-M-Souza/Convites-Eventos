import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Props = {
  targetIso: string
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function CountdownTimer({ targetIso }: Props) {
  const reduce = useReducedMotion()
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  const items = [
    { label: 'Dias', value: days },
    { label: 'Horas', value: pad(hours) },
    { label: 'Min', value: pad(minutes) },
    { label: 'Seg', value: pad(seconds) },
  ]

  return (
    <motion.section
      className="border-y border-[color:var(--color-gold-soft)]/40 bg-[color:var(--color-blush)]/60 px-6 py-14"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl text-[color:var(--color-ink)] md:text-4xl">
          Contagem regressiva
        </h2>
        <p className="mt-2 text-sm text-[color:var(--color-ink-muted)]">
          Falta pouco para esse momento especial
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[color:var(--color-gold)]/25 bg-white/80 px-3 py-5 shadow-sm"
            >
              <p className="font-display text-3xl font-semibold text-[color:var(--color-ink)] md:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
