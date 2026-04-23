export type IntroSlide = {
  title: string
  body: string[]
  cta?: string
}

export const defaultIntroSlides: IntroSlide[] = [
  {
    title: 'Convites Diversos',
    body: ['Convites digitais', 'personalizados para', 'momentos especiais.'],
  },
  {
    title: 'O que fazemos',
    body: ['Criamos convites', 'digitais elegantes,', 'interativos e faceis', 'de compartilhar.'],
  },
  {
    title: 'Para quais ocasioes',
    body: ['Aniversarios', '15 anos', 'Cha de bebe', 'Cha revelacao', 'Bodas', 'Homenagens e mais'],
  },
  {
    title: 'Nosso diferencial',
    body: ['Abertura animada,', 'visual profissional,', 'link unico com mapa', 'e confirmacao.'],
  },
  {
    title: 'Quer um convite com a',
    body: ['sua identidade?'],
    cta: 'Fale conosco pelo WhatsApp da bio.',
  },
]

export type ShowcaseItem = {
  title: string
  subtitle: string
  slug?: string
  sealX?: number
  sealY?: number
  closedImageSrc?: string
  openImageSrc?: string
  pageFullImageSrc?: string
  pageStepImageSrcs?: string[]
  pageTopImageSrc?: string
  pageBottomImageSrc?: string
}

export const SHOWCASE_ITEM_DURATION = 240

function buildPageStepImages(fileBase: string, count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const step = String(index + 1).padStart(2, '0')
    return `remotion-captures/${fileBase}-page-step-${step}.png`
  })
}

export const defaultShowcaseItems: ShowcaseItem[] = [
  {
    title: 'Aniversario Infantil',
    subtitle: 'Uma apresentacao leve, colorida e pronta para compartilhar.',
    slug: 'demo-aniversario-infantil',
    sealX: 0.5,
    sealY: 0.64,
    closedImageSrc: 'remotion-captures/aniversario-infantil-closed.png',
    openImageSrc: 'remotion-captures/aniversario-infantil-open.png',
    pageStepImageSrcs: buildPageStepImages('aniversario-infantil'),
    pageTopImageSrc: 'remotion-captures/aniversario-infantil-page-top.png',
    pageBottomImageSrc: 'remotion-captures/aniversario-infantil-page-bottom.png',
  },
  {
    title: '15 Anos',
    subtitle: 'Visual elegante com impacto premium para reels e portfolio.',
    slug: 'demo-festa-15-anos',
    sealX: 0.5,
    sealY: 0.64,
    closedImageSrc: 'remotion-captures/15-anos-closed.png',
    openImageSrc: 'remotion-captures/15-anos-open.png',
    pageFullImageSrc: 'remotion-captures/15-anos-page-full.png',
    pageStepImageSrcs: buildPageStepImages('15-anos'),
    pageTopImageSrc: 'remotion-captures/15-anos-page-top.png',
    pageBottomImageSrc: 'remotion-captures/15-anos-page-bottom.png',
  },
  {
    title: 'Cha de Bebe',
    subtitle: 'Delicadeza, mapa e RSVP em uma unica experiencia.',
    slug: 'demo-cha-de-bebe',
    sealX: 0.5,
    sealY: 0.64,
    closedImageSrc: 'remotion-captures/cha-de-bebe-closed.png',
    openImageSrc: 'remotion-captures/cha-de-bebe-open.png',
    pageFullImageSrc: 'remotion-captures/cha-de-bebe-page-full.png',
    pageStepImageSrcs: buildPageStepImages('cha-de-bebe'),
    pageTopImageSrc: 'remotion-captures/cha-de-bebe-page-top.png',
    pageBottomImageSrc: 'remotion-captures/cha-de-bebe-page-bottom.png',
  },
  {
    title: 'Cha Revelacao',
    subtitle: 'Surpresa e emocao em um convite pensado para compartilhar.',
    slug: 'demo-cha-revelacao',
    sealX: 0.5,
    sealY: 0.6,
    closedImageSrc: 'remotion-captures/cha-revelacao-closed.png',
    openImageSrc: 'remotion-captures/cha-revelacao-open.png',
    pageStepImageSrcs: buildPageStepImages('cha-revelacao'),
    pageTopImageSrc: 'remotion-captures/cha-revelacao-page-top.png',
    pageBottomImageSrc: 'remotion-captures/cha-revelacao-page-bottom.png',
  },
  {
    title: 'Aniversario Adulto',
    subtitle: 'Composicao sofisticada para reels e portfolio premium.',
    slug: 'demo-aniversario-adulto',
    sealX: 0.5,
    sealY: 0.64,
    closedImageSrc: 'remotion-captures/aniversario-adulto-closed.png',
    openImageSrc: 'remotion-captures/aniversario-adulto-open.png',
    pageStepImageSrcs: buildPageStepImages('aniversario-adulto'),
    pageTopImageSrc: 'remotion-captures/aniversario-adulto-page-top.png',
    pageBottomImageSrc: 'remotion-captures/aniversario-adulto-page-bottom.png',
  },
  {
    title: 'Homenagem',
    subtitle: 'Uma apresentacao respeitosa e elegante para momentos especiais.',
    slug: 'demo-homenagem',
    sealX: 0.5,
    sealY: 0.64,
    closedImageSrc: 'remotion-captures/homenagem-closed.png',
    openImageSrc: 'remotion-captures/homenagem-open.png',
    pageStepImageSrcs: buildPageStepImages('homenagem'),
    pageTopImageSrc: 'remotion-captures/homenagem-page-top.png',
    pageBottomImageSrc: 'remotion-captures/homenagem-page-bottom.png',
  },
]
