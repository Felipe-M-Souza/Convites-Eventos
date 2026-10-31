import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { EventData, StoryFrame } from '../../data/eventData'

type Props = {
  data: EventData
  onOpenGesture?: () => void
}

function prefersReduce(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StoryInvite({ data, onOpenGesture }: Props) {
  const frames = data.storyFrames
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const [run, setRun] = useState(0)
  const remaining = useRef(frames[0]?.holdMs ?? 6000)
  const pointer = useRef({ t: 0, x: 0 })
  const sceneIndex = Math.min(index, Math.max(frames.length - 1, 0))
  const frame = frames[sceneIndex]

  useEffect(() => {
    for (const scene of frames) {
      const image = new Image()
      image.src = scene.imageUrl
    }
  }, [frames])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (!onOpenGesture) return undefined
    const prime = () => onOpenGesture()
    window.addEventListener('pointerdown', prime, { once: true })
    return () => window.removeEventListener('pointerdown', prime)
  }, [onOpenGesture])

  useEffect(() => {
    remaining.current = frames[sceneIndex]?.holdMs ?? 6000
  }, [frames, sceneIndex, run])

  useEffect(() => {
    if (!frame || paused || finished) return undefined
    const started = performance.now()
    const wait = remaining.current
    const id = window.setTimeout(() => {
      if (sceneIndex >= frames.length - 1) setFinished(true)
      else setIndex(sceneIndex + 1)
    }, wait)
    return () => {
      window.clearTimeout(id)
      remaining.current = Math.max(250, wait - (performance.now() - started))
    }
  }, [finished, frame, frames.length, paused, sceneIndex])

  const step = (delta: number) => {
    if (!frames.length) return
    if (delta > 0 && sceneIndex >= frames.length - 1) {
      setFinished(true)
      return
    }
    setFinished(false)
    setIndex(Math.min(frames.length - 1, Math.max(0, sceneIndex + delta)))
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sceneIndex, frames.length])

  const replay = () => {
    setFinished(false)
    setPaused(false)
    setIndex(0)
    setRun((value) => value + 1)
  }

  if (!frame) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f6e4dc] px-6 text-center">
        <p className="font-display text-2xl text-[#6b4a55]">Este vídeo ainda não tem cenas.</p>
      </div>
    )
  }

  const spoken = [frame.speaker, frame.caption].filter(Boolean).join('. ')

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f3d5cc]">
      <section
        className="relative h-dvh w-full max-w-[460px] overflow-hidden bg-[#f7e7e2] shadow-[0_24px_80px_rgba(80,40,48,0.18)]"
        aria-label="Convite em vídeo"
        onPointerDown={(event) => {
          pointer.current = { t: performance.now(), x: event.clientX }
          setPaused(true)
        }}
        onPointerUp={(event) => {
          const quick = performance.now() - pointer.current.t < 280
          const still = Math.abs(event.clientX - pointer.current.x) < 14
          setPaused(false)
          if (!quick || !still) return
          const bounds = event.currentTarget.getBoundingClientRect()
          step(event.clientX - bounds.left < bounds.width * 0.32 ? -1 : 1)
        }}
        onPointerCancel={() => setPaused(false)}
      >
        <AnimatePresence mode="sync">
          <SceneArt key={`${frame.imageUrl}-${sceneIndex}-${run}`} frame={frame} />
        </AnimatePresence>

        <p className="sr-only" aria-live="polite">
          {spoken}
        </p>

        <div className="absolute inset-x-0 top-0 z-30 flex gap-1 px-3 pr-36 pt-[max(0.85rem,env(safe-area-inset-top))]">
          {frames.map((scene, sceneNumber) => {
            const current = sceneNumber === sceneIndex && !finished
            const filled = sceneNumber < sceneIndex || finished
            return (
              <button
                key={`${scene.imageUrl}-${sceneNumber}`}
                type="button"
                aria-label={`Cena ${sceneNumber + 1} de ${frames.length}`}
                className="h-1 flex-1 overflow-hidden rounded-full bg-[#c45b78]/25"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  setFinished(false)
                  setIndex(sceneNumber)
                }}
              >
                <span
                  key={current ? `${run}-${sceneIndex}` : `${sceneNumber}`}
                  className={`block h-full bg-[#c45b78] ${current ? 'story-fill' : ''}`}
                  style={{
                    transform: filled ? 'scaleX(1)' : current ? undefined : 'scaleX(0)',
                    animationDuration: current ? `${scene.holdMs}ms` : undefined,
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                />
              </button>
            )
          })}
        </div>

        {frame.captionOverImage && frame.caption ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-6 pb-10 pt-28 text-center text-white">
            {frame.speaker ? (
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#c45b78]">
                {frame.speaker}
              </span>
            ) : null}
            <p className="mt-3 font-display text-xl leading-snug">{frame.caption}</p>
          </div>
        ) : null}

        {finished ? (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              replay()
            }}
            className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-[#7a4454] shadow-lg"
          >
            Ver de novo
          </button>
        ) : null}
      </section>
    </div>
  )
}

function SceneArt({ frame }: { frame: StoryFrame }) {
  const reduce = prefersReduce()
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.28 }}
    >
      <img src={frame.imageUrl} alt="" className="absolute inset-0 h-full w-full object-contain" />
    </motion.div>
  )
}
