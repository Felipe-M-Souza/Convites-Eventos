import { motion, useReducedMotion } from 'framer-motion'
import { inviteMomentFilled, type EventData } from '../data/eventData'
import { useI18n } from '../i18n/useI18n'

type Props = {
  data: EventData
  inviteSlug?: string
}

type DressAvoidColor = {
  label: string
  hex: string
}

/** Cores que a cliente pediu para vetar, só neste convite. A escrita fica à frente da bolinha. */
const DRESS_AVOID_BY_SLUG: Record<string, { note: string; colors: DressAvoidColor[] }> = {
  'kemilly-15-anos': {
    note: 'Não pode ser utilizado',
    colors: [
      { label: 'Rosa', hex: '#e56b98' },
      { label: 'Rosa claro', hex: '#f6c6d6' },
      { label: 'Rosê', hex: '#c48996' },
      { label: 'Rosa pink', hex: '#ff4f9a' },
    ],
  },
}

function DressAvoidList({ note, colors }: { note: string; colors: DressAvoidColor[] }) {
  return (
    <div className="mt-4">
      <p className="text-sm text-[color:var(--color-ink)]">{note}</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-start">
        {colors.map((color) => (
          <li key={color.label} className="inline-flex items-center gap-2 text-sm text-[color:var(--color-ink)]">
            <span>{color.label}</span>
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: color.hex }}
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ScheduleCard({
  eyebrow,
  time,
  venue,
  address,
  mapsLink,
  mapsLabel,
  imageUrl,
}: {
  eyebrow: string
  time: string
  venue: string
  address: string
  mapsLink: string
  mapsLabel: string
  imageUrl: string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white/70 shadow-sm">
      {imageUrl ? <img src={imageUrl} alt={eyebrow} className="aspect-[4/3] w-full object-cover" /> : null}
      <div className="p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">{eyebrow}</p>
        {time ? <p className="mt-2 font-display text-xl text-[color:var(--color-ink)]">{time}</p> : null}
        {venue ? <p className="mt-2 font-display text-xl text-[color:var(--color-ink)]">{venue}</p> : null}
        {address ? <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-muted)]">{address}</p> : null}
        {mapsLink ? (
          <a
            href={mapsLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-[color:var(--color-gold)] underline decoration-[color:var(--color-gold)]/40 underline-offset-4"
          >
            {mapsLabel}
          </a>
        ) : null}
      </div>
    </div>
  )
}

export function EventDetails({ data, inviteSlug }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const ceremony = inviteMomentFilled(data.ceremonyTime, data.ceremonyVenue, data.ceremonyAddress, data.ceremonyImageUrl)
  const reception = inviteMomentFilled(data.receptionTime, data.receptionVenue, data.receptionAddress, data.receptionImageUrl)
  const hasSchedule = ceremony || reception
  const mapsLabel = data.mapsButtonLabel?.trim() || t('invite.mapButton')

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
        {data.eventDetailsHeading?.trim() || t('invite.detailsHeading')}
      </h2>
      <dl className="mt-10 space-y-6 text-center md:text-left">
        <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
            {hasSchedule ? t('invite.detailsDate') : t('invite.detailsDateTime')}
          </dt>
          <dd className="mt-2 font-display text-xl text-[color:var(--color-ink)]">
            {hasSchedule ? data.weddingDateLabel : `${data.weddingDateLabel} · ${data.time}`}
          </dd>
        </div>
        {hasSchedule ? (
          <div className="grid gap-4 md:grid-cols-2">
            {ceremony ? (
              <ScheduleCard
                eyebrow={data.ceremonyTitle.trim() || t('invite.ceremonyTitle')}
                time={data.ceremonyTime}
                venue={data.ceremonyVenue}
                address={data.ceremonyAddress}
                mapsLink={data.ceremonyMapsLink.trim()}
                mapsLabel={mapsLabel}
                imageUrl={data.ceremonyImageUrl.trim()}
              />
            ) : null}
            {reception ? (
              <ScheduleCard
                eyebrow={data.receptionTitle.trim() || t('invite.receptionTitle')}
                time={data.receptionTime}
                venue={data.receptionVenue}
                address={data.receptionAddress}
                mapsLink={data.receptionMapsLink.trim()}
                mapsLabel={mapsLabel}
                imageUrl={data.receptionImageUrl.trim()}
              />
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
              {t('invite.detailsVenue')}
            </dt>
            <dd className="mt-2 font-display text-xl text-[color:var(--color-ink)]">
              {data.venue}
            </dd>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
              {data.address}
            </dd>
          </div>
        )}
        {data.dressCodeEnabled !== false ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
              {data.dressCodeLabel?.trim() || t('invite.detailsDressCode')}
            </dt>
            <dd className="mt-2 text-[color:var(--color-ink)]">{data.dressCode}</dd>
            {inviteSlug && DRESS_AVOID_BY_SLUG[inviteSlug] ? (
              <DressAvoidList
                note={DRESS_AVOID_BY_SLUG[inviteSlug].note}
                colors={DRESS_AVOID_BY_SLUG[inviteSlug].colors}
              />
            ) : null}
          </div>
        ) : null}
        {data.notes ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-[color:var(--color-blush)]/50 p-6">
            <dt className="text-xs font-medium uppercase tracking-widest text-[color:var(--color-gold)]">
              {t('invite.detailsNotes')}
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
