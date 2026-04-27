import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatGuestUploadDuration, type GuestUploadWithUrl } from '../lib/guestUploads'
import { trackEvent } from '../lib/analytics'
import { useI18n } from '../i18n/useI18n'

const THUMBS_PER_PAGE = 15

type Props = {
  inviteSlug: string
  uploads: GuestUploadWithUrl[]
  open: boolean
  onClose: () => void
}

export function GuestApprovedGalleryModal({ inviteSlug, uploads, open, onClose }: Props) {
  const { t } = useI18n()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [page, setPage] = useState(0)
  const [focusId, setFocusId] = useState<string | null>(null)

  const pageCount = Math.max(1, Math.ceil(uploads.length / THUMBS_PER_PAGE))
  const clampedPage = Math.min(Math.max(0, page), pageCount - 1)
  const start = clampedPage * THUMBS_PER_PAGE
  const pageItems = uploads.slice(start, start + THUMBS_PER_PAGE)
  const focused = focusId ? uploads.find((u) => u.id === focusId) ?? null : null
  const focusIndex = focused ? uploads.indexOf(focused) : -1

  useEffect(() => {
    if (!open) {
      setPage(0)
      setFocusId(null)
      return
    }
    trackEvent('guest_gallery_open', { invite_slug: inviteSlug })
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open, inviteSlug])

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)))
  }, [pageCount])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const goPrevPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1))
  }, [])

  const goNextPage = useCallback(() => {
    setPage((p) => Math.min(pageCount - 1, p + 1))
  }, [pageCount])

  const openDetail = useCallback((id: string) => {
    setFocusId(id)
  }, [])

  const closeDetail = useCallback(() => {
    setFocusId(null)
  }, [])

  const goPrevItem = useCallback(() => {
    if (focusIndex <= 0) return
    setFocusId(uploads[focusIndex - 1]!.id)
  }, [focusIndex, uploads])

  const goNextItem = useCallback(() => {
    if (focusIndex < 0 || focusIndex >= uploads.length - 1) return
    setFocusId(uploads[focusIndex + 1]!.id)
  }, [focusIndex, uploads])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-stone-950/85 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-gallery-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col rounded-2xl border border-stone-200/90 bg-[color:var(--color-cream)] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200/80 px-4 py-3 sm:px-5">
          <h2 id="guest-gallery-title" className="font-display text-xl text-[color:var(--color-ink)] sm:text-2xl">
            {focused ? 'Visualizar' : t('invite.galleryHeading')}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Fechar
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          {focused ? (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-inner">
                {focused.file_type === 'video' ? (
                  <video
                    key={focused.id}
                    className="max-h-[min(70dvh,560px)] w-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                    src={focused.signedUrl}
                  />
                ) : (
                  <img
                    src={focused.signedUrl}
                    alt={focused.caption || t('guestUploads.photo')}
                    className="max-h-[min(70dvh,560px)] w-full object-contain"
                  />
                )}
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                  {focused.file_type === 'video'
                    ? `${t('guestUploads.video')}${focused.duration_seconds != null ? ` • ${formatGuestUploadDuration(focused.duration_seconds)}` : ''}`
                    : t('guestUploads.photo')}
                </p>
                {focused.guest_name ? <p className="font-semibold text-stone-800">{focused.guest_name}</p> : null}
                <p className="text-sm leading-relaxed text-stone-600">
                  {focused.caption?.trim() ? focused.caption : t('guestUploads.noCaption')}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  Voltar às miniaturas
                </button>
                <button
                  type="button"
                  disabled={focusIndex <= 0}
                  onClick={goPrevItem}
                  className="rounded-full border border-[color:var(--color-gold)]/40 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-[color:var(--color-blush)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={focusIndex < 0 || focusIndex >= uploads.length - 1}
                  onClick={goNextItem}
                  className="rounded-full border border-[color:var(--color-gold)]/40 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-[color:var(--color-blush)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próximo
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
                {pageItems.map((upload) => (
                  <button
                    key={upload.id}
                    type="button"
                    onClick={() => openDetail(upload.id)}
                    className="group aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm ring-[color:var(--color-gold)] transition hover:ring-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-gold)]"
                  >
                    {upload.file_type === 'video' ? (
                      <video
                        className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        muted
                        playsInline
                        preload="metadata"
                        src={upload.signedUrl}
                        aria-label="Miniatura de vídeo"
                      />
                    ) : (
                      <img
                        src={upload.signedUrl}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    )}
                  </button>
                ))}
              </div>
              {pageCount > 1 ? (
                <nav
                  className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-stone-200/80 pt-4"
                  aria-label="Paginação da galeria"
                >
                  <button
                    type="button"
                    onClick={goPrevPage}
                    disabled={clampedPage <= 0}
                    className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Página anterior
                  </button>
                  <span className="text-sm text-stone-600">
                    Página {clampedPage + 1} de {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={goNextPage}
                    disabled={clampedPage >= pageCount - 1}
                    className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima página
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
