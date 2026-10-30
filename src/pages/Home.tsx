import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEventData } from '../contexts/useEventData'
import { isCmsConfigured } from '../lib/supabase'
import { HeroSection } from '../components/HeroSection'
import { CoupleMessage } from '../components/CoupleMessage'
import { CoupleStory } from '../components/CoupleStory'
import { CountdownTimer } from '../components/CountdownTimer'
import { EventDetails } from '../components/EventDetails'
import { GuestGuide } from '../components/GuestGuide'
import { ActionButtons } from '../components/ActionButtons'
import { PhotoGallery } from '../components/PhotoGallery'
import { GuestUploadsSection } from '../components/GuestUploadsSection'
import { Footer } from '../components/Footer'
import { MusicToggle, type MusicToggleHandle } from '../components/MusicToggle'
import { EnvelopeOpening } from '../components/EnvelopeOpening'
import { FilmInvite } from '../components/film/FilmInvite'
import { MonogramCover } from '../components/monogram/MonogramCover'
import { MonogramInvite } from '../components/monogram/MonogramInvite'
import { SageCover } from '../components/sage/SageCover'
import { SageInvite } from '../components/sage/SageInvite'
import { applySeoMeta } from '../lib/seoMeta'
import { trackEvent } from '../lib/analytics'
import { buildSiteUrl } from '../lib/siteUrl'
import { useI18n } from '../i18n/useI18n'
import { resolveEventDataForLocale } from '../data/eventData'

function buildInviteDescription(message: string, fallback: string): string {
  const text = message.trim().replace(/\s+/g, ' ')
  if (!text) return fallback
  return text.length > 170 ? `${text.slice(0, 167)}...` : text
}

/**
 * Título que o modelo de aniversário gravava em todo convite novo.
 * Na aba, ele escondia o nome e a idade reais (por exemplo, “50 anos” na festa de 41).
 */
const STOCK_BIRTHDAY_SEO_TITLE = 'Convite digital aniversário 50 anos | Convites Diversos'

/** Segunda faixa que começa assim que a música já gravada no convite termina. */
const FOLLOW_UP_AUDIO_BY_SLUG: Record<string, string> = {
  'eduarda-monteiro-18': '/audio/eduarda-monteiro-18-faixa-2.mp3',
}

function inviteTabTitle(name: string, preview: string, seoTitle: string): string {
  const stored = seoTitle.trim()
  const host = name.trim()
  const occasion = preview.trim()
  if (stored && stored !== STOCK_BIRTHDAY_SEO_TITLE) return stored
  if (host && occasion) return `${host} | ${occasion}`
  if (host) return `${host} | Convite digital`
  return 'Convite digital | Convites Diversos'
}

export function Home() {
  const { data: baseEventData, status, inviteNotFound, inviteSlug } = useEventData()
  const { locale, t } = useI18n()
  const eventData = resolveEventDataForLocale(baseEventData, locale)
  const [inviteUnlocked, setInviteUnlocked] = useState(false)
  const musicRef = useRef<MusicToggleHandle>(null)

  const scrollToInvite = useCallback(() => {
    trackEvent('invite_continue_click', {
      invite_slug: inviteSlug,
      page_path: window.location.pathname,
    })
    document.getElementById('mensagem')?.scrollIntoView({ behavior: 'smooth' })
  }, [inviteSlug])

  const audio = eventData.backgroundAudioUrl?.trim()
  const nextAudio = FOLLOW_UP_AUDIO_BY_SLUG[inviteSlug]
  const primeMusicOnSeal = useCallback(() => {
    musicRef.current?.playFromUserGesture()
  }, [])

  useEffect(() => {
    if (!inviteUnlocked && eventData.inviteTheme !== 'film') {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return undefined
  }, [eventData.inviteTheme, inviteUnlocked])

  const inviteEnabled = eventData.inviteEnabled !== false
  const sageInvite = eventData.inviteTheme === 'sage'
  const monogramInvite = eventData.inviteTheme === 'monogram'
  const filmInvite = eventData.inviteTheme === 'film'

  useEffect(() => {
    if (isCmsConfigured && status !== 'ready') return
    const url = buildSiteUrl(`/c/${encodeURIComponent(inviteSlug)}`)
    if (!inviteEnabled) {
      applySeoMeta({
        title: t('invite.disabledTitle'),
        description: t('invite.disabledDescription'),
        image: buildSiteUrl('/images/hero-couple.jpg'),
        url,
      })
      return
    }
    const title = inviteTabTitle(eventData.coupleNames, eventData.openingPreviewTitle, eventData.seoTitle)
    const description = eventData.seoDescription.trim() || buildInviteDescription(eventData.message, t('invite.openingFallback'))
    const image = eventData.coverImageUrl?.trim() || buildSiteUrl('/images/hero-couple.jpg')

    applySeoMeta({ title, description, image, url })
  }, [eventData.coupleNames, eventData.coverImageUrl, eventData.message, eventData.openingPreviewTitle, eventData.seoDescription, eventData.seoTitle, inviteEnabled, inviteSlug, status, t])

  if (isCmsConfigured && status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[color:var(--color-cream)] text-stone-500">
        <p className="font-display text-lg">{t('common.loadingInvite')}</p>
      </div>
    )
  }

  if (status !== 'loading' && !inviteEnabled) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[color:var(--color-cream)] px-6 text-center">
        <p className="font-display text-3xl text-[color:var(--color-ink)] sm:text-4xl">{t('invite.disabledTitle')}</p>
        <p className="max-w-md text-base leading-7 text-[color:var(--color-ink-muted)]">{t('invite.disabledDescription')}</p>
        <Link
          to="/"
          className="mt-2 rounded-full border border-stone-300 bg-white px-6 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
        >
          {t('common.backHome')}
        </Link>
      </div>
    )
  }

  if (isCmsConfigured && inviteNotFound) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[color:var(--color-cream)] px-6 text-center">
        <p className="font-display text-2xl text-[color:var(--color-ink)]">{t('common.inviteNotFound')}</p>
        <p className="max-w-md text-sm text-[color:var(--color-ink-muted)]">
          {t('common.inviteNotFoundDescription')}{' '}
          <span className="font-mono font-medium text-stone-700">{inviteSlug}</span>
        </p>
        <Link
          to="/"
          className="rounded-full border border-stone-300 bg-white px-6 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
        >
          {t('common.backHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className={`min-h-dvh ${monogramInvite ? 'bg-[#f6f1e8]' : sageInvite ? 'bg-[#f4f7f2]' : 'bg-[color:var(--color-cream)]'}`}>
      {audio ? (
        <MusicToggle
          key={`${audio}|${nextAudio ?? ''}`}
          ref={musicRef}
          src={audio}
          nextSrc={nextAudio}
          showButton={filmInvite || inviteUnlocked}
        />
      ) : null}
      <AnimatePresence mode="wait">
        {filmInvite ? (
          <FilmInvite
            key="film-invite"
            data={eventData}
            onOpenGesture={audio ? primeMusicOnSeal : undefined}
          />
        ) : !inviteUnlocked ? (
          monogramInvite ? (
            <MonogramCover
              key="monogram-cover"
              data={eventData}
              onOpen={() => {
                trackEvent('invite_opened', {
                  invite_slug: inviteSlug,
                  page_path: window.location.pathname,
                })
                setInviteUnlocked(true)
              }}
              onOpenGesture={audio ? primeMusicOnSeal : undefined}
            />
          ) : sageInvite ? (
            <SageCover
              key="sage-cover"
              data={eventData}
              onOpen={() => {
                trackEvent('invite_opened', {
                  invite_slug: inviteSlug,
                  page_path: window.location.pathname,
                })
                setInviteUnlocked(true)
              }}
              onOpenGesture={audio ? primeMusicOnSeal : undefined}
            />
          ) : (
          <EnvelopeOpening
            key="envelope-opening"
            data={eventData}
            inviteSlug={inviteSlug}
            onOpen={() => {
              trackEvent('invite_opened', {
                invite_slug: inviteSlug,
                page_path: window.location.pathname,
              })
              setInviteUnlocked(true)
            }}
            onSealUserGesture={audio ? primeMusicOnSeal : undefined}
          />
          )
        ) : monogramInvite ? (
          <MonogramInvite key="monogram-invite" data={eventData} inviteSlug={inviteSlug} />
        ) : sageInvite ? (
          <SageInvite key="sage-invite" data={eventData} inviteSlug={inviteSlug} />
        ) : (
          <motion.div
            key="invite-main"
            className="min-h-dvh bg-[color:var(--color-cream)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroSection data={eventData} onContinue={scrollToInvite} />
            <main>
              <CoupleMessage data={eventData} />
              <CoupleStory data={eventData} />
              <CountdownTimer targetIso={eventData.weddingDateTime} />
              <EventDetails data={eventData} />
              <GuestGuide data={eventData} />
              <ActionButtons data={eventData} />
              <PhotoGallery photos={eventData.galleryPhotos} />
              <GuestUploadsSection
                inviteSlug={inviteSlug}
                enabled={Boolean(eventData.guestUploadsEnabled)}
                title={eventData.guestUploadsTitle}
                description={eventData.guestUploadsDescription}
              />
            </main>
            <Footer data={eventData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
