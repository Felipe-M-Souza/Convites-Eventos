import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'
import { useI18n } from '../i18n/useI18n'

type Props = {
  data: EventData
}

export function GuestGuide({ data }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const items = [
    { label: t('invite.guestGuideLodging'), text: data.guestGuideLodging.trim() },
    { label: t('invite.guestGuideParking'), text: data.guestGuideParking.trim() },
    { label: t('invite.guestGuideDress'), text: data.guestGuideDress.trim() },
    { label: t('invite.guestGuideBeauty'), text: data.guestGuideBeauty.trim() },
  ].filter((item) => item.text)

  if (items.length === 0) return null

  const heading = data.guestGuideHeading.trim() || t('invite.guestGuideHeading')

  return (
    <motion.section
      id="convidados"
      className="mx-auto max-w-2xl px-6 py-20"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65 }}
    >
      <h2 className="text-center font-display text-3xl text-[color:var(--color-ink)] md:text-4xl">{heading}</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.label} className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm">
            <h3 className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">{item.label}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-ink-muted)]">{item.text}</p>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
