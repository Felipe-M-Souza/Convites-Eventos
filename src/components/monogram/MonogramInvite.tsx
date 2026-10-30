import { useEffect, useMemo, useState } from 'react'
import type { EventData } from '../../data/eventData'
import { coupleNameParts, inviteMomentFilled, resolveSealMark } from '../../data/eventData'
import { ActionButtons } from '../ActionButtons'
import { Footer } from '../Footer'
import { GuestUploadsSection } from '../GuestUploadsSection'
import { GuestbookSection } from '../sage/GuestbookSection'
import { SageDots, useSagePager } from '../sage/SageDots'
import { useI18n } from '../../i18n/useI18n'
import { googleCalendarUrl, monthCells, parseIsoLocal, weekdayLabels } from '../../lib/inviteCalendar'
import { buildRsvpWhatsappHref } from '../../lib/whatsappLink'
import { getCurrentPagePath, trackEvent } from '../../lib/analytics'
import { MonogramMark } from './MonogramArt'

type Props = {
  data: EventData
  inviteSlug: string
}

function displayClock(time: string): string {
  const match = time.trim().match(/^(\d{1,2})h(\d{2})$/i)
  return match ? `${match[1]}:${match[2]}` : time.trim()
}

function RibbonRule() {
  return (
    <div className="mx-auto mt-5 flex w-40 items-center gap-3 text-[#c6a56a]" aria-hidden>
      <span className="h-px flex-1 bg-current" />
      <span className="h-1.5 w-1.5 rotate-45 border border-current" />
      <span className="h-px flex-1 bg-current" />
    </div>
  )
}

export function MonogramInvite({ data, inviteSlug }: Props) {
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
  const card = 'rounded-[28px] border border-[#e4d3ae] bg-[#fbf8f3]/90 px-6 py-8 text-center shadow-[0_10px_30px_rgba(120,96,60,0.06)]'

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f6f1e8] text-[#3e3832]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at 12% 8%, rgba(255,244,214,0.9), transparent 28%), radial-gradient(circle at 90% 0%, rgba(214,228,214,0.55), transparent 26%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-lg px-4 pb-16 pt-12">
        <header className={`${card} pt-8`}>
          <MonogramMark mark={resolveSealMark(data)} className="mx-auto w-28" />
          {data.sageEyebrow.trim() ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.32em] text-[#8d7352]">{data.sageEyebrow}</p>
          ) : null}
          <h1 className="mt-3 font-display text-5xl leading-none text-[#3e3832] sm:text-6xl">
            {names.map((name, index) => (
              <span key={`${name}-${index}`} className="block">
                {name}
              </span>
            ))}
          </h1>
          <RibbonRule />
          {when ? (
            <p className="mt-4 font-display text-2xl text-[#7d6a4a]">
              {when.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          ) : null}
          {data.message.trim() ? (
            <p id="mensagem" className="mx-auto mt-5 max-w-sm whitespace-pre-line text-sm leading-7 text-[#5c534c]">
              {data.message}
            </p>
          ) : null}
        </header>

        {parents ? (
          <section className={`${card} mt-5`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                {data.parentsLeftLabel.trim() ? <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d7352]">{data.parentsLeftLabel}</p> : null}
                <p className="mt-2 whitespace-pre-line font-display text-2xl leading-tight text-[#3e3832]">{data.parentsLeftNames}</p>
              </div>
              <div className="border-l border-[#e4d3ae]">
                {data.parentsRightLabel.trim() ? <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d7352]">{data.parentsRightLabel}</p> : null}
                <p className="mt-2 whitespace-pre-line px-2 font-display text-2xl leading-tight text-[#3e3832]">{data.parentsRightNames}</p>
              </div>
            </div>
          </section>
        ) : null}

        {ceremony ? (
          <section className={`${card} mt-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#7d9480]">{data.ceremonyTitle.trim() || t('invite.ceremonyTitle')}</p>
            {data.ceremonyVenue.trim() ? <p className="mt-3 font-display text-3xl text-[#3e3832]">{data.ceremonyVenue}</p> : null}
            {data.ceremonyTime.trim() ? <p className="mt-2 font-display text-4xl text-[#7d6a4a]">{displayClock(data.ceremonyTime)}</p> : null}
            {data.ceremonyAddress.trim() ? <p className="mt-3 text-sm leading-6 text-[#5c534c]">{data.ceremonyAddress}</p> : null}
          </section>
        ) : null}

        {reception ? (
          <section className={`${card} mt-5`}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#7d9480]">{data.receptionTitle.trim() || t('invite.receptionTitle')}</p>
            {data.receptionVenue.trim() ? <p className="mt-3 font-display text-3xl text-[#3e3832]">{data.receptionVenue}</p> : null}
            {data.receptionTime.trim() ? <p className="mt-2 font-display text-4xl text-[#7d6a4a]">{displayClock(data.receptionTime)}</p> : null}
            {data.receptionAddress.trim() ? <p className="mt-3 text-sm leading-6 text-[#5c534c]">{data.receptionAddress}</p> : null}
          </section>
        ) : null}

        {when ? (
          <section className={`${card} mt-5`}>
            <h2 className="font-display text-3xl text-[#3e3832]">{t('invite.countdownHeading')}</h2>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {countdown.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/80 px-1 py-3">
                  <p className="font-sans text-2xl font-semibold tabular-nums text-[#3e3832]">{item.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-[#8d7352]">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 font-display text-2xl capitalize text-[#7d6a4a]">
              {when.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </p>
            <div className="mx-auto mt-3 grid max-w-sm grid-cols-7 gap-1 text-xs text-[#8d7352]">
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
                    className={`flex h-9 items-center justify-center rounded-full ${marked ? 'bg-[#7d9480] font-semibold text-white' : ''}`}
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
              className="mt-5 inline-flex rounded-full border border-[#c6a56a] px-5 py-2.5 text-sm text-[#7d6a4a]"
            >
              {t('invite.sageAddCalendar')}
            </a>
          </section>
        ) : null}

        {photos.length ? (
          <section className="mt-8 text-center">
            <h2 className="font-display text-3xl text-[#3e3832]">{t('invite.galleryHeading')}</h2>
            <div className="relative mx-auto mt-6 max-w-sm bg-white p-3 shadow-[0_12px_28px_rgba(90,70,40,0.12)]">
              <img src={photos[photoIndex]} alt="" className="aspect-[4/5] w-full object-cover" />
            </div>
            <SageDots count={photos.length} index={photoIndex} onSelect={selectPhoto} label={(dot) => t('invite.pagerDot', { n: dot + 1 })} />
          </section>
        ) : null}

        {rsvpHref ? (
          <div className="mt-8 text-center">
            <a
              href={rsvpHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('invite_action_click', { action_type: 'rsvp', page_path: getCurrentPagePath() })}
              className="inline-flex rounded-full bg-[#7d9480] px-8 py-3 text-sm font-medium uppercase tracking-[0.18em] text-white"
            >
              {data.rsvpButtonLabel?.trim() || t('invite.rsvpButton')}
            </a>
          </div>
        ) : null}

        {placeVenue || placeAddress ? (
          <section className={`${card} mt-5`}>
            <h2 className="text-[11px] uppercase tracking-[0.28em] text-[#8d7352]">{t('invite.sageReceptionPlace')}</h2>
            {placeVenue ? <p className="mt-3 font-display text-3xl text-[#3e3832]">{placeVenue}</p> : null}
            {placeAddress ? <p className="mt-2 text-sm leading-6 text-[#5c534c]">{placeAddress}</p> : null}
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('invite_action_click', { action_type: 'maps', page_path: getCurrentPagePath() })}
                className="mt-4 inline-flex text-sm text-[#7d6a4a] underline decoration-[#c6a56a] underline-offset-4"
              >
                {data.mapsButtonLabel?.trim() || t('invite.sageDirections')}
              </a>
            ) : null}
          </section>
        ) : null}

        {dress || dressDetail ? (
          <section className={`${card} mt-5`}>
            <h2 className="text-[11px] uppercase tracking-[0.28em] text-[#8d7352]">{data.dressCodeLabel?.trim() || t('invite.detailsDressCode')}</h2>
            {dress ? <p className="mt-3 font-display text-3xl text-[#3e3832]">{dress}</p> : null}
            {dressDetail && dressDetail !== dress ? (
              <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-sm leading-7 text-[#5c534c]">{dressDetail}</p>
            ) : null}
          </section>
        ) : null}

        {guide.length ? (
          <section className="mt-5 grid gap-3">
            {guide.map((item) => (
              <article key={item.label} className={`${card} text-left`}>
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#8d7352]">{item.label}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#5c534c]">{item.text}</p>
              </article>
            ))}
          </section>
        ) : null}

        {data.dayProgram.length ? (
          <section className={`${card} mt-5`}>
            <h2 className="font-display text-3xl text-[#3e3832]">{data.dayProgramHeading.trim() || t('invite.sageProgram')}</h2>
            <ol className="mx-auto mt-6 max-w-md space-y-4 text-left">
              {data.dayProgram.filter((item) => item.title.trim()).map((item) => (
                <li key={`${item.time}-${item.title}`} className="flex items-baseline gap-4 border-b border-[#eadfca] pb-3">
                  {item.time ? <span className="w-16 shrink-0 font-display text-2xl text-[#7d9480]">{item.time}</span> : null}
                  <span className="text-sm leading-6 text-[#3e3832]">{item.title}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {data.coupleStory.trim() ? (
          <section className={`${card} mt-5`}>
            <h2 className="font-display text-3xl text-[#3e3832]">{data.coupleStoryHeading.trim() || t('invite.coupleStoryHeading')}</h2>
            {data.coupleStoryImageUrl.trim() ? (
              <img src={data.coupleStoryImageUrl} alt="" className="mx-auto mt-5 aspect-[4/5] w-full max-w-sm object-cover" />
            ) : null}
            <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-sm leading-7 text-[#5c534c]">{data.coupleStory}</p>
          </section>
        ) : null}

        {data.guestbookEnabled ? <GuestbookSection inviteSlug={inviteSlug} data={data} /> : null}

        {data.giftsSectionEnabled !== false ? (
          <section className="mt-4 text-center">
            <h2 className="font-display text-3xl text-[#3e3832]">{t('invite.sageGifts')}</h2>
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
