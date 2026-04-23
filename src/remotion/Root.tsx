import { Composition } from 'remotion'
import { InstagramIntro } from './compositions/InstagramIntro'
import { InviteShowcaseReel } from './compositions/InviteShowcaseReel'
import { SHOWCASE_ITEM_DURATION, defaultIntroSlides, defaultShowcaseItems } from './data'

const FPS = 30

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="InstagramIntro"
        component={InstagramIntro}
        width={1080}
        height={1350}
        fps={FPS}
        durationInFrames={defaultIntroSlides.length * 90}
        defaultProps={{
          slides: defaultIntroSlides,
        }}
      />
      <Composition
        id="InviteShowcaseReel"
        component={InviteShowcaseReel}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={defaultShowcaseItems.length * SHOWCASE_ITEM_DURATION}
        defaultProps={{
          items: defaultShowcaseItems,
        }}
      />
    </>
  )
}
