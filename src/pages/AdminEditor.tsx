import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getNewInvitePayload,
  inviteTranslationLocales,
  inviteTranslatableFields,
  filmCloneSlug,
  monogramCloneSlug,
  sageCloneSlug,
  type EventData,
  type InviteCreationTemplate,
  type InviteTranslatableField,
  type InviteTranslationLocale,
} from '../data/eventData'
import { useEventData } from '../contexts/useEventData'
import { isCmsConfigured, supabase } from '../lib/supabase'
import { AssetHealthNotice } from '../components/admin/AssetHealthNotice'
import { GalleryPhotosField } from '../components/admin/GalleryPhotosField'
import { GuestbookModeration } from '../components/admin/GuestbookModeration'
import { GiftsQrCodeField } from '../components/admin/GiftsQrCodeField'
import { OwnerAccessField } from '../components/admin/OwnerAccessField'
import { removeGalleryFolderContents, removeGalleryObject, uploadGalleryBlob, uploadGalleryJpeg } from '../lib/galleryStorage'
import { removeGuestUploadFolderContents } from '../lib/guestUploads'
import { buildSiteUrl } from '../lib/siteUrl'
import { normalizeInviteSlug } from '../lib/inviteSlug'
import { resizeImageToJpeg } from '../lib/imageResize'
import { programToText, samplesToText, textToProgram, textToSamples } from '../lib/sageContent'

type Props = {
  onSignOut: () => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {children}
    </label>
  )
}

function DraftLinesField({
  value,
  onChange,
  inputClass,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  inputClass: string
  placeholder: string
}) {
  const [text, setText] = useState(value)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(value)
  }, [focused, value])

  return (
    <textarea
      className={`${inputClass} min-h-[120px] font-mono text-sm`}
      value={text}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const next = event.target.value
        setText(next)
        onChange(next)
      }}
    />
  )
}

function OptionalImageField({
  label,
  value,
  inputClass,
  busy,
  error,
  onUrl,
  onFile,
}: {
  label: string
  value: string
  inputClass: string
  busy: boolean
  error: string | null
  onUrl: (value: string) => void
  onFile: (file: File | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <Field label={label}>
      <input
        className={inputClass}
        value={value}
        placeholder="https://"
        onChange={(event) => onUrl(event.target.value)}
      />
      {supabase ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              event.target.value = ''
              onFile(file)
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
          >
            {busy ? 'A enviar…' : 'Enviar imagem'}
          </button>
          {value.trim() ? (
            <button
              type="button"
              onClick={() => onUrl('')}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
            >
              Remover
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {value.trim() ? (
        <img src={value} alt="" className="mt-3 h-32 w-full rounded-xl object-cover" />
      ) : null}
    </Field>
  )
}

type InviteRow = { id: string; slug: string }
type PortfolioTestimonialStatus = 'pending' | 'approved' | 'rejected'
type PortfolioTestimonialRow = {
  id: string
  client_name: string
  event_context: string
  message: string
  source_path: string
  status: PortfolioTestimonialStatus
  created_at: string
  reviewed_at: string | null
}

const COVER_MAX_EDGE = 1600
const COVER_JPEG_QUALITY = 0.9

const translationLocaleLabels: Record<InviteTranslationLocale, string> = {
  en: 'Inglês',
  es: 'Espanhol',
}

const translationFieldLabels: Record<InviteTranslatableField, string> = {
  openingSealHint: 'Abertura — texto de ajuda',
  openingPreviewTitle: 'Abertura — título de prévia',
  eventDetailsHeading: 'Detalhes — título',
  dressCodeLabel: 'Detalhes — label de traje',
  mapsButtonLabel: 'Botão mapa',
  rsvpButtonLabel: 'Botão RSVP',
  heroContinueLabel: 'Botão continuar',
  seoTitle: 'SEO — title',
  seoDescription: 'SEO — meta description',
  coupleNames: 'Nomes exibidos',
  heroSubtitle: 'Subtítulo abaixo do título',
  verse: 'Frase / versículo',
  weddingDateLabel: 'Data exibida',
  message: 'Mensagem aos convidados',
  venue: 'Local',
  address: 'Endereço',
  time: 'Hora exibida',
  dressCode: 'Traje',
  notes: 'Observações',
  rsvpWhatsappMessage: 'Mensagem WhatsApp',
  giftsButtonLabel: 'Botão lista de presentes',
  giftsIntro: 'Texto lista de presentes',
  giftsQrCaption: 'Frase abaixo do QR',
  guestUploadsTitle: 'Uploads — título',
  guestUploadsDescription: 'Uploads — descrição',
  footerThanks: 'Rodapé — agradecimento',
  footerContact: 'Rodapé — contato/nota',
  coupleStoryHeading: 'História — título',
  coupleStory: 'História do casal',
  ceremonyTitle: 'Cerimônia — título',
  ceremonyTime: 'Cerimônia — horário',
  ceremonyVenue: 'Cerimônia — local',
  ceremonyAddress: 'Cerimônia — endereço',
  receptionTitle: 'Recepção — título',
  receptionTime: 'Recepção — horário',
  receptionVenue: 'Recepção — local',
  receptionAddress: 'Recepção — endereço',
  guestGuideHeading: 'Guia — título',
  guestGuideLodging: 'Guia — hospedagem',
  guestGuideParking: 'Guia — estacionamento',
  guestGuideDress: 'Guia — traje',
  guestGuideBeauty: 'Guia — beleza',
}

const longTranslationFields = new Set<InviteTranslatableField>([
  'seoDescription',
  'verse',
  'message',
  'notes',
  'rsvpWhatsappMessage',
  'giftsIntro',
  'giftsQrCaption',
  'guestUploadsDescription',
  'footerContact',
  'coupleStory',
  'guestGuideLodging',
  'guestGuideParking',
  'guestGuideDress',
  'guestGuideBeauty',
])

function buildAdminInvitePayload(form: EventData): EventData {
  return {
    ...structuredClone(form),
    openingTextColor: form.openingTextColor.trim(),
    openingTextOpacity:
      typeof form.openingTextOpacity === 'number' && Number.isFinite(form.openingTextOpacity)
        ? Math.min(1, Math.max(0, form.openingTextOpacity))
        : null,
    openingTextBold: Boolean(form.openingTextBold),
    openingTextItalic: Boolean(form.openingTextItalic),
    openingTextUnderline: Boolean(form.openingTextUnderline),
  }
}

function getAvailableDuplicateSlug(inviteSlug: string, inviteRows: InviteRow[]) {
  const existing = new Set(inviteRows.map((row) => row.slug))
  const base = normalizeInviteSlug(`${inviteSlug}-copia`) || 'convite-copia'
  let candidate = base
  let suffix = 2

  while (existing.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  return candidate
}

export function AdminEditor({ onSignOut }: Props) {
  const navigate = useNavigate()
  const { data, refresh, inviteId, inviteSlug, inviteNotFound, status } = useEventData()
  const [form, setForm] = useState<EventData>(() => structuredClone(data))
  const [saving, setSaving] = useState(false)
  const [accessBusy, setAccessBusy] = useState(false)
  const [publicEnabled, setPublicEnabled] = useState(() => data.inviteEnabled !== false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [inviteRows, setInviteRows] = useState<InviteRow[]>([])
  const [newSlugDraft, setNewSlugDraft] = useState('')
  const [newInviteTemplate, setNewInviteTemplate] = useState<InviteCreationTemplate>('wedding')
  const [creating, setCreating] = useState(false)
  const [duplicateSlugDraft, setDuplicateSlugDraft] = useState('')
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  const [blockImageBusy, setBlockImageBusy] = useState<null | 'coupleStoryImageUrl' | 'ceremonyImageUrl' | 'receptionImageUrl'>(null)
  const [blockImageErrors, setBlockImageErrors] = useState<Partial<Record<'coupleStoryImageUrl' | 'ceremonyImageUrl' | 'receptionImageUrl', string>>>({})
  const [activeTranslationLocale, setActiveTranslationLocale] = useState<InviteTranslationLocale>('en')
  const coverFileRef = useRef<HTMLInputElement>(null)
  const openingEnvelopeClosedRef = useRef<HTMLInputElement>(null)
  const openingEnvelopeOpenRef = useRef<HTMLInputElement>(null)
  const openingFrameRef = useRef<HTMLInputElement>(null)
  const openingAudioRef = useRef<HTMLInputElement>(null)
  const [openingAssetBusy, setOpeningAssetBusy] = useState<null | 'closed' | 'open' | 'frame' | 'audio'>(null)
  const [openingAssetError, setOpeningAssetError] = useState<string | null>(null)
  const [testimonials, setTestimonials] = useState<PortfolioTestimonialRow[]>([])
  const [testimonialsLoading, setTestimonialsLoading] = useState(false)
  const [testimonialActionId, setTestimonialActionId] = useState<string | null>(null)
  const [testimonialsError, setTestimonialsError] = useState<string | null>(null)
  const [copiedTestimonialId, setCopiedTestimonialId] = useState<string | null>(null)

  const loadInviteList = () => {
    if (!supabase) return
    void supabase
      .from('invite_config')
      .select('id, slug')
      .order('slug')
      .then(({ data: rows, error }) => {
        if (!error && rows) setInviteRows(rows as InviteRow[])
      })
  }

  const loadTestimonials = () => {
    if (!supabase) return
    setTestimonialsLoading(true)
    setTestimonialsError(null)
    void supabase
      .from('portfolio_testimonials')
      .select('id, client_name, event_context, message, source_path, status, created_at, reviewed_at')
      .order('created_at', { ascending: false })
      .limit(80)
      .then(({ data: rows, error }) => {
        setTestimonialsLoading(false)
        if (error) {
          setTestimonialsError(error.message)
          return
        }
        setTestimonials((rows ?? []) as PortfolioTestimonialRow[])
      })
  }

  useEffect(() => {
    setForm(structuredClone(data))
  }, [data])

  useEffect(() => {
    setPublicEnabled(data.inviteEnabled !== false)
  }, [inviteId, data.inviteEnabled])

  useEffect(() => {
    loadInviteList()
  }, [inviteSlug, status])

  useEffect(() => {
    setDuplicateSlugDraft(getAvailableDuplicateSlug(inviteSlug, inviteRows))
  }, [inviteRows, inviteSlug])

  useEffect(() => {
    loadTestimonials()
  }, [])

  const set =
    <K extends keyof EventData>(key: K) =>
    (value: EventData[K]) => {
      setForm((f) => ({ ...f, [key]: value }))
    }

  const setTranslation =
    (locale: InviteTranslationLocale, key: InviteTranslatableField) =>
    (value: string) => {
      setForm((f) => ({
        ...f,
        translations: {
          ...(f.translations ?? {}),
          [locale]: {
            ...(f.translations?.[locale] ?? {}),
            [key]: value,
          },
        },
      }))
    }

  const handleSave = async () => {
    if (!supabase || !inviteId) return
    setSaving(true)
    setMessage(null)
    const payload = buildAdminInvitePayload(form)
    const { error } = await supabase
      .from('invite_config')
      .update({ slug: inviteSlug, payload })
      .eq('id', inviteId)
      .select('id')
      .single()
    setSaving(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    setMessage({ type: 'ok', text: 'Alterações guardadas.' })
    await refresh()
    loadInviteList()
  }

  const handleInviteAccess = async (enabled: boolean) => {
    if (!supabase || !inviteId) return
    setAccessBusy(true)
    setMessage(null)
    const { data: row, error: readError } = await supabase
      .from('invite_config')
      .select('payload')
      .eq('id', inviteId)
      .maybeSingle()
    if (readError || !row || !row.payload || typeof row.payload !== 'object' || Array.isArray(row.payload)) {
      setAccessBusy(false)
      setMessage({ type: 'err', text: readError?.message ?? 'Não foi possível ler o convite para alterar a visualização.' })
      return
    }
    const payload = { ...(row.payload as Record<string, unknown>), inviteEnabled: enabled }
    const { error } = await supabase.from('invite_config').update({ payload }).eq('id', inviteId).select('id').single()
    setAccessBusy(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    set('inviteEnabled')(enabled)
    setPublicEnabled(enabled)
    setMessage({
      type: 'ok',
      text: enabled
        ? 'Convite reativado. O link público voltou a abrir.'
        : 'Convite desativado. O link público mostra o aviso de pagamento.',
    })
  }

  const handleCreateInvite = async () => {
    if (!supabase) return
    const slug = normalizeInviteSlug(newSlugDraft)
    if (!slug) {
      setMessage({ type: 'err', text: 'Slug inválido: usa letras minúsculas, números e hífens (2–64 caracteres).' })
      return
    }
    setCreating(true)
    setMessage(null)
    const id = crypto.randomUUID()
    const payload = getNewInvitePayload(newInviteTemplate)
    const { error } = await supabase.from('invite_config').insert({ id, slug, payload })
    setCreating(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    setNewSlugDraft('')
    navigate(`/admin?slug=${encodeURIComponent(slug)}`)
  }

  const handleDuplicateInvite = async () => {
    if (!supabase || !inviteId) return
    const slug = normalizeInviteSlug(duplicateSlugDraft)
    if (!slug) {
      setMessage({ type: 'err', text: 'Slug inválido: usa letras minúsculas, números e hífens (2–64 caracteres).' })
      return
    }
    if (inviteRows.some((row) => row.slug === slug)) {
      setMessage({ type: 'err', text: `Já existe um convite com o slug «${slug}». Escolha outro slug para a cópia.` })
      return
    }

    setDuplicating(true)
    setMessage(null)
    const id = crypto.randomUUID()
    const payload = buildAdminInvitePayload(form)
    const { error } = await supabase.from('invite_config').insert({ id, slug, payload })
    setDuplicating(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }

    setDuplicateSlugDraft('')
    navigate(`/admin?slug=${encodeURIComponent(slug)}`)
  }

  const handleSaveSageClone = async () => {
    if (!supabase || inviteSlug !== sageCloneSlug || inviteId) return
    setCreating(true)
    setMessage(null)
    const payload = buildAdminInvitePayload({ ...form, inviteTheme: 'sage' })
    const { error } = await supabase.from('invite_config').insert({
      id: sageCloneSlug,
      slug: sageCloneSlug,
      payload,
    })
    setCreating(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    setMessage({ type: 'ok', text: 'Cópia gravada. O modelo verde agora tem o próprio convite.' })
    await refresh()
    loadInviteList()
  }

  const handleSaveMonogramClone = async () => {
    if (!supabase || inviteSlug !== monogramCloneSlug || inviteId) return
    setCreating(true)
    setMessage(null)
    const payload = buildAdminInvitePayload({ ...form, inviteTheme: 'monogram' })
    const { error } = await supabase.from('invite_config').insert({
      id: monogramCloneSlug,
      slug: monogramCloneSlug,
      payload,
    })
    setCreating(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    setMessage({ type: 'ok', text: 'Cópia gravada. O modelo monograma agora tem o próprio convite.' })
    await refresh()
    loadInviteList()
  }

  const handleSaveFilmClone = async () => {
    if (!supabase || inviteSlug !== filmCloneSlug || inviteId) return
    setCreating(true)
    setMessage(null)
    const payload = buildAdminInvitePayload({ ...form, inviteTheme: 'film' })
    const { error } = await supabase.from('invite_config').insert({
      id: filmCloneSlug,
      slug: filmCloneSlug,
      payload,
    })
    setCreating(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    setMessage({ type: 'ok', text: 'Cópia gravada. O filme agora tem o próprio convite.' })
    await refresh()
    loadInviteList()
  }

  const handleDeleteInvite = async () => {
    if (!supabase || !inviteId) return
    if (inviteRows.length < 2) {
      setMessage({
        type: 'err',
        text: 'Cria outro convite primeiro: é preciso haver pelo menos dois convites para poder apagar um.',
      })
      return
    }
    const ok = window.confirm(
      `Apagar definitivamente o convite «${inviteSlug}»?\n\nEsta ação não pode ser anulada. O link /c/${inviteSlug} deixa de funcionar.`,
    )
    if (!ok) return
    setDeleting(true)
    setMessage(null)
    const others = inviteRows.filter((r) => r.id !== inviteId).sort((a, b) => a.slug.localeCompare(b.slug))
    const next = others[0]
    if (!next) {
      setDeleting(false)
      setMessage({ type: 'err', text: 'Não foi possível determinar o convite seguinte.' })
      return
    }
    const { error } = await supabase.from('invite_config').delete().eq('id', inviteId)
    setDeleting(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    try {
      await removeGalleryFolderContents(supabase, inviteSlug)
    } catch {
      /* ficheiros no Storage podem já estar vazios ou política diferente */
    }
    try {
      await removeGuestUploadFolderContents(supabase, inviteSlug)
    } catch {
      /* bucket de uploads de convidados pode já estar vazio */
    }
    navigate(`/admin?slug=${encodeURIComponent(next.slug)}`)
  }

  const inputClass =
    'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-[color:var(--color-gold)] focus:ring-1 focus:ring-[color:var(--color-gold)]'
  const shareUrl = buildSiteUrl(`/i/${encodeURIComponent(inviteSlug)}`)

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShareLink(true)
      window.setTimeout(() => setCopiedShareLink(false), 1800)
    } catch {
      setMessage({ type: 'err', text: 'Não foi possível copiar o link de partilha.' })
    }
  }

  const handleUpdateTestimonialStatus = async (id: string, nextStatus: PortfolioTestimonialStatus) => {
    if (!supabase) return
    setTestimonialActionId(id)
    setTestimonialsError(null)
    const { error } = await supabase
      .from('portfolio_testimonials')
      .update({
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    setTestimonialActionId(null)
    if (error) {
      setTestimonialsError(error.message)
      return
    }
    setTestimonials((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, status: nextStatus, reviewed_at: new Date().toISOString() } : row,
      ),
    )
  }

  const handleDeleteTestimonial = async (testimonial: PortfolioTestimonialRow) => {
    if (!supabase) return
    const ok = window.confirm(
      `Apagar definitivamente este depoimento de ${
        testimonial.client_name.trim() || 'Sem nome'
      }?\n\nEsta ação não pode ser anulada.`,
    )
    if (!ok) return

    setTestimonialActionId(testimonial.id)
    setTestimonialsError(null)
    const { error } = await supabase.from('portfolio_testimonials').delete().eq('id', testimonial.id)

    setTestimonialActionId(null)
    if (error) {
      setTestimonialsError(error.message)
      return
    }
    setTestimonials((rows) => rows.filter((row) => row.id !== testimonial.id))
  }

  const handleCopyTestimonial = async (testimonial: PortfolioTestimonialRow) => {
    const parts = [
      `“${testimonial.message}”`,
      testimonial.client_name.trim() ? testimonial.client_name.trim() : null,
      testimonial.event_context.trim() ? testimonial.event_context.trim() : null,
    ].filter(Boolean)
    try {
      await navigator.clipboard.writeText(parts.join('\n'))
      setCopiedTestimonialId(testimonial.id)
      window.setTimeout(() => setCopiedTestimonialId(null), 1800)
    } catch {
      setTestimonialsError('Não foi possível copiar o depoimento.')
    }
  }

  const handleCoverFile = async (file: File | null) => {
    if (!supabase || !file) return
    setCoverUploadError(null)
    setCoverUploading(true)
    try {
      const jpeg = await resizeImageToJpeg(file, COVER_MAX_EDGE, COVER_JPEG_QUALITY)
      const publicUrl = await uploadGalleryJpeg(supabase, jpeg, inviteSlug)
      set('coverImageUrl')(publicUrl)
    } catch (error) {
      setCoverUploadError(error instanceof Error ? error.message : 'Não foi possível enviar a imagem de capa.')
    } finally {
      setCoverUploading(false)
      if (coverFileRef.current) coverFileRef.current.value = ''
    }
  }

  const handleBlockImage = async (
    field: 'coupleStoryImageUrl' | 'ceremonyImageUrl' | 'receptionImageUrl',
    file: File | null,
  ) => {
    if (!supabase || !file) return
    setBlockImageErrors((current) => ({ ...current, [field]: undefined }))
    setBlockImageBusy(field)
    try {
      const jpeg = await resizeImageToJpeg(file, COVER_MAX_EDGE, COVER_JPEG_QUALITY)
      const publicUrl = await uploadGalleryJpeg(supabase, jpeg, inviteSlug)
      set(field)(publicUrl)
    } catch (error) {
      setBlockImageErrors((current) => ({
        ...current,
        [field]: error instanceof Error ? error.message : 'Não foi possível enviar a imagem.',
      }))
    } finally {
      setBlockImageBusy(null)
    }
  }

  const removeGalleryAssetIfStored = async (publicUrl: string) => {
    if (!supabase || !publicUrl.trim()) return
    try {
      await removeGalleryObject(supabase, publicUrl)
    } catch {
      /* URL externa ou ficheiro já removido */
    }
  }

  const handleOpeningImageUpload = async (which: 'closed' | 'open' | 'frame', file: File | null) => {
    if (!supabase || !file) return
    const field =
      which === 'closed'
        ? 'openingEnvelopeImageUrl'
        : which === 'open'
          ? 'openingEnvelopeOpenImageUrl'
          : 'openingFrameImageUrl'
    const fileRef =
      which === 'closed' ? openingEnvelopeClosedRef : which === 'open' ? openingEnvelopeOpenRef : openingFrameRef
    const maxBytes = 12 * 1024 * 1024
    if (file.size > maxBytes) {
      setOpeningAssetError('Imagem: tamanho máximo 12 MB.')
      return
    }
    setOpeningAssetError(null)
    setOpeningAssetBusy(which === 'closed' ? 'closed' : which === 'open' ? 'open' : 'frame')
    const prevUrl = form[field]
    try {
      let publicUrl: string
      if (file.type === 'image/png' || file.type === 'image/webp') {
        const ext = file.type === 'image/png' ? 'png' : 'webp'
        publicUrl = await uploadGalleryBlob(
          supabase,
          file,
          inviteSlug,
          `opening-${which}-${crypto.randomUUID()}.${ext}`,
          file.type,
        )
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const jpeg = await resizeImageToJpeg(file, 2400, 0.92)
        publicUrl = await uploadGalleryJpeg(supabase, jpeg, inviteSlug)
      } else {
        throw new Error('Formato não suportado. Use PNG, WebP ou JPEG.')
      }
      set(field)(publicUrl)
      void removeGalleryAssetIfStored(prevUrl)
    } catch (error) {
      setOpeningAssetError(
        error instanceof Error ? error.message : 'Não foi possível enviar a imagem.',
      )
    } finally {
      setOpeningAssetBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleOpeningAudioUpload = async (file: File | null) => {
    if (!supabase || !file) return
    const maxBytes = 35 * 1024 * 1024
    if (file.size > maxBytes) {
      setOpeningAssetError('Áudio: tamanho máximo 35 MB.')
      return
    }
    const name = file.name.toLowerCase()
    const ext = name.endsWith('.mp3')
      ? 'mp3'
      : name.endsWith('.wav')
        ? 'wav'
        : name.endsWith('.webm')
          ? 'webm'
          : name.endsWith('.ogg')
            ? 'ogg'
            : null
    if (!ext) {
      setOpeningAssetError('Áudio: use ficheiro MP3, WAV, WebM ou OGG.')
      return
    }
    const contentType =
      ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : ext === 'webm' ? 'audio/webm' : 'audio/ogg'
    setOpeningAssetError(null)
    setOpeningAssetBusy('audio')
    const prevUrl = form.backgroundAudioUrl
    try {
      const publicUrl = await uploadGalleryBlob(
        supabase,
        file,
        inviteSlug,
        `bg-audio-${crypto.randomUUID()}.${ext}`,
        contentType,
      )
      set('backgroundAudioUrl')(publicUrl)
      void removeGalleryAssetIfStored(prevUrl)
    } catch (error) {
      setOpeningAssetError(error instanceof Error ? error.message : 'Não foi possível enviar o áudio.')
    } finally {
      setOpeningAssetBusy(null)
      if (openingAudioRef.current) openingAudioRef.current.value = ''
    }
  }

  if (isCmsConfigured && status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[color:var(--color-cream)] text-stone-500">
        A carregar convite…
      </div>
    )
  }

  if (isCmsConfigured && inviteNotFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-stone-800">Convite não encontrado</h1>
        <p className="mt-3 text-sm text-stone-600">
          Não existe nenhum convite com o slug <span className="font-mono font-semibold">{inviteSlug}</span>.
        </p>
        <Link
          to="/admin?slug=default"
          className="mt-8 inline-block rounded-full bg-[color:var(--color-gold)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Abrir convite «default»
        </Link>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="mt-4 block w-full rounded-full border border-stone-300 py-2.5 text-sm text-stone-700"
        >
          Sair
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-800">Painel do convite</h1>
          <p className="mt-1 text-sm text-stone-500">
            Link público:{' '}
            <Link className="font-mono text-[color:var(--color-gold)] underline" to={`/c/${encodeURIComponent(inviteSlug)}`}>
              /c/{inviteSlug}
            </Link>
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Link para WhatsApp (prévia):{' '}
            <a className="font-mono text-[color:var(--color-gold)] underline" href={shareUrl} target="_blank" rel="noreferrer">
              /i/{inviteSlug}
            </a>
            <button
              type="button"
              onClick={() => void handleCopyShareLink()}
              className="ml-2 inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
            >
              {copiedShareLink ? 'Copiado' : 'Copiar link'}
            </button>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Portfólio
          </Link>
          <Link
            to={`/c/${encodeURIComponent(inviteSlug)}`}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Ver convite
          </Link>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Sair
          </button>
        </div>
      </header>

      <AssetHealthNotice
        assets={[
          { label: 'Capa', url: form.coverImageUrl },
          { label: 'Envelope fechado', url: form.openingEnvelopeImageUrl },
          { label: 'Envelope aberto', url: form.openingEnvelopeOpenImageUrl },
          { label: 'Moldura', url: form.openingFrameImageUrl },
          { label: 'Música', url: form.backgroundAudioUrl },
          ...form.galleryPhotos.map((url, index) => ({ label: `Foto da galeria ${index + 1}`, url })),
          { label: 'Foto da história do casal', url: form.coupleStoryImageUrl },
          { label: 'Foto da cerimônia', url: form.ceremonyImageUrl },
          { label: 'Foto da recepção', url: form.receptionImageUrl },
        ]}
      />

      <section
        className={`mb-8 rounded-xl border p-5 shadow-sm ${
          publicEnabled ? 'border-stone-200 bg-white/80' : 'border-amber-300 bg-amber-50'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg text-stone-800">Visualização pública</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-stone-600">
              {publicEnabled
                ? 'O link está liberado para os convidados.'
                : 'O link está desativado. Quem tentar abrir o convite vê que a visualização vitalícia vale após a aprovação do pagamento.'}
            </p>
          </div>
          <button
            type="button"
            disabled={accessBusy || !supabase || !inviteId}
            onClick={() => void handleInviteAccess(!publicEnabled)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
              publicEnabled ? 'bg-stone-800' : 'bg-[color:var(--color-gold)]'
            }`}
          >
            {accessBusy ? 'A guardar…' : publicEnabled ? 'Desativar convite' : 'Reativar convite'}
          </button>
        </div>
      </section>

      {supabase ? (
        <div className="mb-8 rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="block min-w-[200px] flex-1">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                Editar convite
              </span>
              <select
                className={inputClass}
                value={inviteSlug}
                onChange={(e) => navigate(`/admin?slug=${encodeURIComponent(e.target.value)}`)}
              >
                {inviteRows.length === 0 ? (
                  <option value={inviteSlug}>{inviteSlug}</option>
                ) : (
                  [
                    ...inviteRows,
                    ...[sageCloneSlug, monogramCloneSlug, filmCloneSlug]
                      .filter((slug) => !inviteRows.some((row) => row.slug === slug))
                      .map((slug) => ({ id: slug, slug })),
                  ].map((r) => (
                    <option key={r.id || r.slug} value={r.slug}>
                      {r.slug}
                    </option>
                  ))
                )}
              </select>
            </label>
            <div className="flex w-full flex-col gap-3 sm:flex-1">
              <label className="block w-full sm:max-w-md">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                  Modelo ao criar (só texto inicial — o slug é livre)
                </span>
                <select
                  className={inputClass}
                  value={newInviteTemplate}
                  onChange={(e) => setNewInviteTemplate(e.target.value as InviteCreationTemplate)}
                >
                  <option value="wedding">Casamento (exemplo Maria e João)</option>
                  <option value="birthday_milestone">Aniversário / 50 anos / bodas (textos ajustados)</option>
                  <option value="neutral">Neutro (mínimo para qualquer ocasião)</option>
                </select>
              </label>
              <div className="flex flex-1 flex-wrap items-end gap-2">
              <label className="min-w-[160px] flex-1">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                  Novo slug
                </span>
                <input
                  className={inputClass}
                  placeholder="ex.: 50-anos-maria ou bodas-prata"
                  value={newSlugDraft}
                  onChange={(e) => setNewSlugDraft(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleCreateInvite()}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
              >
                {creating ? 'A criar…' : 'Criar convite'}
              </button>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                Slug da cópia do convite atual
              </span>
              <input
                className={inputClass}
                placeholder="ex.: fernando-correia-vip"
                value={duplicateSlugDraft}
                onChange={(e) => setDuplicateSlugDraft(e.target.value)}
              />
              <span className="mt-1 block text-xs text-stone-500">
                Duplica o convite aberto no admin com os dados atuais do formulário. Depois é só editar a informação
                exclusiva na nova cópia.
              </span>
            </label>
            <button
              type="button"
              disabled={duplicating || !inviteId}
              onClick={() => void handleDuplicateInvite()}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              {duplicating ? 'A duplicar…' : 'Duplicar convite'}
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-stone-500">
              Apagar remove o convite da base e tenta limpar as fotos deste slug no Storage. Só disponível se existirem
              pelo menos dois convites.
            </p>
            <button
              type="button"
              disabled={deleting || inviteRows.length < 2}
              title={
                inviteRows.length < 2
                  ? 'Cria outro convite para poder apagar este.'
                  : 'Apagar definitivamente este convite'
              }
              onClick={() => void handleDeleteInvite()}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {deleting ? 'A apagar…' : 'Apagar este convite'}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {inviteSlug === sageCloneSlug && !inviteId && status === 'ready' ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#c5d5be] bg-[#f4f7f2] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-stone-700">
            Esta é a cópia verde do convite default. O link /c/default-verde já abre. Grave para ela ficar na lista e ser editada à parte.
          </p>
          <button
            type="button"
            disabled={creating || !supabase}
            onClick={() => void handleSaveSageClone()}
            className="shrink-0 rounded-full bg-[#5f734f] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? 'A gravar…' : 'Gravar cópia'}
          </button>
        </div>
      ) : null}

      {inviteSlug === filmCloneSlug && !inviteId && status === 'ready' ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#e4d3ae] bg-[#fbf8f3] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-stone-700">
            Esta é a cópia em filme do convite default. O link /c/default-filme já abre e as cenas passam sozinhas. Grave para ela ficar na lista e ser editada à parte.
          </p>
          <button
            type="button"
            disabled={creating || !supabase}
            onClick={() => void handleSaveFilmClone()}
            className="shrink-0 rounded-full bg-[#7d9480] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? 'A gravar…' : 'Gravar cópia'}
          </button>
        </div>
      ) : null}

      {inviteSlug === monogramCloneSlug && !inviteId && status === 'ready' ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#e4d3ae] bg-[#fbf8f3] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-stone-700">
            Esta é a cópia monograma do convite default. O link /c/default-monograma já abre. Grave para ela ficar na lista e ser editada à parte.
          </p>
          <button
            type="button"
            disabled={creating || !supabase}
            onClick={() => void handleSaveMonogramClone()}
            className="shrink-0 rounded-full bg-[#7d9480] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? 'A gravar…' : 'Gravar cópia'}
          </button>
        </div>
      ) : null}

      <div className="space-y-10">
        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Modelo do convite</legend>
          <p className="text-sm leading-relaxed text-stone-500">
            O clássico mantém o envelope de sempre. O verde minimalista troca a capa e mostra pais, calendário, programa e livro
            de mensagens — o exemplo fica em /c/default-verde. O monograma é o envelope creme com fita sálvia, selo dourado e rosa
            branca — o exemplo fica em /c/default-monograma. O filme usa a mesma paleta e passa as informações sozinho, sem clique
            — o exemplo fica em /c/default-filme. O convite default continua clássico.
          </p>
          <Field label="Visual">
            <select
              className={inputClass}
              value={form.inviteTheme === 'sage' || form.inviteTheme === 'monogram' || form.inviteTheme === 'film' ? form.inviteTheme : 'classic'}
              onChange={(e) => {
                const value = e.target.value
                set('inviteTheme')(value === 'sage' || value === 'monogram' || value === 'film' ? value : 'classic')
              }}
            >
              <option value="classic">Clássico</option>
              <option value="sage">Verde minimalista</option>
              <option value="monogram">Monograma — sálvia e ouro</option>
              <option value="film">Filme — sálvia e bege</option>
            </select>
          </Field>
          <Field label="Linha acima dos nomes">
            <input className={inputClass} value={form.sageEyebrow} onChange={(e) => set('sageEyebrow')(e.target.value)} placeholder="Nosso casamento" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Família da noiva — rótulo">
              <input className={inputClass} value={form.parentsLeftLabel} onChange={(e) => set('parentsLeftLabel')(e.target.value)} />
            </Field>
            <Field label="Família da noiva — nomes">
              <textarea className={`${inputClass} min-h-[72px]`} value={form.parentsLeftNames} onChange={(e) => set('parentsLeftNames')(e.target.value)} />
            </Field>
            <Field label="Família do noivo — rótulo">
              <input className={inputClass} value={form.parentsRightLabel} onChange={(e) => set('parentsRightLabel')(e.target.value)} />
            </Field>
            <Field label="Família do noivo — nomes">
              <textarea className={`${inputClass} min-h-[72px]`} value={form.parentsRightNames} onChange={(e) => set('parentsRightNames')(e.target.value)} />
            </Field>
          </div>
          <Field label="Programa do dia — título">
            <input className={inputClass} value={form.dayProgramHeading} onChange={(e) => set('dayProgramHeading')(e.target.value)} placeholder="Programa do dia" />
          </Field>
          <Field label="Programa do dia">
            <DraftLinesField
              inputClass={inputClass}
              value={programToText(form.dayProgram)}
              onChange={(value) => set('dayProgram')(textToProgram(value))}
              placeholder={'15:00 | Cerimônia\n18:00 | Recepção'}
            />
            <p className="mt-1 text-xs text-stone-500">Uma linha por momento, no formato horário | descrição. Deixe em branco para ocultar.</p>
          </Field>
          <label className="inline-flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.guestbookEnabled === true}
              onChange={(e) => set('guestbookEnabled')(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            Mostrar o livro de mensagens
          </label>
          <Field label="Livro de mensagens — título">
            <input className={inputClass} value={form.guestbookHeading} onChange={(e) => set('guestbookHeading')(e.target.value)} />
          </Field>
          <Field label="Recados de exemplo">
            <DraftLinesField
              inputClass={inputClass}
              value={samplesToText(form.guestbookSamples)}
              onChange={(value) => set('guestbookSamples')(textToSamples(value))}
              placeholder={'Marina | Que este dia seja leve.'}
            />
            <p className="mt-1 text-xs text-stone-500">Uma linha por recado, no formato nome | mensagem. Os recados dos convidados aparecem no convite na hora.</p>
          </Field>
          <GuestbookModeration inviteSlug={inviteSlug} />
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Abertura (envelope)</legend>
          <Field label="Texto de ajuda (selo)">
            <input className={inputClass} value={form.openingSealHint} onChange={(e) => set('openingSealHint')(e.target.value)} />
          </Field>
          <Field label="Título do cartão que sai do envelope">
            <input
              className={inputClass}
              value={form.openingPreviewTitle}
              onChange={(e) => set('openingPreviewTitle')(e.target.value)}
              placeholder="Ex.: 60 anos — keep rocking on!"
            />
          </Field>
          <Field label="Cor dos textos abaixo do envelope">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="color"
                value={form.openingTextColor.trim() || '#5f1733'}
                onChange={(e) => set('openingTextColor')(e.target.value)}
                className="h-10 w-16 rounded-lg border border-stone-300 bg-white p-1"
                aria-label="Escolher cor dos textos da abertura"
              />
              <input
                className={inputClass}
                placeholder="Vazio = cor padrão. Ex.: #5f1733"
                value={form.openingTextColor}
                onChange={(e) => set('openingTextColor')(e.target.value)}
              />
              <button
                type="button"
                onClick={() => set('openingTextColor')('')}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                Usar padrão
              </button>
            </div>
          </Field>
          <Field label="Opacidade dos textos abaixo do envelope (0 = invisível, 1 = sólido)">
            <input
              type="number"
              className={inputClass}
              min={0}
              max={1}
              step={0.05}
              placeholder="Padrão do tema"
              value={form.openingTextOpacity ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim()
                if (raw === '') {
                  set('openingTextOpacity')(null)
                  return
                }
                const v = Number(raw)
                if (Number.isFinite(v)) set('openingTextOpacity')(Math.min(1, Math.max(0, v)))
              }}
            />
          </Field>
          <Field label="Estilo dos textos abaixo do envelope">
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.openingTextBold}
                  onChange={(e) => set('openingTextBold')(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-gold)] focus:ring-[color:var(--color-gold)]"
                />
                Negrito
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.openingTextItalic}
                  onChange={(e) => set('openingTextItalic')(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-gold)] focus:ring-[color:var(--color-gold)]"
                />
                Itálico
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.openingTextUnderline}
                  onChange={(e) => set('openingTextUnderline')(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-gold)] focus:ring-[color:var(--color-gold)]"
                />
                Sublinhado
              </label>
            </div>
          </Field>
          <Field label="Lacre manual (vazio = iniciais dos nomes)">
            <input className={inputClass} value={form.openingSealMark} onChange={(e) => set('openingSealMark')(e.target.value)} />
          </Field>
          <Field label="Interação de abertura">
            <select
              className={inputClass}
              value={form.openingInteractionMode}
              onChange={(e) =>
                set('openingInteractionMode')(e.target.value as EventData['openingInteractionMode'])
              }
            >
              <option value="seal">Selo dourado clássico (clique para abrir)</option>
              <option value="soccer_goal">Futebol — trave + bola (toque na bola)</option>
              <option value="butterfly">Borboleta — voa ao ser tocada</option>
            </select>
            <p className="mt-1 text-xs text-stone-500">
              «Futebol»: o convidado toca na bola para a animação ao golo. «Borboleta»: uma borboleta substitui o selo e
              sai voando ao ser tocada. Ajuste o texto de ajuda acima (ex.: «Toque na borboleta para abrir o convite»).
            </p>
          </Field>
          <Field label="Selo — posição vertical (0 = topo, 1 = base; ~0,8 = ponta do aba)">
            <input
              type="number"
              className={inputClass}
              min={0.5}
              max={0.95}
              step={0.01}
              value={form.openingSealAnchorY}
              onChange={(e) => {
                const v = Number(e.target.value)
                set('openingSealAnchorY')(
                  Number.isFinite(v) ? Math.min(0.95, Math.max(0.5, v)) : form.openingSealAnchorY,
                )
              }}
            />
          </Field>
          <Field label="Selo — posição horizontal (0 = esquerda, 1 = direita; 0,5 = centro)">
            <input
              type="number"
              className={inputClass}
              min={0.08}
              max={0.92}
              step={0.01}
              value={form.openingSealAnchorX}
              onChange={(e) => {
                const v = Number(e.target.value)
                set('openingSealAnchorX')(
                  Number.isFinite(v) ? Math.min(0.92, Math.max(0.08, v)) : form.openingSealAnchorX,
                )
              }}
            />
          </Field>
          <Field label="Envelope — zoom da imagem (vazio = automático; 1 = sem zoom extra, evita cortar bordas)">
            <input
              type="number"
              className={inputClass}
              min={0.85}
              max={1.5}
              step={0.05}
              placeholder="Automático"
              value={form.openingEnvelopeTextureZoom ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim()
                if (raw === '') {
                  set('openingEnvelopeTextureZoom')(null)
                  return
                }
                const v = Number(raw)
                if (Number.isFinite(v) && v > 0) {
                  set('openingEnvelopeTextureZoom')(Math.min(1.5, Math.max(0.85, v)))
                }
              }}
            />
          </Field>
          <Field label="URL imagem envelope fechado">
            <div className="space-y-3">
              <input
                className={inputClass}
                value={form.openingEnvelopeImageUrl}
                onChange={(e) => set('openingEnvelopeImageUrl')(e.target.value)}
              />
              {supabase ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                  <input
                    ref={openingEnvelopeClosedRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/jpg"
                    className="hidden"
                    disabled={openingAssetBusy !== null}
                    onChange={(e) => void handleOpeningImageUpload('closed', e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    disabled={openingAssetBusy !== null}
                    onClick={() => openingEnvelopeClosedRef.current?.click()}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    {openingAssetBusy === 'closed' ? 'A enviar…' : 'Anexar envelope fechado'}
                  </button>
                  <p className="mt-2 text-xs text-stone-500">
                    PNG ou WebP (com transparência) ou JPEG. Vai para o bucket <code className="rounded bg-stone-200/80 px-1">invite-gallery</code>.
                  </p>
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="URL imagem envelope aberto">
            <div className="space-y-3">
              <input
                className={inputClass}
                value={form.openingEnvelopeOpenImageUrl}
                onChange={(e) => set('openingEnvelopeOpenImageUrl')(e.target.value)}
              />
              {supabase ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                  <input
                    ref={openingEnvelopeOpenRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/jpg"
                    className="hidden"
                    disabled={openingAssetBusy !== null}
                    onChange={(e) => void handleOpeningImageUpload('open', e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    disabled={openingAssetBusy !== null}
                    onClick={() => openingEnvelopeOpenRef.current?.click()}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    {openingAssetBusy === 'open' ? 'A enviar…' : 'Anexar envelope aberto'}
                  </button>
                  <p className="mt-2 text-xs text-stone-500">Mesmos formatos que o envelope fechado.</p>
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="URL áudio de fundo (URL ou ficheiro)">
            <div className="space-y-3">
              <input
                className={inputClass}
                value={form.backgroundAudioUrl}
                onChange={(e) => set('backgroundAudioUrl')(e.target.value)}
                placeholder="/audio/exemplo.mp3 ou URL pública"
              />
              {supabase ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                  <input
                    ref={openingAudioRef}
                    type="file"
                    accept=".mp3,.wav,.webm,.ogg,audio/mpeg,audio/wav,audio/webm,audio/ogg"
                    className="hidden"
                    disabled={openingAssetBusy !== null}
                    onChange={(e) => void handleOpeningAudioUpload(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    disabled={openingAssetBusy !== null}
                    onClick={() => openingAudioRef.current?.click()}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    {openingAssetBusy === 'audio' ? 'A enviar…' : 'Anexar música'}
                  </button>
                  <p className="mt-2 text-xs text-stone-500">MP3, WAV, WebM ou OGG (máx. 35 MB). URL relativa a /public continua válida.</p>
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="URL imagem moldura (abertura)">
            <div className="space-y-3">
              <input
                className={inputClass}
                value={form.openingFrameImageUrl}
                onChange={(e) => set('openingFrameImageUrl')(e.target.value)}
                placeholder="/images/moldura-elegante-aliancas.png"
              />
              {supabase ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                  <input
                    ref={openingFrameRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/jpg"
                    className="hidden"
                    disabled={openingAssetBusy !== null}
                    onChange={(e) => void handleOpeningImageUpload('frame', e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    disabled={openingAssetBusy !== null}
                    onClick={() => openingFrameRef.current?.click()}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    {openingAssetBusy === 'frame' ? 'A enviar…' : 'Anexar moldura'}
                  </button>
                  <p className="mt-2 text-xs text-stone-500">
                    Moldura por cima do conteúdo na animação de abertura. Mesmos formatos que o envelope; deixe vazio
                    para usar a imagem por defeito.
                  </p>
                </div>
              ) : null}
            </div>
          </Field>
          {openingAssetError ? <p className="text-sm text-red-600">{openingAssetError}</p> : null}
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Casal e cerimónia</legend>
          <Field label="Nomes do casal">
            <input className={inputClass} value={form.coupleNames} onChange={(e) => set('coupleNames')(e.target.value)} />
          </Field>
          <Field label="Texto logo abaixo do título principal">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={form.heroSubtitle}
              onChange={(e) => set('heroSubtitle')(e.target.value)}
              placeholder="Opcional. Ex.: texto exclusivo para este convidado"
            />
          </Field>
          <Field label="Versículo / frase">
            <textarea className={`${inputClass} min-h-[72px]`} value={form.verse} onChange={(e) => set('verse')(e.target.value)} />
          </Field>
          <Field label="Data (texto exibido)">
            <input className={inputClass} value={form.weddingDateLabel} onChange={(e) => set('weddingDateLabel')(e.target.value)} />
          </Field>
          <Field label="Data e hora (ISO 8601)">
            <input className={inputClass} value={form.weddingDateTime} onChange={(e) => set('weddingDateTime')(e.target.value)} />
          </Field>
          <Field label="Hora (texto)">
            <input className={inputClass} value={form.time} onChange={(e) => set('time')(e.target.value)} />
          </Field>
          <Field label="Local">
            <input className={inputClass} value={form.venue} onChange={(e) => set('venue')(e.target.value)} />
          </Field>
          <Field label="Morada">
            <input className={inputClass} value={form.address} onChange={(e) => set('address')(e.target.value)} />
          </Field>
          <Field label="Traje / dress code no convite">
            <label className="inline-flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.dressCodeEnabled !== false}
                onChange={(e) => set('dressCodeEnabled')(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-gold)] focus:ring-[color:var(--color-gold)]"
              />
              Mostrar o bloco de traje na secção «Detalhes do evento»
            </label>
          </Field>
          <Field label="Dress code">
            <input className={inputClass} value={form.dressCode} onChange={(e) => set('dressCode')(e.target.value)} />
          </Field>
          <Field label="Notas">
            <textarea className={`${inputClass} min-h-[64px]`} value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
          </Field>
          <Field label="Link Google Maps">
            <input className={inputClass} value={form.mapsLink} onChange={(e) => set('mapsLink')(e.target.value)} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">História, cerimônia e dicas</legend>
          <p className="text-sm leading-relaxed text-stone-500">
            Deixe um bloco em branco para ele não aparecer no convite. Cerimônia ou recepção preenchidas substituem o
            cartão único de local. A imagem de cada bloco é opcional: envie um arquivo ou cole o endereço.
          </p>
          <Field label="História — título">
            <input
              className={inputClass}
              value={form.coupleStoryHeading}
              onChange={(e) => set('coupleStoryHeading')(e.target.value)}
              placeholder="O casal"
            />
          </Field>
          <Field label="História do casal">
            <textarea
              className={`${inputClass} min-h-[96px]`}
              value={form.coupleStory}
              onChange={(e) => set('coupleStory')(e.target.value)}
            />
          </Field>
          <OptionalImageField
            label="História — imagem"
            value={form.coupleStoryImageUrl}
            inputClass={inputClass}
            busy={blockImageBusy === 'coupleStoryImageUrl'}
            error={blockImageErrors.coupleStoryImageUrl ?? null}
            onUrl={(value) => set('coupleStoryImageUrl')(value)}
            onFile={(file) => void handleBlockImage('coupleStoryImageUrl', file)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Cerimônia — título">
                <input className={inputClass} value={form.ceremonyTitle} onChange={(e) => set('ceremonyTitle')(e.target.value)} placeholder="Cerimônia" />
              </Field>
              <Field label="Cerimônia — horário">
                <input className={inputClass} value={form.ceremonyTime} onChange={(e) => set('ceremonyTime')(e.target.value)} />
              </Field>
              <Field label="Cerimônia — local">
                <input className={inputClass} value={form.ceremonyVenue} onChange={(e) => set('ceremonyVenue')(e.target.value)} />
              </Field>
              <Field label="Cerimônia — endereço">
                <input className={inputClass} value={form.ceremonyAddress} onChange={(e) => set('ceremonyAddress')(e.target.value)} />
              </Field>
              <Field label="Cerimônia — mapa">
                <input className={inputClass} value={form.ceremonyMapsLink} onChange={(e) => set('ceremonyMapsLink')(e.target.value)} />
              </Field>
              <OptionalImageField
                label="Cerimônia — imagem"
                value={form.ceremonyImageUrl}
                inputClass={inputClass}
                busy={blockImageBusy === 'ceremonyImageUrl'}
                error={blockImageErrors.ceremonyImageUrl ?? null}
                onUrl={(value) => set('ceremonyImageUrl')(value)}
                onFile={(file) => void handleBlockImage('ceremonyImageUrl', file)}
              />
            </div>
            <div className="space-y-4">
              <Field label="Recepção — título">
                <input className={inputClass} value={form.receptionTitle} onChange={(e) => set('receptionTitle')(e.target.value)} placeholder="Recepção" />
              </Field>
              <Field label="Recepção — horário">
                <input className={inputClass} value={form.receptionTime} onChange={(e) => set('receptionTime')(e.target.value)} />
              </Field>
              <Field label="Recepção — local">
                <input className={inputClass} value={form.receptionVenue} onChange={(e) => set('receptionVenue')(e.target.value)} />
              </Field>
              <Field label="Recepção — endereço">
                <input className={inputClass} value={form.receptionAddress} onChange={(e) => set('receptionAddress')(e.target.value)} />
              </Field>
              <Field label="Recepção — mapa">
                <input className={inputClass} value={form.receptionMapsLink} onChange={(e) => set('receptionMapsLink')(e.target.value)} />
              </Field>
              <OptionalImageField
                label="Recepção — imagem"
                value={form.receptionImageUrl}
                inputClass={inputClass}
                busy={blockImageBusy === 'receptionImageUrl'}
                error={blockImageErrors.receptionImageUrl ?? null}
                onUrl={(value) => set('receptionImageUrl')(value)}
                onFile={(file) => void handleBlockImage('receptionImageUrl', file)}
              />
            </div>
          </div>
          <Field label="Guia do convidado — título">
            <input
              className={inputClass}
              value={form.guestGuideHeading}
              onChange={(e) => set('guestGuideHeading')(e.target.value)}
              placeholder="Para os convidados"
            />
          </Field>
          <Field label="Hospedagem">
            <textarea className={`${inputClass} min-h-[72px]`} value={form.guestGuideLodging} onChange={(e) => set('guestGuideLodging')(e.target.value)} />
          </Field>
          <Field label="Estacionamento">
            <textarea className={`${inputClass} min-h-[72px]`} value={form.guestGuideParking} onChange={(e) => set('guestGuideParking')(e.target.value)} />
          </Field>
          <Field label="Traje">
            <textarea className={`${inputClass} min-h-[72px]`} value={form.guestGuideDress} onChange={(e) => set('guestGuideDress')(e.target.value)} />
          </Field>
          <Field label="Beleza">
            <textarea className={`${inputClass} min-h-[72px]`} value={form.guestGuideBeauty} onChange={(e) => set('guestGuideBeauty')(e.target.value)} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Conteúdo e media</legend>
          <Field label="SEO — Title (opcional)">
            <input
              className={inputClass}
              placeholder="Convite Digital [Ocasião] Personalizado | Convites Diversos"
              value={form.seoTitle}
              onChange={(e) => set('seoTitle')(e.target.value)}
            />
          </Field>
          <Field label="SEO — Meta description (opcional)">
            <textarea
              className={`${inputClass} min-h-[76px]`}
              placeholder="Até ~155 caracteres, foco em benefício + CTA."
              value={form.seoDescription}
              onChange={(e) => set('seoDescription')(e.target.value)}
            />
          </Field>
          <Field label="URL imagem de capa (hero)">
            <div className="space-y-3">
              <input className={inputClass} value={form.coverImageUrl} onChange={(e) => set('coverImageUrl')(e.target.value)} />
              {supabase ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={coverFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={coverUploading}
                      onChange={(e) => void handleCoverFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      disabled={coverUploading}
                      onClick={() => coverFileRef.current?.click()}
                      className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
                    >
                      {coverUploading ? 'A enviar capa…' : 'Enviar imagem de capa'}
                    </button>
                    <p className="text-xs text-stone-500">
                      A imagem é otimizada no navegador e enviada para o bucket `invite-gallery`.
                    </p>
                  </div>
                  {coverUploadError ? <p className="mt-2 text-sm text-red-600">{coverUploadError}</p> : null}
                  {form.coverImageUrl.trim() ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
                      <div className="aspect-[4/5] max-w-[220px] bg-stone-100">
                        <img src={form.coverImageUrl} alt="Pré-visualização da capa" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="Mensagem aos convidados">
            <textarea className={`${inputClass} min-h-[120px]`} value={form.message} onChange={(e) => set('message')(e.target.value)} />
          </Field>
          <Field label="Galeria Momentos (upload ou URL)">
            {supabase ? (
              <GalleryPhotosField
                supabase={supabase}
                storageFolder={inviteSlug}
                photos={form.galleryPhotos}
                onChange={(urls) => setForm((f) => ({ ...f, galleryPhotos: urls }))}
                inputClass={inputClass}
              />
            ) : (
              <p className="text-sm text-stone-500">Configura o Supabase para usar upload de fotos.</p>
            )}
          </Field>
          <Field label="Ativar uploads de convidados">
            <label className="inline-flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.guestUploadsEnabled}
                onChange={(e) => set('guestUploadsEnabled')(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-gold)] focus:ring-[color:var(--color-gold)]"
              />
              Permitir que convidados enviem fotos e vídeos para aprovação
            </label>
          </Field>
          <Field label="Uploads de convidados — título da secção">
            <input
              className={inputClass}
              value={form.guestUploadsTitle}
              onChange={(e) => set('guestUploadsTitle')(e.target.value)}
            />
          </Field>
          <Field label="Uploads de convidados — descrição">
            <textarea
              className={`${inputClass} min-h-[88px]`}
              value={form.guestUploadsDescription}
              onChange={(e) => set('guestUploadsDescription')(e.target.value)}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Traduções do convite</legend>
          <p className="text-sm leading-relaxed text-stone-500">
            O português continua como conteúdo principal. Preencha apenas os campos que precisam mudar no idioma escolhido;
            campos vazios usam automaticamente o texto em português.
          </p>
          <div className="flex flex-wrap gap-2">
            {inviteTranslationLocales.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveTranslationLocale(locale)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTranslationLocale === locale
                    ? 'border-[color:var(--color-gold)] bg-[color:var(--color-blush)] text-stone-900'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                {translationLocaleLabels[locale]}
              </button>
            ))}
          </div>
          <div className="space-y-4 border-t border-stone-100 pt-4">
            {inviteTranslatableFields.map((field) => {
              const value = form.translations?.[activeTranslationLocale]?.[field] ?? ''
              const baseValue = form[field]
              const placeholder = typeof baseValue === 'string' ? baseValue : ''
              const commonProps = {
                className: longTranslationFields.has(field) ? `${inputClass} min-h-[76px]` : inputClass,
                value,
                placeholder,
                onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setTranslation(activeTranslationLocale, field)(event.target.value),
              }

              return (
                <Field key={field} label={translationFieldLabels[field]}>
                  {longTranslationFields.has(field) ? <textarea {...commonProps} /> : <input {...commonProps} />}
                  {placeholder ? (
                    <p className="mt-1 text-xs text-stone-400">
                      Fallback pt-BR: {placeholder.length > 140 ? `${placeholder.slice(0, 137)}...` : placeholder}
                    </p>
                  ) : null}
                </Field>
              )
            })}
          </div>
        </fieldset>

        {supabase ? (
          <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
            <legend className="px-1 font-display text-lg text-stone-800">Dono do convite e uploads</legend>
            <OwnerAccessField supabase={supabase} inviteSlug={inviteSlug} inputClass={inputClass} />
          </fieldset>
        ) : null}

        {supabase ? (
          <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <legend className="px-1 font-display text-lg text-stone-800">Depoimentos da página inicial</legend>
              <button
                type="button"
                onClick={loadTestimonials}
                disabled={testimonialsLoading}
                className="self-start rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50 sm:self-auto"
              >
                {testimonialsLoading ? 'A carregar…' : 'Atualizar lista'}
              </button>
            </div>
            <p className="text-sm leading-relaxed text-stone-500">
              Os depoimentos enviados pela home chegam como pendentes. Aprove para publicar depois, rejeite se não for usar
              ou copie o texto para editar nos cards fixos.
            </p>
            {testimonialsError ? <p className="text-sm text-red-600">{testimonialsError}</p> : null}
            {testimonials.length ? (
              <div className="space-y-3">
                {testimonials.map((testimonial) => {
                  const statusLabel =
                    testimonial.status === 'approved'
                      ? 'Aprovado'
                      : testimonial.status === 'rejected'
                        ? 'Rejeitado'
                        : 'Pendente'
                  const statusClass =
                    testimonial.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : testimonial.status === 'rejected'
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : 'bg-amber-50 text-amber-700 ring-amber-200'

                  return (
                    <article key={testimonial.id} className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass}`}>
                              {statusLabel}
                            </span>
                            <span className="text-xs text-stone-500">
                              {new Date(testimonial.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-stone-800">
                            {testimonial.client_name.trim() || 'Sem nome'}
                          </p>
                          {testimonial.event_context.trim() ? (
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">
                              {testimonial.event_context}
                            </p>
                          ) : null}
                        </div>
                        {testimonial.source_path ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-500">
                            {testimonial.source_path}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-7 text-stone-700">
                        {testimonial.message}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={testimonialActionId === testimonial.id || testimonial.status === 'approved'}
                          onClick={() => void handleUpdateTestimonialStatus(testimonial.id, 'approved')}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          disabled={testimonialActionId === testimonial.id || testimonial.status === 'rejected'}
                          onClick={() => void handleUpdateTestimonialStatus(testimonial.id, 'rejected')}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Rejeitar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCopyTestimonial(testimonial)}
                          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
                        >
                          {copiedTestimonialId === testimonial.id ? 'Copiado' : 'Copiar texto'}
                        </button>
                        <button
                          type="button"
                          disabled={testimonialActionId === testimonial.id}
                          onClick={() => void handleDeleteTestimonial(testimonial)}
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          Deletar
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-500">
                {testimonialsLoading ? 'A carregar depoimentos…' : 'Ainda não há depoimentos recebidos.'}
              </p>
            )}
          </fieldset>
        ) : null}

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Links</legend>
          <Field label="Lista de presentes no convite">
            <label className="inline-flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.giftsSectionEnabled !== false}
                onChange={(e) => set('giftsSectionEnabled')(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-gold)] focus:ring-[color:var(--color-gold)]"
              />
              Mostrar botão, texto intro e QR da lista de presentes (abaixo de mapa e RSVP)
            </label>
          </Field>
          <Field label="WhatsApp — número (só dígitos, com DDI)">
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="5511999999999"
              value={form.rsvpWhatsappPhone}
              onChange={(e) => set('rsvpWhatsappPhone')(e.target.value.replace(/[^\d]/g, ''))}
            />
          </Field>
          <Field label="WhatsApp — mensagem ao abrir o chat">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={form.rsvpWhatsappMessage}
              onChange={(e) => set('rsvpWhatsappMessage')(e.target.value)}
            />
          </Field>
          <Field label="Lista de presentes — URL">
            <input className={inputClass} value={form.giftsLink} onChange={(e) => set('giftsLink')(e.target.value)} />
          </Field>
          <Field label="Lista de presentes — texto opcional (acima do botão)">
            <textarea
              className={`${inputClass} min-h-[88px]`}
              placeholder="Ex.: uma nota sobre a lista ou agradecimento antes do link."
              value={form.giftsIntro}
              onChange={(e) => set('giftsIntro')(e.target.value)}
            />
          </Field>
          <Field label="QR Code da lista de presentes (PNG)">
            {supabase ? (
              <GiftsQrCodeField
                supabase={supabase}
                storageFolder={inviteSlug}
                value={form.giftsQrCodeImageUrl}
                onChange={(url) => set('giftsQrCodeImageUrl')(url)}
                onPayload={(payload) => set('giftsQrPayload')(payload)}
              />
            ) : (
              <input
                className={inputClass}
                placeholder="https://.../qrcode.png"
                value={form.giftsQrCodeImageUrl}
                onChange={(e) => set('giftsQrCodeImageUrl')(e.target.value)}
              />
            )}
          </Field>
          <Field label="Frase abaixo do QR">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              placeholder="Escaneie ou {link} para copiar a chave Pix"
              value={form.giftsQrCaption}
              onChange={(e) => set('giftsQrCaption')(e.target.value)}
            />
            <p className="mt-1 text-xs text-stone-500">
              Deixe em branco para a frase seguir o QR. Escreva {'{link}'} onde deve aparecer “clique aqui”. Esse clique
              copia o Pix ou abre o endereço que está no código, e não a lista de presentes.
            </p>
          </Field>
          <Field label="QR Code — tamanho (px)">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="range"
                min={96}
                max={320}
                step={4}
                value={Math.min(320, Math.max(96, Number(form.giftsQrCodeSizePx) || 180))}
                onChange={(e) => set('giftsQrCodeSizePx')(Number(e.target.value))}
                className="h-2 w-full flex-1 cursor-pointer appearance-none rounded-lg bg-stone-200 accent-[color:var(--color-gold)]"
              />
              <input
                type="number"
                min={96}
                max={320}
                step={4}
                className={`${inputClass} w-28`}
                value={Math.min(320, Math.max(96, Number(form.giftsQrCodeSizePx) || 180))}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  set('giftsQrCodeSizePx')(Number.isFinite(n) ? Math.min(320, Math.max(96, n)) : 180)
                }}
              />
            </div>
          </Field>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Rodapé</legend>
          <Field label="Agradecimento">
            <input className={inputClass} value={form.footerThanks} onChange={(e) => set('footerThanks')(e.target.value)} />
          </Field>
          <Field label="Contacto / nota">
            <input className={inputClass} value={form.footerContact} onChange={(e) => set('footerContact')(e.target.value)} />
          </Field>
        </fieldset>
      </div>

      <div className="sticky bottom-0 mt-10 flex justify-end border-t border-stone-200 bg-[color:var(--color-cream)]/95 py-4 backdrop-blur-sm">
        <button
          type="button"
          disabled={saving || !supabase || !inviteId}
          onClick={() => void handleSave()}
          className="rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
        >
          {saving ? 'A guardar…' : 'Guardar alterações'}
        </button>
      </div>
    </div>
  )
}
