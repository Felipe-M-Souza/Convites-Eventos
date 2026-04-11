import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'
import { buildRsvpWhatsappHref } from '../lib/whatsappLink'

type Props = {
  data: EventData
}

const btn =
  'inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--color-gold)]/40 bg-white px-6 py-3.5 text-sm font-medium text-[color:var(--color-ink)] shadow-sm transition hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-blush)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-gold)] sm:w-auto sm:min-w-[220px]'

export function ActionButtons({ data }: Props) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="mx-auto flex max-w-2xl flex-col items-stretch gap-4 px-6 pb-6 sm:flex-row sm:flex-wrap sm:justify-center"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: 0.05 }}
    >
      <a className={btn} href={data.mapsLink} target="_blank" rel="noreferrer">
        Ver no mapa
      </a>
      <a className={btn} href={buildRsvpWhatsappHref(data)} target="_blank" rel="noreferrer">
        Confirmar presença
      </a>
      <a className={btn} href={data.giftsLink} target="_blank" rel="noreferrer">
        Lista de presentes
      </a>
    </motion.div>
  )
}
