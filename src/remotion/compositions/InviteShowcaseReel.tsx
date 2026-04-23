import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { SHOWCASE_ITEM_DURATION, type ShowcaseItem } from '../data'

type Props = {
  items: ShowcaseItem[]
}

function resolveImageSrc(src: string) {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return staticFile(src)
}

function ScrollScreens({
  imageSrcs,
  progress,
}: {
  imageSrcs: string[]
  progress: number
}) {
  if (!imageSrcs.length) return null

  const travel = imageSrcs.length > 1 ? progress * (imageSrcs.length - 1) : 0
  const currentIndex = Math.min(imageSrcs.length - 1, Math.floor(travel))
  const nextIndex = Math.min(imageSrcs.length - 1, currentIndex + 1)
  const blend = travel - currentIndex

  const currentSrc = imageSrcs[currentIndex]
  const nextSrc = imageSrcs[nextIndex]

  return (
    <>
      <Img
        key={`${currentSrc}-${currentIndex}`}
        src={currentSrc}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
            transform: `translateY(${interpolate(blend, [0, 1], [0, -100])}%)`,
        }}
      />
      {nextIndex !== currentIndex ? (
        <Img
          key={`${nextSrc}-${nextIndex}`}
          src={nextSrc}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `translateY(${interpolate(blend, [0, 1], [100, 0])}%)`,
          }}
        />
      ) : null}
    </>
  )
}

function Cursor({
  progress,
  x,
  y,
  clickProgress,
}: {
  progress: number
  x: number
  y: number
  clickProgress: number
}) {
  const translateX = interpolate(progress, [0, 1], [-170, x], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translateY = interpolate(progress, [0, 1], [260, y], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const scale = interpolate(clickProgress, [0, 1], [1, 0.88], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: translateX,
          top: translateY,
          width: 34,
          height: 48,
          background: '#ffffff',
          clipPath: 'polygon(0 0, 0 100%, 24% 74%, 46% 100%, 56% 94%, 36% 67%, 100% 67%)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.18)',
          transform: `translate(-12px, -12px) scale(${scale})`,
          zIndex: 30,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: interpolate(clickProgress, [0, 1], [0, 90]),
          height: interpolate(clickProgress, [0, 1], [0, 90]),
          borderRadius: '50%',
          border: '3px solid rgba(234, 192, 109, 0.85)',
          transform: 'translate(-50%, -50%)',
          opacity: interpolate(clickProgress, [0, 1], [0, 1]),
          zIndex: 25,
        }}
      />
    </>
  )
}

function BrowserCard({
  item,
  progress,
  localFrame,
}: {
  item: ShowcaseItem
  progress: number
  localFrame: number
}) {
  const closedSrc = item.closedImageSrc ? resolveImageSrc(item.closedImageSrc) : null
  const openSrc = item.openImageSrc ? resolveImageSrc(item.openImageSrc) : null
  const pageFullSrc = item.pageFullImageSrc ? resolveImageSrc(item.pageFullImageSrc) : null
  const pageStepSrcs = (item.pageStepImageSrcs ?? []).map(resolveImageSrc)
  const pageTopSrc = item.pageTopImageSrc ? resolveImageSrc(item.pageTopImageSrc) : null
  const pageBottomSrc = item.pageBottomImageSrc ? resolveImageSrc(item.pageBottomImageSrc) : null
  const cursorMove = interpolate(localFrame, [0, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const clickPulse = interpolate(localFrame, [26, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const openFade = interpolate(localFrame, [38, 62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const pageReveal = interpolate(localFrame, [92, 112], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fullScreenReveal = interpolate(localFrame, [122, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const scrollProgress = interpolate(localFrame, [152, 228], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const smoothScrollProgress = interpolate(scrollProgress, [0, 0.18, 0.82, 1], [0, 0.1, 0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const previewScrollProgress = interpolate(smoothScrollProgress, [0, 1], [0, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const screenWidth = 1080 - 140 - 64
  const screenHeight = 1920 - 140 - 84 - 64 - 220
  const sealX = screenWidth * (item.sealX ?? 0.5)
  const sealY = screenHeight * (item.sealY ?? 0.64)
  const chromeOpacity = 1 - fullScreenReveal
  const detailsOpacity = 1 - fullScreenReveal
  const browserCardOpacity =
    progress *
    (1 -
      interpolate(fullScreenReveal, [0, 0.28, 1], [0, 1, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }))
  const fullScreenOpacity = fullScreenReveal * progress
  const previewVisualOpacity = 1 - fullScreenReveal
  const fullScreenScale = interpolate(fullScreenReveal, [0, 1], [0.96, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fullScreenTranslateY = interpolate(fullScreenReveal, [0, 1], [90, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const canUseStepScroll = pageStepSrcs.length >= 2
  const hasAnyPageVisual = canUseStepScroll || Boolean(pageFullSrc) || (Boolean(pageTopSrc) && Boolean(pageBottomSrc))

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at top, rgba(239, 223, 194, 0.4), transparent 42%), linear-gradient(180deg, #f8f3ec 0%, #f3e9da 100%)',
        fontFamily: 'Montserrat, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 70,
          borderRadius: 42,
          background: '#ffffff',
          boxShadow: '0 24px 60px rgba(48, 38, 26, 0.14)',
          overflow: 'hidden',
          opacity: browserCardOpacity,
          transform: `translateY(${interpolate(progress, [0, 1], [28, 0])}px) scale(${interpolate(progress, [0, 1], [0.97, 1])})`,
        }}
      >
        <div
          style={{
            height: 84,
            padding: '0 30px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#f5efe6',
            borderBottom: '1px solid rgba(128, 110, 79, 0.14)',
            opacity: chromeOpacity,
          }}
        >
          {['#ec8e84', '#f1c06d', '#8dcf9d'].map((color) => (
            <div
              key={color}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: color,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 12,
              flex: 1,
              height: 38,
              borderRadius: 999,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              color: '#8c7b67',
              fontSize: 18,
            }}
          >
            convitesdiversos.com.br/c/{item.slug ?? 'demo'}
          </div>
        </div>

        <div
          style={{
            padding: 32,
            display: 'grid',
            gridTemplateRows: '1fr auto',
            height: 'calc(100% - 84px)',
            gap: 30,
            opacity: chromeOpacity,
          }}
        >
          <div
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              background:
                'linear-gradient(160deg, rgba(248,241,230,1) 0%, rgba(234,220,196,1) 100%)',
              border: '1px solid rgba(175, 149, 103, 0.24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {closedSrc && openSrc && hasAnyPageVisual ? (
              <>
                <Img
                  src={closedSrc}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: (1 - openFade) * previewVisualOpacity,
                  }}
                />
                <Img
                  src={openSrc}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: openFade * (1 - pageReveal) * previewVisualOpacity,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: pageReveal * previewVisualOpacity,
                  }}
                >
                  {canUseStepScroll ? (
                    <ScrollScreens imageSrcs={pageStepSrcs} progress={previewScrollProgress} />
                  ) : pageTopSrc && pageBottomSrc ? (
                    <>
                      <Img
                        src={pageTopSrc}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `translateY(${interpolate(smoothScrollProgress, [0, 1], [0, -100])}%)`,
                        }}
                      />
                      <Img
                        src={pageBottomSrc}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `translateY(${interpolate(smoothScrollProgress, [0, 1], [100, 0])}%)`,
                        }}
                      />
                    </>
                  ) : null}
                </div>
                {fullScreenReveal < 0.1 ? (
                  <Cursor
                    progress={cursorMove}
                    clickProgress={clickPulse}
                    x={sealX}
                    y={sealY}
                  />
                ) : null}
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 18,
                  textAlign: 'center',
                  color: '#8f6e38',
                  padding: 40,
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle at 30% 30%, #fbe9b9 0%, #d0ac63 58%, #9c7332 100%)',
                  }}
                />
                <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 72, lineHeight: 0.95 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 28, lineHeight: 1.45, maxWidth: 620, color: '#5e5347' }}>{item.subtitle}</div>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              opacity: detailsOpacity,
            }}
          >
            <div
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 68,
                lineHeight: 0.96,
                color: '#87632d',
              }}
            >
              {item.title}
            </div>
            <div style={{ fontSize: 26, lineHeight: 1.45, color: '#55473a' }}>{item.subtitle}</div>
          </div>
        </div>
      </div>

      {closedSrc && openSrc && hasAnyPageVisual ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            opacity: fullScreenOpacity,
            transform: `translateY(${fullScreenTranslateY}px) scale(${fullScreenScale})`,
          }}
        >
          {canUseStepScroll ? (
            <ScrollScreens imageSrcs={pageStepSrcs} progress={smoothScrollProgress} />
          ) : pageFullSrc ? (
            <Img
              src={pageFullSrc}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: 'auto',
                transform: `translateY(calc(${interpolate(smoothScrollProgress, [0, 1], [0, -100])}% + ${interpolate(
                  smoothScrollProgress,
                  [0, 1],
                  [0, 1920],
                )}px))`,
              }}
            />
          ) : pageTopSrc && pageBottomSrc ? (
            <>
              <Img
                src={pageTopSrc}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `translateY(${interpolate(smoothScrollProgress, [0, 1], [0, -100])}%)`,
                }}
              />
              <Img
                src={pageBottomSrc}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `translateY(${interpolate(smoothScrollProgress, [0, 1], [100, 0])}%)`,
                }}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  )
}

export function InviteShowcaseReel({ items }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const itemDuration = SHOWCASE_ITEM_DURATION

  return (
    <AbsoluteFill>
      {items.map((item, index) => {
        const start = index * itemDuration
        const localFrame = frame - start
        const inSpring = spring({
          fps,
          frame: localFrame,
          config: { damping: 18, stiffness: 110 },
          durationInFrames: 22,
        })
        const out = interpolate(localFrame, [itemDuration - 18, itemDuration], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const progress = Math.min(inSpring, out)

        return (
          <Sequence key={`${item.title}-${index}`} from={start} durationInFrames={itemDuration}>
            <BrowserCard item={item} progress={progress} localFrame={localFrame} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
