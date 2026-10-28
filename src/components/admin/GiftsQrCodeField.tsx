import { useId, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { galleryObjectPath, getGalleryPublicUrl, removeGalleryObject } from '../../lib/galleryStorage'
import { readQrFromFile } from '../../lib/qrPayload'

type Props = {
  supabase: SupabaseClient
  storageFolder: string
  value: string
  onChange: (url: string) => void
  onPayload?: (payload: string) => void
}

export function GiftsQrCodeField({ supabase, storageFolder, value, onChange, onPayload }: Props) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File | null) => {
    if (!file) return
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      setError('Use um ficheiro PNG para o QR Code.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (value) {
        await removeGalleryObject(supabase, value).catch(() => undefined)
      }
      const ext = file.name.toLowerCase().endsWith('.png') ? 'png' : 'png'
      const objectPath = galleryObjectPath(storageFolder, `${crypto.randomUUID()}-qrcode.${ext}`)
      const { error: uploadError } = await supabase.storage.from('invite-gallery').upload(objectPath, file, {
        contentType: 'image/png',
        upsert: false,
      })
      if (uploadError) throw new Error(uploadError.message)
      onChange(getGalleryPublicUrl(supabase, objectPath))
      const payload = await readQrFromFile(file).catch(() => null)
      onPayload?.(payload ?? '')
      if (!payload) setError('A imagem foi enviada, mas o QR não pôde ser lido. Confira se o código está nítido.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload do QR Code.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!value) return
    setBusy(true)
    setError(null)
    try {
      await removeGalleryObject(supabase, value)
      onChange('')
      onPayload?.('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao remover o QR Code.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50/70 p-3">
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="image/png"
        className="hidden"
        disabled={busy}
        onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
        >
          {busy ? 'A trabalhar…' : value ? 'Trocar QR Code (PNG)' : 'Enviar QR Code (PNG)'}
        </button>
        {value ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRemove()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            Remover
          </button>
        ) : null}
      </div>

      {value ? (
        <div className="w-fit rounded-lg border border-stone-200 bg-white p-2">
          <img src={value} alt="Pré-visualização do QR Code" className="h-28 w-28 object-contain" />
        </div>
      ) : (
        <p className="text-sm text-stone-500">Nenhum QR Code enviado.</p>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-stone-500">
        O ficheiro é enviado para o bucket <code className="rounded bg-stone-100 px-1">invite-gallery</code> na pasta do
        convite.
      </p>
    </div>
  )
}
