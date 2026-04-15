import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

function upsertMetaByName(name: string, content: string) {
  let node = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute('name', name)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

function upsertMetaByProperty(property: string, content: string) {
  let node = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute('property', property)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

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

  useEffect(() => {
    if (isCmsConfigured && status !== 'ready') return
    const title = `${eventData.coupleNames} | Convite digital`
    const description = buildInviteDescription(eventData.message)
    const image = eventData.coverImageUrl?.trim() || `${window.location.origin}/images/hero-couple.jpg`
    const url = window.location.href

    document.title = title
    upsertMetaByName('description', description)
    upsertMetaByProperty('og:title', title)
    upsertMetaByProperty('og:description', description)
    upsertMetaByProperty('og:image', image)
    upsertMetaByProperty('og:url', url)
    upsertMetaByProperty('og:type', 'website')
    upsertMetaByName('twitter:card', 'summary_large_image')
    upsertMetaByName('twitter:title', title)
    upsertMetaByName('twitter:description', description)
    upsertMetaByName('twitter:image', image)
  }, [eventData.coupleNames, eventData.coverImageUrl, eventData.message, status])

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
