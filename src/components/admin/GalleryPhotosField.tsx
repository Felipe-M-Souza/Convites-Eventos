import { useCallback, useId, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pathFromInviteGalleryPublicUrl, removeGalleryObject, uploadGalleryJpeg } from '../../lib/galleryStorage'
import { resizeImageToJpeg } from '../../lib/imageResize'

const MAX_EDGE_OPTIONS = [960, 1280, 1600, 1920] as const
const DEFAULT_MAX_EDGE = 1280
const JPEG_QUALITY = 0.88

type Props = {
  supabase: SupabaseClient
  /** Pasta no bucket (normalmente o slug do convite). */
  storageFolder: string
  photos: string[]
  onChange: (urls: string[]) => void
  inputClass: string
}

export function GalleryPhotosField({ supabase, storageFolder, photos, onChange, inputClass }: Props) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [maxEdge, setMaxEdge] = useState<number>(DEFAULT_MAX_EDGE)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState('')

  const move = (from: number, dir: -1 | 1) => {
    const to = from + dir
    if (to < 0 || to >= photos.length) return
    const next = [...photos]
    const [row] = next.splice(from, 1)
    next.splice(to, 0, row!)
    onChange(next)
  }

  const removeAt = async (index: number) => {
    const url = photos[index]
    if (!url) return
    setError(null)
    const path = pathFromInviteGalleryPublicUrl(url)
    if (path) {
      setBusy(true)
      try {
        await removeGalleryObject(supabase, url)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao apagar o ficheiro no servidor.')
        setBusy(false)
        return
      }
      setBusy(false)
    }
    onChange(photos.filter((_, i) => i !== index))
  }

  const addExternalUrl = () => {
    const u = urlDraft.trim()
    if (!u) return
    try {
      void new URL(u)
    } catch {
      setError('URL inválida.')
      return
    }
    setError(null)
    onChange([...photos, u])
    setUrlDraft('')
  }

  const onFiles = useCallback(
    async (list: FileList | null) => {
      if (!list?.length) return
      setError(null)
      setBusy(true)
      const files = Array.from(list)
      let acc = [...photos]
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]!
          setProgress(`A processar ${i + 1} / ${files.length}…`)
          const jpeg = await resizeImageToJpeg(file, maxEdge, JPEG_QUALITY)
          setProgress(`A enviar ${i + 1} / ${files.length}…`)
          const publicUrl = await uploadGalleryJpeg(supabase, jpeg, storageFolder)
          acc = [...acc, publicUrl]
          onChange(acc)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha no upload.')
      } finally {
        setProgress(null)
        setBusy(false)
        if (fileRef.current) fileRef.current.value = ''
      }
    },
    [maxEdge, onChange, photos, storageFolder, supabase],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block min-w-[140px] flex-1">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Lado máximo (redimensionar)
          </span>
          <select
            className={inputClass}
            disabled={busy}
            value={maxEdge}
            onChange={(e) => setMaxEdge(Number(e.target.value))}
          >
            {MAX_EDGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}px
              </option>
            ))}
          </select>
        </label>
        <div>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => void onFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
          >
            {busy ? 'A trabalhar…' : 'Escolher fotos'}
          </button>
        </div>
      </div>

      {progress ? <p className="text-sm text-stone-600">{progress}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-xs text-stone-500">
        As imagens são otimizadas no teu dispositivo (JPEG) e enviadas para o armazenamento do Supabase. Garante que
        correste o SQL em <code className="rounded bg-stone-100 px-1">002_invite_gallery_storage.sql</code>.
      </p>

      {photos.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {photos.map((src, i) => (
            <li
              key={`${i}-${src}`}
              className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50/80 p-2 shadow-sm"
            >
              <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-200">
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <p className="truncate font-mono text-[10px] text-stone-500" title={src}>
                  {src}
                </p>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                    className="rounded border border-stone-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={busy || i === photos.length - 1}
                    onClick={() => move(i, 1)}
                    className="rounded border border-stone-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeAt(i)}
                    className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">Ainda não há fotos. Adiciona ficheiros ou um URL abaixo.</p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
        <input
          type="url"
          className={`${inputClass} min-w-[200px] flex-1`}
          placeholder="https://… (imagem externa opcional)"
          value={urlDraft}
          disabled={busy}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addExternalUrl()
            }
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={addExternalUrl}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
        >
          Adicionar URL
        </button>
      </div>
    </div>
  )
}
