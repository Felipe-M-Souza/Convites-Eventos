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
  /** Se falso, o áudio existe mas o botão flutuante fica oculto (ex.: tela do envelope) */
  showButton?: boolean
}

export const MusicToggle = forwardRef<MusicToggleHandle, Props>(function MusicToggle(
  { src, showButton = true },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const syncPlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.loop = true
    if (playing) {
      void el.play().catch(() => setPlaying(false))
    } else {
      el.pause()
    }
  }, [playing])

  useEffect(() => {
    syncPlay()
  }, [syncPlay])

  useImperativeHandle(ref, () => ({
    playFromUserGesture: () => {
      const el = audioRef.current
      if (!el) return
      el.loop = true
      el.volume = 0.35
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    },
  }))

  return (
    <>
      <audio ref={audioRef} src={src} preload="auto" playsInline />
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
