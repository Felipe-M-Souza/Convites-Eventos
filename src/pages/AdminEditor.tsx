import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { eventData, type EventData } from '../data/eventData'
import { useEventData } from '../contexts/EventDataContext'
import { isCmsConfigured, supabase } from '../lib/supabase'
import { GalleryPhotosField } from '../components/admin/GalleryPhotosField'
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

  const inputClass =
    'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-[color:var(--color-gold)] focus:ring-1 focus:ring-[color:var(--color-gold)]'

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
          <Field label="Texto acima do envelope">
            <input className={inputClass} value={form.openingEyebrow} onChange={(e) => set('openingEyebrow')(e.target.value)} />
          </Field>
          <Field label="Texto de ajuda (selo)">
            <input className={inputClass} value={form.openingSealHint} onChange={(e) => set('openingSealHint')(e.target.value)} />
          </Field>
          <Field label="Lacre manual (vazio = iniciais dos nomes)">
            <input className={inputClass} value={form.openingSealMark} onChange={(e) => set('openingSealMark')(e.target.value)} />
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
        </fieldset>

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
