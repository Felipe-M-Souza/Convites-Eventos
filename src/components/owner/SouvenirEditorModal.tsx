import { useEffect, useMemo, useState } from 'react'
import type { GuestUploadWithUrl } from '../../lib/guestUploads'
import { formatGuestUploadDuration } from '../../lib/guestUploads'
import type { SouvenirTemplate } from '../../data/souvenirTemplates'
import { souvenirTemplates } from '../../data/souvenirTemplates'

type Props = {
  upload: GuestUploadWithUrl | null
  inviteSlug: string
  isOpen: boolean
  onClose: () => void
}

type MediaSource = HTMLImageElement | HTMLVideoElement
const VIDEO_EXPORT_FPS = 30
const VIDEO_EXPORT_BITRATE = 6_000_000

function fitCover(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
) {
  const coverScale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * scale
  const width = sourceWidth * coverScale
  const height = sourceHeight * coverScale
  const x = (targetWidth - width) / 2 + offsetX
  const y = (targetHeight - height) / 2 + offsetY
  return { x, y, width, height }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

async function loadImage(url: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem da lembrança.'))
    image.src = url
  })
}

async function loadVideoFrame(url: string) {
  return await new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.2, Number.isFinite(video.duration) ? video.duration / 10 : 0)
    }
    video.onseeked = () => resolve(video)
    video.onerror = () => reject(new Error('Não foi possível carregar o vídeo da lembrança.'))
    video.src = url
  })
}

async function loadVideo(url: string) {
  return await new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => resolve(video)
    video.onerror = () => reject(new Error('Não foi possível carregar o vídeo da lembrança.'))
    video.src = url
  })
}

function drawSouvenirFrame(
  ctx: CanvasRenderingContext2D,
  source: MediaSource,
  upload: GuestUploadWithUrl,
  template: SouvenirTemplate,
  options: EditorState,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, template.height)
  gradient.addColorStop(0, template.backgroundStart)
  gradient.addColorStop(1, template.backgroundEnd)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, template.width, template.height)

  ctx.fillStyle = template.surfaceColor
  roundedRect(ctx, 36, 36, template.width - 72, template.height - 72, 38)
  ctx.fill()

  const mediaRect = template.media
  ctx.save()
  roundedRect(ctx, mediaRect.x, mediaRect.y, mediaRect.width, mediaRect.height, mediaRect.radius)
  ctx.clip()
  const fitted = fitCover(
    source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth,
    source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight,
    mediaRect.width,
    mediaRect.height,
    options.mediaScale,
    options.mediaOffsetX,
    options.mediaOffsetY,
  )
  ctx.drawImage(source, mediaRect.x + fitted.x, mediaRect.y + fitted.y, fitted.width, fitted.height)
  ctx.restore()

  ctx.strokeStyle = template.accentColor
  ctx.lineWidth = 6
  roundedRect(ctx, mediaRect.x, mediaRect.y, mediaRect.width, mediaRect.height, mediaRect.radius)
  ctx.stroke()

  if (upload.file_type === 'video') {
    ctx.fillStyle = 'rgba(28, 24, 20, 0.55)'
    ctx.beginPath()
    ctx.arc(mediaRect.x + 76, mediaRect.y + mediaRect.height - 76, 42, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(mediaRect.x + 62, mediaRect.y + mediaRect.height - 98)
    ctx.lineTo(mediaRect.x + 62, mediaRect.y + mediaRect.height - 54)
    ctx.lineTo(mediaRect.x + 99, mediaRect.y + mediaRect.height - 76)
    ctx.closePath()
    ctx.fill()

    const duration = formatGuestUploadDuration(upload.duration_seconds)
    if (duration) {
      ctx.fillStyle = 'rgba(28, 24, 20, 0.65)'
      roundedRect(ctx, mediaRect.x + mediaRect.width - 170, mediaRect.y + 28, 132, 52, 18)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '600 26px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(duration, mediaRect.x + mediaRect.width - 104, mediaRect.y + 62)
    }
  }

  ctx.fillStyle = template.textColor
  ctx.textAlign = template.text.align
  const textX = template.text.align === 'center' ? template.width / 2 : mediaRect.x
  ctx.font = '700 54px Arial'
  ctx.fillText(options.title || 'Lembrança do evento', textX, template.text.titleY)

  ctx.font = '400 34px Arial'
  const subtitle = options.subtitle || upload.guest_name || 'Compartilhado com carinho'
  ctx.fillText(subtitle, textX, template.text.subtitleY)

  ctx.fillStyle = template.accentColor
  ctx.font = '500 28px Arial'
  ctx.fillText(options.footer || 'Obrigado por celebrar conosco', textX, template.text.footerY)
}

async function exportImageSouvenir(upload: GuestUploadWithUrl, template: SouvenirTemplate, options: EditorState) {
  if (!upload.signedUrl) throw new Error('Este arquivo ainda não está pronto para gerar lembrança.')
  const canvas = document.createElement('canvas')
  canvas.width = template.width
  canvas.height = template.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível para gerar a lembrança.')

  const source: MediaSource =
    upload.file_type === 'video' ? await loadVideoFrame(upload.signedUrl) : await loadImage(upload.signedUrl)

  drawSouvenirFrame(ctx, source, upload, template, options)
  return canvas.toDataURL('image/png')
}

function getSupportedVideoMimeType() {
  if (typeof MediaRecorder === 'undefined') return null

  const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null
}

async function seekVideo(video: HTMLVideoElement, time: number) {
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Não foi possível posicionar o vídeo para exportação.'))
    }
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }

    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)
    video.currentTime = time
  })
}

async function exportVideoSouvenir(upload: GuestUploadWithUrl, template: SouvenirTemplate, options: EditorState) {
  if (!upload.signedUrl) throw new Error('Este vídeo ainda não está pronto para gerar lembrança.')
  const mimeType = getSupportedVideoMimeType()
  if (!mimeType) {
    throw new Error('Este navegador não suporta exportação de vídeo da lembrança.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = template.width
  canvas.height = template.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível para gerar a lembrança.')
  if (typeof canvas.captureStream !== 'function') {
    throw new Error('Este navegador não suporta exportação de vídeo em canvas.')
  }

  const video = await loadVideo(upload.signedUrl)
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Math.max(upload.duration_seconds ?? 1, 1)

  await seekVideo(video, 0)
  drawSouvenirFrame(ctx, video, upload, template, options)

  const stream = canvas.captureStream(VIDEO_EXPORT_FPS)
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: VIDEO_EXPORT_BITRATE,
  })
  const chunks: BlobPart[] = []

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Não foi possível gravar a lembrança em vídeo.'))
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
  })

  recorder.start(250)

  let rafId = 0
  const renderFrame = () => {
    drawSouvenirFrame(ctx, video, upload, template, options)
    if (!video.paused && !video.ended) {
      rafId = window.requestAnimationFrame(renderFrame)
    }
  }

  try {
    const playPromise = video.play()
    if (playPromise) await playPromise
    renderFrame()

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        cleanup()
        reject(new Error('A exportação do vídeo demorou mais do que o esperado.'))
      }, Math.ceil(duration * 1000) + 5000)

      const onEnded = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('Não foi possível reproduzir o vídeo para exportação.'))
      }
      const cleanup = () => {
        window.clearTimeout(timeoutId)
        video.removeEventListener('ended', onEnded)
        video.removeEventListener('error', onError)
      }

      video.addEventListener('ended', onEnded)
      video.addEventListener('error', onError)
    })
  } finally {
    window.cancelAnimationFrame(rafId)
    video.pause()
    recorder.stop()
  }

  return await finished
}

type EditorState = {
  title: string
  subtitle: string
  footer: string
  mediaScale: number
  mediaOffsetX: number
  mediaOffsetY: number
}

const defaultEditorState: EditorState = {
  title: 'Lembrança do evento',
  subtitle: '',
  footer: 'Obrigado por celebrar conosco',
  mediaScale: 1,
  mediaOffsetX: 0,
  mediaOffsetY: 0,
}

export function SouvenirEditorModal({ upload, inviteSlug, isOpen, onClose }: Props) {
  const [templateId, setTemplateId] = useState(souvenirTemplates[0]?.id ?? '')
  const [state, setState] = useState<EditorState>(defaultEditorState)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!upload || !isOpen) return
    setState({
      title: `Lembrança de ${inviteSlug}`,
      subtitle: upload.guest_name || 'Compartilhado com carinho',
      footer: upload.caption || 'Obrigado por celebrar conosco',
      mediaScale: 1,
      mediaOffsetX: 0,
      mediaOffsetY: 0,
    })
    setError(null)
  }, [inviteSlug, isOpen, upload])

  const template = useMemo(
    () => souvenirTemplates.find((item) => item.id === templateId) ?? souvenirTemplates[0],
    [templateId],
  )
  const isVideoSouvenir = upload?.file_type === 'video'
  const downloadLabel = isVideoSouvenir ? 'Baixar lembrança (.webm)' : 'Baixar lembrança (.png)'

  if (!isOpen || !upload || !template) return null

  const previewUrl = upload.signedUrl

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const link = document.createElement('a')
      if (upload.file_type === 'video') {
        const blob = await exportVideoSouvenir(upload, template, state)
        const objectUrl = URL.createObjectURL(blob)
        link.href = objectUrl
        link.download = `${inviteSlug}-lembranca-${upload.id.slice(0, 8)}.webm`
        link.click()
        URL.revokeObjectURL(objectUrl)
      } else {
        const dataUrl = await exportImageSouvenir(upload, template, state)
        link.href = dataUrl
        link.download = `${inviteSlug}-lembranca-${upload.id.slice(0, 8)}.png`
        link.click()
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível exportar a lembrança.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 px-4 py-8">
      <div className="grid max-h-full w-full max-w-6xl gap-6 overflow-auto rounded-3xl bg-[color:var(--color-cream)] p-6 shadow-2xl lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5">
          <div>
            <h2 className="font-display text-2xl text-stone-800">Lembrança</h2>
            <p className="mt-2 text-sm text-stone-500">
              Escolha um template, ajuste o texto e exporte uma arte pronta para compartilhar.
            </p>
            {upload.file_type === 'video' ? (
              <p className="mt-2 text-xs text-stone-500">Quando o upload for vídeo, a lembrança é exportada em `.webm` com a composição aplicada.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            {souvenirTemplates.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTemplateId(item.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  item.id === template.id
                    ? 'border-[color:var(--color-gold)] bg-[color:var(--color-blush)]/35'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <p className="font-semibold text-stone-800">{item.name}</p>
                <p className="mt-1 text-xs text-stone-500">{item.description}</p>
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Título</span>
            <input
              value={state.title}
              onChange={(event) => setState((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Subtítulo</span>
            <input
              value={state.subtitle}
              onChange={(event) => setState((current) => ({ ...current, subtitle: event.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Rodapé</span>
            <textarea
              value={state.footer}
              onChange={(event) => setState((current) => ({ ...current, footer: event.target.value }))}
              className="min-h-[84px] w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Escala da mídia</span>
            <input
              type="range"
              min="1"
              max="1.8"
              step="0.01"
              value={state.mediaScale}
              onChange={(event) => setState((current) => ({ ...current, mediaScale: Number(event.target.value) }))}
              className="w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Posição horizontal</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={state.mediaOffsetX}
              onChange={(event) => setState((current) => ({ ...current, mediaOffsetX: Number(event.target.value) }))}
              className="w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Posição vertical</span>
            <input
              type="range"
              min="-220"
              max="220"
              step="1"
              value={state.mediaOffsetY}
              onChange={(event) => setState((current) => ({ ...current, mediaOffsetY: Number(event.target.value) }))}
              className="w-full"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting || !previewUrl}
              className="rounded-full bg-[color:var(--color-gold)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {exporting ? 'Gerando…' : downloadLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            >
              Fechar
            </button>
          </div>
        </aside>

        <section className="flex items-center justify-center rounded-3xl border border-stone-200 bg-white p-4">
          <div
            className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] shadow-lg"
            style={{
              aspectRatio: `${template.width} / ${template.height}`,
              background: `linear-gradient(180deg, ${template.backgroundStart} 0%, ${template.backgroundEnd} 100%)`,
            }}
          >
            <div
              className="absolute inset-[18px] rounded-[24px]"
              style={{ backgroundColor: template.surfaceColor }}
            />

            <div
              className="absolute overflow-hidden"
              style={{
                left: `${(template.media.x / template.width) * 100}%`,
                top: `${(template.media.y / template.height) * 100}%`,
                width: `${(template.media.width / template.width) * 100}%`,
                height: `${(template.media.height / template.height) * 100}%`,
                borderRadius: `${Math.max(12, (template.media.radius / template.width) * 100)}%`,
                boxShadow: `0 0 0 3px ${template.accentColor}`,
              }}
            >
              {upload.file_type === 'video' ? (
                previewUrl ? (
                  <video
                    src={previewUrl}
                    className="h-full w-full object-cover"
                    style={{
                      transform: `scale(${state.mediaScale}) translate(${state.mediaOffsetX / 10}px, ${state.mediaOffsetY / 10}px)`,
                    }}
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-stone-200 text-xs text-stone-500">Vídeo indisponível</div>
                )
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    transform: `scale(${state.mediaScale}) translate(${state.mediaOffsetX / 10}px, ${state.mediaOffsetY / 10}px)`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-stone-200 text-xs text-stone-500">Imagem indisponível</div>
              )}
            </div>

            {upload.file_type === 'video' ? (
              <div className="absolute left-[12%] top-[58%] flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-medium text-white">
                <span className="inline-block h-0 w-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-white" />
                {formatGuestUploadDuration(upload.duration_seconds) || 'Vídeo'}
              </div>
            ) : null}

            <div
              className="absolute inset-x-0 px-10"
              style={{
                top: `${(template.text.titleY / template.height) * 100}%`,
                color: template.textColor,
                textAlign: template.text.align,
              }}
            >
              <p className="text-2xl font-semibold">{state.title || 'Lembrança do evento'}</p>
            </div>
            <div
              className="absolute inset-x-0 px-10"
              style={{
                top: `${(template.text.subtitleY / template.height) * 100}%`,
                color: template.textColor,
                textAlign: template.text.align,
              }}
            >
              <p className="text-base">{state.subtitle || upload.guest_name || 'Compartilhado com carinho'}</p>
            </div>
            <div
              className="absolute inset-x-0 px-10"
              style={{
                top: `${(template.text.footerY / template.height) * 100}%`,
                color: template.accentColor,
                textAlign: template.text.align,
              }}
            >
              <p className="text-sm font-medium">{state.footer || 'Obrigado por celebrar conosco'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
