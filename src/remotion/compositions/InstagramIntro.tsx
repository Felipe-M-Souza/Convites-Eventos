import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { CSSProperties } from 'react'
import type { IntroSlide } from '../data'

type Props = {
  slides: IntroSlide[]
}

const bgStyle: CSSProperties = {
  background:
    'linear-gradient(180deg, #fbf7f1 0%, #f7efe4 100%)',
  color: '#8c6a2d',
  fontFamily: '"Cormorant Garamond", Georgia, serif',
}

function Ornament({ top }: { top?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        [top ? 'top' : 'bottom']: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 220,
        height: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(183,147,75,0.95) 18%, rgba(183,147,75,0.95) 82%, transparent 100%)',
      }}
    />
  )
}

function FloralCorner({
  top,
  right,
}: {
  top?: boolean
  right?: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        [top ? 'top' : 'bottom']: 40,
        [right ? 'right' : 'left']: 40,
        width: 180,
        height: 180,
        borderRadius: '999px',
        background:
          'radial-gradient(circle at 40% 40%, rgba(232,217,188,0.95) 0%, rgba(214,190,143,0.82) 24%, rgba(255,255,255,0) 68%)',
        opacity: 0.9,
        filter: 'blur(2px)',
      }}
    />
  )
}

function IntroSlideCard({ slide, progress }: { slide: IntroSlide; progress: number }) {
  return (
    <AbsoluteFill style={bgStyle}>
      <FloralCorner top />
      <FloralCorner right />
      <div
        style={{
          position: 'absolute',
          inset: 36,
          border: '2px solid rgba(183,147,75,0.72)',
          boxShadow: '0 0 0 12px rgba(255,255,255,0.45) inset',
        }}
      />
      <Ornament top />
      <Ornament />
      <div
        style={{
          position: 'absolute',
          inset: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          opacity: progress,
          transform: `translateY(${interpolate(progress, [0, 1], [18, 0])}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 94,
            lineHeight: 0.94,
            margin: 0,
            fontWeight: 600,
            textWrap: 'balance',
            maxWidth: 760,
          }}
        >
          {slide.title}
        </h1>
        <div
          style={{
            marginTop: 38,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontSize: 38,
            lineHeight: 1.35,
            color: '#51473d',
          }}
        >
          {slide.body.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        {slide.cta ? (
          <div
            style={{
              marginTop: 54,
              borderRadius: 999,
              padding: '22px 42px',
              border: '2px solid rgba(183,147,75,0.78)',
              background: 'linear-gradient(180deg, rgba(246,227,187,0.95) 0%, rgba(234,208,157,0.92) 100%)',
              boxShadow: '0 8px 22px rgba(130, 98, 37, 0.18)',
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontSize: 30,
              color: '#58442c',
            }}
          >
            {slide.cta}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  )
}

export function InstagramIntro({ slides }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slideDuration = 90

  return (
    <AbsoluteFill>
      {slides.map((slide, index) => {
        const start = index * slideDuration
        const localFrame = frame - start
        const inSpring = spring({
          fps,
          frame: localFrame,
          config: { damping: 16, stiffness: 120 },
          durationInFrames: 18,
        })
        const out = interpolate(localFrame, [slideDuration - 14, slideDuration], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const progress = Math.min(inSpring, out)

        return (
          <Sequence key={`${slide.title}-${index}`} from={start} durationInFrames={slideDuration}>
            <IntroSlideCard slide={slide} progress={progress} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
