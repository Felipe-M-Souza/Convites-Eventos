import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  createGuestUploadSignedUrls,
  formatGuestUploadBytes,
  formatGuestUploadDuration,
  getGuestUploadPreviewPath,
  GUEST_UPLOAD_ACCEPT,
  type GuestUploadRecord,
  requestGuestVideoProcessing,
  readGuestUploadSelection,
  type GuestUploadSelection,
  type GuestUploadWithUrl,
  uploadGuestUploadFile,
  validateGuestUploadFile,
} from '../lib/guestUploads'
import { trackEvent } from '../lib/analytics'
import { GuestApprovedGalleryModal } from './GuestApprovedGalleryModal'
import { useI18n } from '../i18n/useI18n'

type Props = {
  inviteSlug: string
  enabled: boolean
  title: string
  description: string
}

export function GuestUploadsSection({ inviteSlug, enabled, title, description }: Props) {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [approvedUploads, setApprovedUploads] = useState<GuestUploadWithUrl[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [readingFile, setReadingFile] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedUpload, setSelectedUpload] = useState<GuestUploadSelection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)

  const canRender = enabled && Boolean(supabase)

  useEffect(() => {
    if (!canRender || !supabase) return
    const client = supabase

    let cancelled = false

    const loadApprovedUploads = async () => {
      setLoading(true)
      try {
        const { data, error: queryError } = await client
          .from('guest_uploads')
          .select(
            'id, invite_slug, guest_name, caption, original_file_name, file_size_bytes, original_file_size_bytes, processed_file_size_bytes, duration_seconds, file_type, mime_type, storage_path, processed_storage_path, processing_status, processing_error, status, created_at, expires_at, deleted_at, reviewed_at, reviewed_by, approved_at, rejected_at',
          )
          .eq('invite_slug', inviteSlug)
          .eq('status', 'approved')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (queryError) throw new Error(queryError.message)

        const records = (data ?? []) as GuestUploadRecord[]
        const signedMap = await createGuestUploadSignedUrls(
          client,
          records.map((record) => getGuestUploadPreviewPath(record)).filter(Boolean),
        )

        if (cancelled) return

        setApprovedUploads(
          records
            .map((record) => ({
              ...record,
              signedUrl: signedMap[getGuestUploadPreviewPath(record)] ?? '',
            }))
            .filter((record) => record.signedUrl),
        )
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t('guestUploads.errorLoad'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadApprovedUploads()

    return () => {
      cancelled = true
    }
  }, [canRender, inviteSlug, t])

  const mediaCountLabel = useMemo(() => {
    if (loading) return t('guestUploads.loading')
    if (!approvedUploads.length) return t('guestUploads.emptyCount')
    if (approvedUploads.length === 1) return t('guestUploads.singleCount')
    return t('guestUploads.multipleCount', { count: approvedUploads.length })
  }, [approvedUploads.length, loading, t])

  if (!canRender) return null

  const handleFileSelection = async (file: File | null) => {
    setError(null)
    setSuccess(null)
    setSelectedFile(null)
    setSelectedUpload(null)

    if (!file) return

    setReadingFile(true)
    try {
      const nextSelection = await readGuestUploadSelection(file)
      const validation = validateGuestUploadFile(file, nextSelection)
      if (!validation.ok) {
        setError(validation.message)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      setSelectedFile(file)
      setSelectedUpload(nextSelection)
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : 'Não foi possível analisar o arquivo selecionado.')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setReadingFile(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const client = supabase
    if (!client || !selectedFile) {
      setError(t('guestUploads.errorChooseFile'))
      return
    }

    const validation = validateGuestUploadFile(selectedFile, selectedUpload)
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const uploadId = crypto.randomUUID()
      const fileType = selectedFile.type.startsWith('video/') ? 'video' : 'image'

      trackEvent('guest_upload_started', {
        invite_slug: inviteSlug,
        file_type: fileType,
      })

      const storagePath = await uploadGuestUploadFile(client, inviteSlug, uploadId, selectedFile)

      const { error: insertError } = await client.from('guest_uploads').insert({
        id: uploadId,
        invite_slug: inviteSlug,
        guest_name: guestName.trim(),
        caption: caption.trim(),
        original_file_name: selectedFile.name,
        file_size_bytes: selectedFile.size,
        original_file_size_bytes: selectedFile.size,
        processed_file_size_bytes: null,
        duration_seconds: selectedUpload?.durationSeconds ?? null,
        file_type: fileType,
        mime_type: selectedFile.type,
        storage_path: storagePath,
        processed_storage_path: null,
        processing_status: fileType === 'video' ? 'uploaded' : 'ready',
        processing_error: null,
        status: 'pending',
      })

      if (insertError) throw new Error(insertError.message)

      if (fileType === 'video') {
        try {
          await requestGuestVideoProcessing(client, uploadId)
          trackEvent('guest_video_processing_started', {
            invite_slug: inviteSlug,
            upload_id: uploadId,
          })
        } catch (processingError) {
          await client
            .from('guest_uploads')
            .update({
              processing_status: 'failed',
              processing_error:
                processingError instanceof Error ? processingError.message : 'Não foi possível iniciar o processamento.',
            })
            .eq('id', uploadId)
        }
      }

      trackEvent('guest_upload_completed', {
        invite_slug: inviteSlug,
        file_type: fileType,
      })

      setGuestName('')
      setCaption('')
      setSelectedFile(null)
      setSelectedUpload(null)
      setSuccess(
        fileType === 'video'
          ? t('guestUploads.successVideo')
          : t('guestUploads.successImage'),
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('guestUploads.errorSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.section
      id="registros-dos-convidados"
      className="mx-auto max-w-5xl px-6 py-20"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65 }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-[color:var(--color-ink)] md:text-4xl">{title.trim() || t('guestUploads.defaultTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
          {description.trim() ||
            t('guestUploads.defaultDescription')}
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{mediaCountLabel}</p>
          {!loading && approvedUploads.length > 0 ? (
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="rounded-full border border-[color:var(--color-gold)]/45 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-ink)] shadow-sm transition hover:bg-[color:var(--color-blush)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-gold)]"
            >
              {t('invite.galleryHeading')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-10 mx-auto max-w-lg">
        <form onSubmit={(event) => void handleSubmit(event)} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-2xl text-stone-800">{t('guestUploads.formTitle')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            {t('guestUploads.formDescription')}
          </p>
          <p className="mt-2 rounded-2xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-600">
            {t('guestUploads.mobileHint')}
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">{t('guestUploads.name')}</span>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                placeholder={t('guestUploads.optional')}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">{t('guestUploads.caption')}</span>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-[110px] w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                placeholder={t('guestUploads.optional')}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">{t('guestUploads.file')}</span>
              <input
                ref={fileInputRef}
                name="guest-upload-file"
                type="file"
                accept={GUEST_UPLOAD_ACCEPT}
                onChange={(event) => void handleFileSelection(event.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700"
              />
              <p className="mt-2 text-xs text-stone-500">
                {t('guestUploads.constraints')}
              </p>
            </label>
          </div>

          {readingFile ? (
            <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-xs text-stone-600">
              {t('guestUploads.readingFile')}
            </div>
          ) : null}

          {selectedFile ? (
            <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-xs text-stone-600">
              <strong className="font-semibold text-stone-700">{selectedFile.name}</strong>
              <br />
              {selectedUpload?.kind === 'video' ? t('guestUploads.video') : t('guestUploads.photo')} • {formatGuestUploadBytes(selectedFile.size)}
              {selectedUpload?.durationSeconds != null ? ` • ${formatGuestUploadDuration(selectedUpload.durationSeconds)}` : ''}
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={submitting || readingFile}
            className="mt-6 w-full rounded-full bg-[color:var(--color-gold)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {readingFile ? t('guestUploads.readingFile') : submitting ? t('guestUploads.submitting') : t('guestUploads.submit')}
          </button>
        </form>
      </div>

      <GuestApprovedGalleryModal
        inviteSlug={inviteSlug}
        uploads={approvedUploads}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </motion.section>
  )
}
