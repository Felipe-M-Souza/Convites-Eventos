import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'
import { useI18n } from '../i18n/useI18n'

type Props = {
  data: EventData
}

export function CoupleStory({ data }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const story = data.coupleStory.trim()
  if (!story) return null

  const heading = data.coupleStoryHeading.trim() || t('invite.coupleStoryHeading')

  return (
    <motion.section
      id="casal"
      className="mx-auto max-w-2xl px-6 py-20 text-center"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="font-display text-3xl text-[color:var(--color-ink)] md:text-4xl">{heading}</h2>
      <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-[color:var(--color-ink-muted)] md:text-lg">
        {story}
      </p>
    </motion.section>
  )
}
