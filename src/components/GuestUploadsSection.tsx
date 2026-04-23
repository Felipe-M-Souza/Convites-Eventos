import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  createGuestUploadSignedUrls,
  GUEST_UPLOAD_ACCEPT,
  type GuestUploadRecord,
  type GuestUploadWithUrl,
  uploadGuestUploadFile,
  validateGuestUploadFile,
} from '../lib/guestUploads'
import { trackEvent } from '../lib/analytics'

type Props = {
  inviteSlug: string
  enabled: boolean
  title: string
  description: string
}

export function GuestUploadsSection({ inviteSlug, enabled, title, description }: Props) {
  const reduce = useReducedMotion()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [approvedUploads, setApprovedUploads] = useState<GuestUploadWithUrl[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
            'id, invite_slug, guest_name, caption, original_file_name, file_size_bytes, file_type, mime_type, storage_path, status, created_at, reviewed_at, reviewed_by, approved_at, rejected_at',
          )
          .eq('invite_slug', inviteSlug)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })

        if (queryError) throw new Error(queryError.message)

        const records = (data ?? []) as GuestUploadRecord[]
        const signedMap = await createGuestUploadSignedUrls(client, records.map((record) => record.storage_path))

        if (cancelled) return

        setApprovedUploads(
          records
            .map((record) => ({
              ...record,
              signedUrl: signedMap[record.storage_path] ?? '',
            }))
            .filter((record) => record.signedUrl),
        )
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os registros aprovados.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadApprovedUploads()

    return () => {
      cancelled = true
    }
  }, [canRender, inviteSlug])

  const mediaCountLabel = useMemo(() => {
    if (!approvedUploads.length) return 'Ainda não há registros publicados.'
    if (approvedUploads.length === 1) return '1 registro já aprovado'
    return `${approvedUploads.length} registros já aprovados`
  }, [approvedUploads.length])

  if (!canRender) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const client = supabase
    if (!client || !selectedFile) {
      setError('Escolha um arquivo para enviar.')
      return
    }

    const validation = validateGuestUploadFile(selectedFile)
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
        file_type: fileType,
        mime_type: selectedFile.type,
        storage_path: storagePath,
        status: 'pending',
      })

      if (insertError) throw new Error(insertError.message)

      trackEvent('guest_upload_completed', {
        invite_slug: inviteSlug,
        file_type: fileType,
      })

      setGuestName('')
      setCaption('')
      setSelectedFile(null)
      setSuccess('Arquivo enviado com sucesso. Ele ficará visível após aprovação do responsável.')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao enviar o arquivo.')
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
        <h2 className="font-display text-3xl text-[color:var(--color-ink)] md:text-4xl">{title.trim() || 'Registros dos convidados'}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
          {description.trim() ||
            'Envie uma foto ou vídeo deste momento. O responsável pelo convite aprova antes da publicação.'}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">{mediaCountLabel}</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-stone-200 bg-white/80 p-8 text-center text-sm text-stone-500 shadow-sm">
              Carregando registros aprovados…
            </div>
          ) : approvedUploads.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {approvedUploads.map((upload) => (
                <article key={upload.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                  <div className="aspect-[4/5] bg-stone-100">
                    {upload.file_type === 'video' ? (
                      <video
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                        src={upload.signedUrl}
                      />
                    ) : (
                      <img src={upload.signedUrl} alt={upload.caption || 'Registro enviado por convidado'} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    {upload.guest_name ? (
                      <p className="text-sm font-semibold text-stone-800">{upload.guest_name}</p>
                    ) : null}
                    {upload.caption ? (
                      <p className="text-sm leading-relaxed text-stone-600">{upload.caption}</p>
                    ) : (
                      <p className="text-sm text-stone-400">Sem legenda.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm leading-relaxed text-stone-500 shadow-sm">
              Os primeiros registros aprovados aparecerão aqui.
            </div>
          )}
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-2xl text-stone-800">Enviar foto ou vídeo</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            Envie 1 arquivo por vez. Fotos em JPG, PNG ou WEBP. Vídeos em MP4, MOV ou WEBM.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Seu nome</span>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                placeholder="Opcional"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Legenda</span>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-[110px] w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                placeholder="Opcional"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Arquivo</span>
              <input
                ref={fileInputRef}
                name="guest-upload-file"
                type="file"
                accept={GUEST_UPLOAD_ACCEPT}
                onChange={(event) => {
                  setError(null)
                  setSuccess(null)
                  setSelectedFile(event.target.files?.[0] ?? null)
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700"
              />
              <p className="mt-2 text-xs text-stone-500">
                Fotos até 12 MB. Vídeos até 80 MB. O arquivo só aparece no convite depois da aprovação.
              </p>
            </label>
          </div>

          {selectedFile ? (
            <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-xs text-stone-600">
              <strong className="font-semibold text-stone-700">{selectedFile.name}</strong>
              <br />
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-[color:var(--color-gold)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? 'Enviando…' : 'Enviar para aprovação'}
          </button>
        </form>
      </div>
    </motion.section>
  )
}
