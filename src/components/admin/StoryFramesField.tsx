import type { StoryFrame } from '../../data/eventData'

type Props = {
  frames: StoryFrame[]
  onChange: (frames: StoryFrame[]) => void
}

const emptyFrame = (): StoryFrame => ({
  imageUrl: '',
  speaker: '',
  caption: '',
  captionOverImage: true,
  holdMs: 6000,
})

export function StoryFramesField({ frames, onChange }: Props) {
  const update = (index: number, patch: Partial<StoryFrame>) => {
    onChange(frames.map((frame, frameIndex) => (frameIndex === index ? { ...frame, ...patch } : frame)))
  }

  const move = (index: number, delta: number) => {
    const next = index + delta
    if (next < 0 || next >= frames.length) return
    const copy = [...frames]
    const [row] = copy.splice(index, 1)
    copy.splice(next, 0, row!)
    onChange(copy)
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#f0c9cf] bg-[#fff7f6] p-4">
      <div>
        <h3 className="font-display text-lg text-stone-800">Cenas do vídeo</h3>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          A frase de cada cena fica guardada aqui. Nas artes que já trazem o texto, ele continua na imagem. Para trocar
          uma frase, escreva o texto novo e marque “mostrar este texto por cima da imagem”.
        </p>
      </div>
      {frames.map((frame, index) => (
        <article key={`${index}-${frame.imageUrl}`} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Cena {index + 1}</p>
            <div className="flex gap-2">
              <button type="button" className="text-xs text-stone-600 underline" onClick={() => move(index, -1)}>
                Subir
              </button>
              <button type="button" className="text-xs text-stone-600 underline" onClick={() => move(index, 1)}>
                Descer
              </button>
              <button
                type="button"
                className="text-xs text-red-700 underline"
                onClick={() => onChange(frames.filter((_, frameIndex) => frameIndex !== index))}
              >
                Tirar
              </button>
            </div>
          </div>
          {frame.imageUrl ? (
            <img src={frame.imageUrl} alt="" className="h-36 w-full rounded-lg object-cover" />
          ) : null}
          <label className="block text-sm text-stone-700">
            Imagem
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={frame.imageUrl}
              onChange={(event) => update(index, { imageUrl: event.target.value })}
            />
          </label>
          <label className="block text-sm text-stone-700">
            Quem fala
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={frame.speaker}
              onChange={(event) => update(index, { speaker: event.target.value })}
              placeholder="Helena ou Jesus"
            />
          </label>
          <label className="block text-sm text-stone-700">
            Texto
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={frame.caption}
              onChange={(event) => update(index, { caption: event.target.value })}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={frame.captionOverImage}
                onChange={(event) => update(index, { captionOverImage: event.target.checked })}
              />
              Mostrar este texto por cima da imagem
            </label>
            <label className="text-sm text-stone-700">
              Segundos
              <input
                type="number"
                min={2}
                max={20}
                step={0.5}
                className="ml-2 w-20 rounded-lg border border-stone-300 px-2 py-1"
                value={Math.round(frame.holdMs / 100) / 10}
                onChange={(event) => {
                  const seconds = Number(event.target.value)
                  if (!Number.isFinite(seconds)) return
                  update(index, { holdMs: Math.round(seconds * 1000) })
                }}
              />
            </label>
          </div>
        </article>
      ))}
      <button
        type="button"
        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800"
        onClick={() => onChange([...frames, emptyFrame()])}
      >
        Acrescentar cena
      </button>
    </div>
  )
}
