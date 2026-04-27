import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'
import { useI18n } from '../i18n/useI18n'

type Props = {
  data: EventData
}

export function CoupleMessage({ data }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()

  return (
    <motion.section
      id="mensagem"
      className="mx-auto max-w-2xl px-6 py-20 text-center"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="mb-4 font-display text-2xl text-[color:var(--color-gold)] md:text-3xl">
        {t('invite.messageHeading')}
      </p>
      <p className="text-base leading-relaxed text-[color:var(--color-ink-muted)] md:text-lg">
        {data.message}
      </p>
    </motion.section>
  )
}
