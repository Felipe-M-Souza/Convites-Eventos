import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { eventData, type EventData } from '../data/eventData'
import { useEventData } from '../contexts/useEventData'
import { isCmsConfigured, supabase } from '../lib/supabase'
import { GalleryPhotosField } from '../components/admin/GalleryPhotosField'
import { GiftsQrCodeField } from '../components/admin/GiftsQrCodeField'
import { OwnerAccessField } from '../components/admin/OwnerAccessField'
import { removeGalleryFolderContents } from '../lib/galleryStorage'
import { removeGuestUploadFolderContents } from '../lib/guestUploads'
import { buildSiteUrl } from '../lib/siteUrl'
import { normalizeInviteSlug } from '../lib/inviteSlug'

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

type InviteRow = { id: string; slug: string }

export function AdminEditor({ onSignOut }: Props) {
  const navigate = useNavigate()
  const { data, refresh, inviteId, inviteSlug, inviteNotFound, status } = useEventData()
  const [form, setForm] = useState<EventData>(() => structuredClone(data))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [inviteRows, setInviteRows] = useState<InviteRow[]>([])
  const [newSlugDraft, setNewSlugDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copiedShareLink, setCopiedShareLink] = useState(false)

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

  useEffect(() => {
    setForm(structuredClone(data))
  }, [data])

  useEffect(() => {
    loadInviteList()
  }, [inviteSlug, status])

  const set =
    <K extends keyof EventData>(key: K) =>
    (value: EventData[K]) => {
      setForm((f) => ({ ...f, [key]: value }))
    }

  const handleSave = async () => {
    if (!supabase || !inviteId) return
    setSaving(true)
    setMessage(null)
    const { error } = await supabase.from('invite_config').upsert(
      { id: inviteId, slug: inviteSlug, payload: form },
      { onConflict: 'id' },
    )
    setSaving(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    setMessage({ type: 'ok', text: 'Alterações guardadas.' })
    await refresh()
    loadInviteList()
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
    const payload = structuredClone(eventData)
    const { error } = await supabase.from('invite_config').insert({ id, slug, payload })
    setCreating(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
      return
    }
    setNewSlugDraft('')
    navigate(`/admin?slug=${encodeURIComponent(slug)}`)
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
                  inviteRows.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.slug}
                    </option>
                  ))
                )}
              </select>
            </label>
            <div className="flex flex-1 flex-wrap items-end gap-2">
              <label className="min-w-[160px] flex-1">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                  Novo slug
                </span>
                <input
                  className={inputClass}
                  placeholder="ex.: maria-joao"
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

      <div className="space-y-10">
        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Abertura (envelope)</legend>
          <Field label="Texto de ajuda (selo)">
            <input className={inputClass} value={form.openingSealHint} onChange={(e) => set('openingSealHint')(e.target.value)} />
          </Field>
          <Field label="Lacre manual (vazio = iniciais dos nomes)">
            <input className={inputClass} value={form.openingSealMark} onChange={(e) => set('openingSealMark')(e.target.value)} />
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
            <input className={inputClass} value={form.openingEnvelopeImageUrl} onChange={(e) => set('openingEnvelopeImageUrl')(e.target.value)} />
          </Field>
          <Field label="URL imagem envelope aberto">
            <input className={inputClass} value={form.openingEnvelopeOpenImageUrl} onChange={(e) => set('openingEnvelopeOpenImageUrl')(e.target.value)} />
          </Field>
          <Field label="URL áudio de fundo (ficheiro em /public)">
            <input className={inputClass} value={form.backgroundAudioUrl} onChange={(e) => set('backgroundAudioUrl')(e.target.value)} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Casal e cerimónia</legend>
          <Field label="Nomes do casal">
            <input className={inputClass} value={form.coupleNames} onChange={(e) => set('coupleNames')(e.target.value)} />
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
            <input className={inputClass} value={form.coverImageUrl} onChange={(e) => set('coverImageUrl')(e.target.value)} />
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

        {supabase ? (
          <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
            <legend className="px-1 font-display text-lg text-stone-800">Dono do convite e uploads</legend>
            <OwnerAccessField supabase={supabase} inviteSlug={inviteSlug} inputClass={inputClass} />
          </fieldset>
        ) : null}

        <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm">
          <legend className="px-1 font-display text-lg text-stone-800">Links</legend>
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
