import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

export type MusicToggleHandle = {
  playFromUserGesture: () => void
}

type Props = {
  src: string
  /**
   * Segunda faixa deste convite. A primeira toca uma vez; ao terminar, esta
   * começa na hora e fica em repetição.
   */
  nextSrc?: string
  /** Se falso, o áudio existe mas o botão flutuante fica oculto (ex.: tela do envelope) */
  showButton?: boolean
}

export const MusicToggle = forwardRef<MusicToggleHandle, Props>(function MusicToggle(
  { src, nextSrc, showButton = true },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const nextSrcRef = useRef(nextSrc)
  const onSecondTrackRef = useRef(false)
  const [playing, setPlaying] = useState(false)

  nextSrcRef.current = nextSrc

  const syncPlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.loop = onSecondTrackRef.current || !nextSrcRef.current
    el.volume = 0.35
    if (playing) {
      void el.play().catch(() => setPlaying(false))
    } else {
      el.pause()
    }
  }, [playing])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    onSecondTrackRef.current = false
    el.loop = !nextSrc
    el.src = src
    el.dataset.musicTrack = '1'
  }, [src, nextSrc])

  useEffect(() => {
    syncPlay()
  }, [syncPlay])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onEnded = () => {
      const next = nextSrcRef.current
      if (!next || onSecondTrackRef.current) return
      onSecondTrackRef.current = true
      el.loop = true
      el.volume = 0.35
      el.src = next
      el.dataset.musicTrack = '2'
      void el
        .play()
        .then(() => setPlaying(true))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setPlaying(false)
        })
    }
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
  }, [])

  useImperativeHandle(ref, () => ({
    playFromUserGesture: () => {
      const el = audioRef.current
      if (!el) return
      el.loop = onSecondTrackRef.current || !nextSrcRef.current
      el.volume = 0.35
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    },
  }))

  return (
    <>
      <audio ref={audioRef} data-invite-audio="active" preload="auto" playsInline />
      {nextSrc ? <audio src={nextSrc} preload="auto" playsInline className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden /> : null}
      {showButton ? (
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-stone-300/80 bg-white/90 text-lg shadow-md backdrop-blur-sm transition hover:bg-[color:var(--color-blush)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-gold)]"
          aria-pressed={playing}
          aria-label={playing ? 'Desativar música' : 'Ativar música'}
          title={playing ? 'Pausar música' : 'Tocar música'}
        >
          {playing ? '♪' : '♫'}
        </button>
      ) : null}
    </>
  )
})
