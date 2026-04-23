import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEventData } from '../contexts/useEventData'
import { isCmsConfigured } from '../lib/supabase'
import { HeroSection } from '../components/HeroSection'
import { CoupleMessage } from '../components/CoupleMessage'
import { CountdownTimer } from '../components/CountdownTimer'
import { EventDetails } from '../components/EventDetails'
import { ActionButtons } from '../components/ActionButtons'
import { PhotoGallery } from '../components/PhotoGallery'
import { GuestUploadsSection } from '../components/GuestUploadsSection'
import { Footer } from '../components/Footer'
import { MusicToggle, type MusicToggleHandle } from '../components/MusicToggle'
import { EnvelopeOpening } from '../components/EnvelopeOpening'
import { applySeoMeta } from '../lib/seoMeta'
import { trackEvent } from '../lib/analytics'

function buildInviteDescription(message: string): string {
  const text = message.trim().replace(/\s+/g, ' ')
  if (!text) return 'Você recebeu um convite especial.'
  return text.length > 170 ? `${text.slice(0, 167)}...` : text
}

export function Home() {
  const { data: eventData, status, inviteNotFound, inviteSlug } = useEventData()
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
  const primeMusicOnSeal = useCallback(() => {
    musicRef.current?.playFromUserGesture()
  }, [])

  useEffect(() => {
    if (!inviteUnlocked) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return undefined
  }, [inviteUnlocked])

  useEffect(() => {
    if (isCmsConfigured && status !== 'ready') return
    const title = eventData.seoTitle.trim() || `${eventData.coupleNames} | Convite digital`
    const description = eventData.seoDescription.trim() || buildInviteDescription(eventData.message)
    const image = eventData.coverImageUrl?.trim() || `${window.location.origin}/images/hero-couple.jpg`
    const url = window.location.href

    applySeoMeta({ title, description, image, url })
  }, [eventData.coupleNames, eventData.coverImageUrl, eventData.message, eventData.seoDescription, eventData.seoTitle, status])

  if (isCmsConfigured && status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[color:var(--color-cream)] text-stone-500">
        <p className="font-display text-lg">A carregar o convite…</p>
      </div>
    )
  }

  if (isCmsConfigured && inviteNotFound) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[color:var(--color-cream)] px-6 text-center">
        <p className="font-display text-2xl text-[color:var(--color-ink)]">Convite não encontrado</p>
        <p className="max-w-md text-sm text-[color:var(--color-ink-muted)]">
          Não há nenhum convite com o slug <span className="font-mono font-medium text-stone-700">{inviteSlug}</span>.
          Confirma o link ou pede um novo ao organizador.
        </p>
        <Link
          to="/"
          className="rounded-full border border-stone-300 bg-white px-6 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
        >
          Voltar ao início
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)]">
      {audio ? (
        <MusicToggle
          key={audio}
          ref={musicRef}
          src={audio}
          showButton={inviteUnlocked}
        />
      ) : null}
      <AnimatePresence mode="wait">
        {!inviteUnlocked ? (
          <EnvelopeOpening
            key="envelope-opening"
            data={eventData}
            onOpen={() => {
              trackEvent('invite_opened', {
                invite_slug: inviteSlug,
                page_path: window.location.pathname,
              })
              setInviteUnlocked(true)
            }}
            onSealUserGesture={audio ? primeMusicOnSeal : undefined}
          />
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
              <CountdownTimer targetIso={eventData.weddingDateTime} />
              <EventDetails data={eventData} />
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
