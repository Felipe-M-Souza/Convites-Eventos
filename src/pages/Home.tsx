import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEventData } from '../contexts/EventDataContext'
import { isCmsConfigured } from '../lib/supabase'
import { HeroSection } from '../components/HeroSection'
import { CoupleMessage } from '../components/CoupleMessage'
import { CountdownTimer } from '../components/CountdownTimer'
import { EventDetails } from '../components/EventDetails'
import { ActionButtons } from '../components/ActionButtons'
import { PhotoGallery } from '../components/PhotoGallery'
import { Footer } from '../components/Footer'
import { MusicToggle, type MusicToggleHandle } from '../components/MusicToggle'
import { EnvelopeOpening } from '../components/EnvelopeOpening'

export function Home() {
  const { data: eventData, status } = useEventData()
  const [inviteUnlocked, setInviteUnlocked] = useState(false)
  const musicRef = useRef<MusicToggleHandle>(null)

  const scrollToInvite = useCallback(() => {
    document.getElementById('mensagem')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

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

  if (isCmsConfigured && status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[color:var(--color-cream)] text-stone-500">
        <p className="font-display text-lg">A carregar o convite…</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)]">
      {audio ? (
        <MusicToggle
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
            onOpen={() => setInviteUnlocked(true)}
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
            </main>
            <Footer data={eventData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
