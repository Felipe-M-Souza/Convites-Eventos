import { useEffect, useMemo, useState } from 'react'
import type { EventData } from '../../data/eventData'
import { coupleNameParts, inviteMomentFilled, resolveSealMark } from '../../data/eventData'
import { ActionButtons } from '../ActionButtons'
import { Footer } from '../Footer'
import { GuestUploadsSection } from '../GuestUploadsSection'
import { useI18n } from '../../i18n/useI18n'
import { googleCalendarUrl, monthCells, parseIsoLocal, weekdayLabels } from '../../lib/inviteCalendar'
import { buildRsvpWhatsappHref } from '../../lib/whatsappLink'
import { getCurrentPagePath, trackEvent } from '../../lib/analytics'
import { GuestbookSection } from './GuestbookSection'
import { SageDots, useSagePager } from './SageDots'
import { SageLeaves } from './SageLeaves'

type Props = {
  data: EventData
  inviteSlug: string
}

function displayClock(time: string): string {
  const match = time.trim().match(/^(\d{1,2})h(\d{2})$/i)
  return match ? `${match[1]}:${match[2]}` : time.trim()
}

function Ornament() {
  return (
    <div className="mx-auto mt-4 flex w-40 items-center gap-3 text-[#8ea184]" aria-hidden>
      <span className="h-px flex-1 bg-current" />
      <span className="text-[10px]">✦</span>
      <span className="h-px flex-1 bg-current" />
    </div>
  )
}

function DateLine({ date, locale }: { date: Date; locale: string }) {
  const weekday = date.toLocaleDateString(locale, { weekday: 'long' })
  const month = date.toLocaleDateString(locale, { month: 'long' })
  return (
    <div className="mt-5 text-white">
      <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.18em]">
        <span>{weekday}</span>
        <span className="font-display text-4xl font-normal tracking-normal">{date.getDate()}</span>
        <span>{month}</span>
      </div>
      <p className="mt-2 text-sm tracking-[0.25em]">{date.getFullYear()}</p>
    </div>
  )
}

function PhotoEnvelope({ photos, seal }: { photos: string[]; seal: string }) {
  const left = photos[0]
  const right = photos[1] ?? photos[0]
  return (
    <div className="sage-envelope relative mx-auto mt-6 w-full max-w-[340px] pt-28">
      {left ? (
        <div className="sage-float-a absolute left-[2%] top-3 z-10 w-[48%]">
          <img src={left} alt="" className="aspect-[4/5] w-full rounded-sm border-[6px] border-white object-cover shadow-md" />
        </div>
      ) : null}
      {right ? (
        <div className="sage-float-b absolute right-[1%] top-0 z-10 w-[46%]">
          <img src={right} alt="" className="aspect-[4/5] w-full rounded-sm border-[6px] border-white object-cover shadow-md" />
        </div>
      ) : null}
      <div className="relative z-20">
        <svg viewBox="0 0 360 250" className="block w-full drop-shadow-md" aria-hidden>
          <path d="M16 88h328v150H16z" fill="#8ea484" />
          <path d="M16 238 L180 156 L344 238" fill="none" stroke="#76906c" strokeWidth="1.4" />
          <path d="M16 88 L180 168 L344 88" fill="#7d9474" />
        </svg>
        <div className="sage-seal absolute left-1/2 top-[67.2%] z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#c6a15a] text-[11px] font-semibold tracking-wide text-[#3f3424] shadow-[0_4px_10px_rgba(70,55,20,0.28)]">
          {seal}
        </div>
      </div>
    </div>
  )
}

function MomentBlock({
  title,
  venue,
  time,
  atLabel,
  date,
  locale,
}: {
  title: string
  venue: string
  time: string
  atLabel: string
  date: Date | null
  locale: string
}) {
  return (
    <div className="mt-8">
      <p className="text-xs uppercase tracking-[0.22em] text-white/80">{title}</p>
      {venue ? <p className="mt-2 font-display text-2xl">{venue}</p> : null}
      {time ? (
        <>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/75">{atLabel}</p>
          <p className="mt-1 font-display text-4xl">{displayClock(time)}</p>
        </>
      ) : null}
      {date ? <DateLine date={date} locale={locale} /> : null}
    </div>
  )
}

export function SageInvite({ data, inviteSlug }: Props) {
  const { locale, t } = useI18n()
  const names = coupleNameParts(data.coupleNames)
  const when = useMemo(() => parseIsoLocal(data.weddingDateTime), [data.weddingDateTime])
  const photos = data.galleryPhotos.filter((photo) => photo.trim())
  const { index: photoIndex, select: selectPhoto } = useSagePager(photos.length)
  const [now, setNow] = useState(() => Date.now())
  const ceremony = inviteMomentFilled(data.ceremonyTime, data.ceremonyVenue, data.ceremonyAddress, data.ceremonyImageUrl)
  const reception = inviteMomentFilled(data.receptionTime, data.receptionVenue, data.receptionAddress, data.receptionImageUrl)
  const parents = [data.parentsLeftNames, data.parentsRightNames, data.parentsLeftLabel, data.parentsRightLabel].some((value) => value.trim())
  const guide = [
    { label: t('invite.guestGuideLodging'), text: data.guestGuideLodging.trim() },
    { label: t('invite.guestGuideParking'), text: data.guestGuideParking.trim() },
    { label: t('invite.guestGuideBeauty'), text: data.guestGuideBeauty.trim() },
  ].filter((item) => item.text)
  const dress = data.dressCodeEnabled !== false ? data.dressCode.trim() : ''
  const dressDetail = data.guestGuideDress.trim()
  const placeVenue = (reception ? data.receptionVenue : data.venue).trim()
  const placeAddress = (reception ? data.receptionAddress : data.address).trim()
  const mapsHref = (reception ? data.receptionMapsLink : '') || data.mapsLink
  const rsvpHref = buildRsvpWhatsappHref(data)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const diff = when ? Math.max(0, when.getTime() - now) : 0
  const countdown = [
    { label: t('invite.countdown.days'), value: String(Math.floor(diff / 86400000)) },
    { label: t('invite.countdown.hours'), value: String(Math.floor(diff / 3600000) % 24).padStart(2, '0') },
    { label: t('invite.countdown.minutes'), value: String(Math.floor(diff / 60000) % 60).padStart(2, '0') },
    { label: t('invite.countdown.seconds'), value: String(Math.floor(diff / 1000) % 60).padStart(2, '0') },
  ]
  const cells = when ? monthCells(when) : []
  const weekdays = weekdayLabels(locale)

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f4f7f2] text-[#3f4a38]">
      <SageLeaves />
      <div className="relative z-10 mx-auto max-w-lg pb-16">
        <header className="px-6 pb-4 pt-16 text-center">
          {data.sageEyebrow.trim() ? (
            <p className="text-xs uppercase tracking-[0.35em] text-[#6d7d64]">{data.sageEyebrow}</p>
          ) : null}
          <PhotoEnvelope photos={photos.length ? photos : [data.coverImageUrl].filter(Boolean)} seal={resolveSealMark(data)} />
          <h1 className="mt-8 font-display text-6xl leading-none text-[#4d5c45]">
            {names.map((name, index) => (
              <span key={`${name}-${index}`} className="block">
                {name}
              </span>
            ))}
          </h1>
          <Ornament />
        </header>

        <section className="mt-10 rounded-t-[9rem] bg-[#8ea184] px-6 pb-16 pt-14 text-center text-white">
          <h2 className="text-sm uppercase tracking-[0.28em]">{t('invite.sageCeremonyInfo')}</h2>
          {parents ? (
            <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-4 text-sm">
              <div>
                {data.parentsLeftLabel.trim() ? <p className="text-white/75">{data.parentsLeftLabel}</p> : null}
                <p className="mt-1 whitespace-pre-line break-words font-medium">{data.parentsLeftNames}</p>
              </div>
              <div className="border-l border-white/30">
                {data.parentsRightLabel.trim() ? <p className="text-white/75">{data.parentsRightLabel}</p> : null}
                <p className="mt-1 whitespace-pre-line break-words px-2 font-medium">{data.parentsRightNames}</p>
              </div>
            </div>
          ) : null}
          {data.message.trim() ? <p className="mx-auto mt-8 max-w-sm whitespace-pre-line text-sm leading-7 text-white/95">{data.message}</p> : null}
          <div className="mt-8 font-display text-4xl leading-tight">
            {names.map((name, index) => (
              <span key={`full-${name}-${index}`} className="block">
                {name}
              </span>
            ))}
          </div>
          {ceremony ? (
            <MomentBlock
              title={data.ceremonyTitle.trim() || t('invite.ceremonyTitle')}
              venue={data.ceremonyVenue}
              time={data.ceremonyTime}
              atLabel={t('invite.sageAt')}
              date={when}
              locale={locale}
            />
          ) : null}
          {reception ? (
            <MomentBlock
              title={data.receptionTitle.trim() || t('invite.receptionTitle')}
              venue={data.receptionVenue}
              time={data.receptionTime}
              atLabel={t('invite.sageAt')}
              date={when}
              locale={locale}
            />
          ) : null}
        </section>

        {photos.length ? (
          <section className="px-6 py-14 text-center">
            <h2 className="font-display text-3xl tracking-wide text-[#4d5c45]">{t('invite.galleryHeading')}</h2>
            <div className="relative mx-auto mt-8 max-w-sm overflow-hidden rounded-[28px] bg-white p-4 shadow-sm">
              <img src={photos[photoIndex]} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover" />
            </div>
            <SageDots
              count={photos.length}
              index={photoIndex}
              onSelect={selectPhoto}
              label={(dot) => t('invite.pagerDot', { n: dot + 1 })}
            />
          </section>
        ) : null}

        {when ? (
          <section className="px-6 py-6 text-center">
            <h2 className="font-display text-3xl text-[#4d5c45]">{t('invite.countdownHeading')}</h2>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {countdown.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/80 px-2 py-4 shadow-sm">
                  <p className="font-sans text-3xl font-semibold tabular-nums text-[#3f4a38]">{item.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-[#6d7d64]">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 font-display text-2xl text-[#4d5c45]">
              {when.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </p>
            <div className="mx-auto mt-4 grid max-w-sm grid-cols-7 gap-1 text-xs text-[#6d7d64]">
              {weekdays.map((label) => (
                <span key={label} className="py-1 uppercase">
                  {label}
                </span>
              ))}
              {cells.map((day, index) => {
                const marked = day === when.getDate()
                return (
                  <span
                    key={`${day ?? 'empty'}-${index}`}
                    className={`flex h-9 items-center justify-center rounded-full ${marked ? 'bg-[#5f734f] font-semibold text-white' : ''}`}
                  >
                    {day ?? ''}
                  </span>
                )
              })}
            </div>
            <a
              href={googleCalendarUrl(data, when)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full border border-[#5f734f] px-5 py-2.5 text-sm text-[#5f734f]"
            >
              {t('invite.sageAddCalendar')}
            </a>
          </section>
        ) : null}

        {rsvpHref ? (
          <div className="px-6 py-8 text-center">
            <a
              href={rsvpHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('invite_action_click', { action_type: 'rsvp', page_path: getCurrentPagePath() })}
              className="inline-flex rounded-full bg-[#5f734f] px-8 py-3 text-sm font-medium uppercase tracking-wider text-white"
            >
              {data.rsvpButtonLabel?.trim() || t('invite.rsvpButton')}
            </a>
          </div>
        ) : null}

        {placeVenue || placeAddress ? (
          <section className="px-6 py-8 text-center">
            <h2 className="text-xs uppercase tracking-[0.28em] text-[#6d7d64]">{t('invite.sageReceptionPlace')}</h2>
            {placeVenue ? <p className="mt-3 font-display text-3xl text-[#4d5c45]">{placeVenue}</p> : null}
            {placeAddress ? <p className="mt-2 text-sm leading-6 text-[#5c6a56]">{placeAddress}</p> : null}
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('invite_action_click', { action_type: 'maps', page_path: getCurrentPagePath() })}
                className="mt-4 inline-flex text-sm font-medium text-[#5f734f] underline decoration-[#8ea184] underline-offset-4"
              >
                {data.mapsButtonLabel?.trim() || t('invite.sageDirections')}
              </a>
            ) : null}
          </section>
        ) : null}

        {dress || dressDetail ? (
          <section className="px-6 py-8 text-center">
            <h2 className="text-xs uppercase tracking-[0.28em] text-[#6d7d64]">{data.dressCodeLabel?.trim() || t('invite.detailsDressCode')}</h2>
            {dress ? <p className="mt-3 font-display text-3xl text-[#4d5c45]">{dress}</p> : null}
            {dressDetail && dressDetail !== dress ? (
              <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-sm leading-7 text-[#5c6a56]">{dressDetail}</p>
            ) : null}
          </section>
        ) : null}

        {guide.length ? (
          <section className="grid gap-4 px-6 py-6">
            {guide.map((item) => (
              <article key={item.label} className="rounded-2xl bg-white/75 px-5 py-5 text-left shadow-sm">
                <h3 className="text-xs uppercase tracking-[0.2em] text-[#6d7d64]">{item.label}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#5c6a56]">{item.text}</p>
              </article>
            ))}
          </section>
        ) : null}

        {data.dayProgram.length ? (
          <section className="px-6 py-10">
            <h2 className="text-center font-display text-3xl text-[#4d5c45]">{data.dayProgramHeading.trim() || t('invite.sageProgram')}</h2>
            <ol className="mx-auto mt-8 max-w-md space-y-4">
              {data.dayProgram.filter((item) => item.title.trim()).map((item) => (
                <li key={`${item.time}-${item.title}`} className="flex items-baseline gap-4 border-b border-[#d5e2cf] pb-3">
                  {item.time ? <span className="w-16 shrink-0 font-display text-2xl text-[#5f734f]">{item.time}</span> : null}
                  <span className="text-sm leading-6 text-[#3f4a38]">{item.title}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {data.coupleStory.trim() ? (
          <section className="px-6 py-8 text-center">
            <h2 className="font-display text-3xl text-[#4d5c45]">{data.coupleStoryHeading.trim() || t('invite.coupleStoryHeading')}</h2>
            {data.coupleStoryImageUrl.trim() ? (
              <img src={data.coupleStoryImageUrl} alt="" className="mx-auto mt-6 aspect-[4/5] w-full max-w-sm rounded-[28px] object-cover" />
            ) : null}
            <p className="mx-auto mt-5 max-w-md whitespace-pre-line text-sm leading-7 text-[#5c6a56]">{data.coupleStory}</p>
          </section>
        ) : null}

        {data.guestbookEnabled ? <GuestbookSection inviteSlug={inviteSlug} data={data} /> : null}

        {data.giftsSectionEnabled !== false ? (
          <section className="px-6 py-8 text-center">
            <h2 className="font-display text-3xl text-[#4d5c45]">{t('invite.sageGifts')}</h2>
            <ActionButtons data={data} giftsOnly />
          </section>
        ) : null}

        <GuestUploadsSection
          inviteSlug={inviteSlug}
          enabled={Boolean(data.guestUploadsEnabled)}
          title={data.guestUploadsTitle}
          description={data.guestUploadsDescription}
        />
        <Footer data={data} />
      </div>
    </div>
  )
}
