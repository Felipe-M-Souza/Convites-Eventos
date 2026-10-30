import { useEffect, useMemo, useState } from 'react'

export type AssetHealthItem = {
  label: string
  url: string
}

type MissingAsset = {
  label: string
  url: string
}

const PROBE_TIMEOUT_MS = 8000

function resolveUrl(url: string) {
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

function isAudioUrl(url: string) {
  return /\.(mp3|wav|ogg|webm)(?:$|\?)/i.test(url)
}

function probeImage(url: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image()
    const timer = window.setTimeout(() => {
      image.onload = null
      image.onerror = null
      resolve(false)
    }, PROBE_TIMEOUT_MS)
    image.onload = () => {
      window.clearTimeout(timer)
      resolve(image.naturalWidth > 0)
    }
    image.onerror = () => {
      window.clearTimeout(timer)
      resolve(false)
    }
    image.src = url
  })
}

function probeAudio(url: string) {
  return new Promise<boolean>((resolve) => {
    const audio = document.createElement('audio')
    const timer = window.setTimeout(finish, PROBE_TIMEOUT_MS)
    function finish(ok = false) {
      window.clearTimeout(timer)
      audio.onloadedmetadata = null
      audio.oncanplay = null
      audio.onerror = null
      audio.removeAttribute('src')
      audio.load()
      resolve(ok)
    }
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => finish(true)
    audio.oncanplay = () => finish(true)
    audio.onerror = () => finish(false)
    audio.src = url
  })
}

export function AssetHealthNotice({ assets }: { assets: AssetHealthItem[] }) {
  const [missing, setMissing] = useState<MissingAsset[] | null>(null)
  const signature = useMemo(
    () =>
      assets
        .map((asset) => `${asset.label}|${asset.url.trim()}`)
        .filter((entry) => !entry.endsWith('|'))
        .join('\n'),
    [assets],
  )

  useEffect(() => {
    const pending = signature
      .split('\n')
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf('|')
        return {
          label: entry.slice(0, separator),
          url: entry.slice(separator + 1),
        }
      })

    if (pending.length === 0) {
      setMissing([])
      return undefined
    }

    let cancelled = false
    setMissing(null)

    void Promise.all(
      pending.map(async (asset) => {
        const url = resolveUrl(asset.url)
        const ok = isAudioUrl(url) ? await probeAudio(url) : await probeImage(url)
        return ok ? null : { label: asset.label, url: asset.url }
      }),
    ).then((results) => {
      if (cancelled) return
      setMissing(results.filter((item): item is MissingAsset => item !== null))
    })

    return () => {
      cancelled = true
    }
  }, [signature])

  if (!missing || missing.length === 0) return null

  return (
    <section className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
      <h2 className="font-display text-lg text-stone-800">Arquivos que não abrem</h2>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        Os links estão salvos, mas estes arquivos não carregaram. Anexe de novo para o envelope, a moldura, as fotos
        ou a música voltarem a aparecer no convite.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-stone-800">
        {missing.map((asset) => (
          <li key={`${asset.label}-${asset.url}`} className="break-all">
            <span className="font-medium">{asset.label}.</span>{' '}
            <span className="text-stone-600">{asset.url}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
