import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'

type Props = {
  data: EventData
}

export function EventDetails({ data }: Props) {
  const reduce = useReducedMotion()

  return (
    <motion.section
      id="evento"
      className="mx-auto max-w-2xl px-6 py-20"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65 }}
    >
      <h2 className="text-center font-display text-3xl text-[color:var(--color-ink)] md:text-4xl">
        {data.eventDetailsHeading?.trim() || 'Detalhes do evento'}
      </h2>
      <dl className="mt-10 space-y-6 text-center md:text-left">
        <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
            Data e horário
          </dt>
          <dd className="mt-2 font-display text-xl text-[color:var(--color-ink)]">
            {data.weddingDateLabel} · {data.time}
          </dd>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
            Local
          </dt>
          <dd className="mt-2 font-display text-xl text-[color:var(--color-ink)]">
            {data.venue}
          </dd>
          <dd className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
            {data.address}
          </dd>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
            {data.dressCodeLabel?.trim() || 'Traje'}
          </dt>
          <dd className="mt-2 text-[color:var(--color-ink)]">{data.dressCode}</dd>
        </div>
        {data.notes ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-[color:var(--color-blush)]/50 p-6">
            <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
              Observações
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
              {data.notes}
            </dd>
          </div>
        ) : null}
      </dl>
    </motion.section>
  )
}
