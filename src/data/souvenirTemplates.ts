export type SouvenirTemplate = {
  id: string
  name: string
  description: string
  width: number
  height: number
  backgroundStart: string
  backgroundEnd: string
  surfaceColor: string
  textColor: string
  accentColor: string
  media: {
    x: number
    y: number
    width: number
    height: number
    radius: number
  }
  text: {
    align: 'left' | 'center'
    titleY: number
    subtitleY: number
    footerY: number
  }
}

export const souvenirTemplates: SouvenirTemplate[] = [
  {
    id: 'classic-story',
    name: 'Clássico vertical',
    description: 'Ideal para WhatsApp Status e story, com foto ou capa do vídeo em destaque.',
    width: 1080,
    height: 1920,
    backgroundStart: '#f6ede5',
    backgroundEnd: '#d6b48d',
    surfaceColor: '#fffaf6',
    textColor: '#3e2d21',
    accentColor: '#c19763',
    media: { x: 84, y: 120, width: 912, height: 1160, radius: 42 },
    text: { align: 'center', titleY: 1360, subtitleY: 1458, footerY: 1720 },
  },
  {
    id: 'memory-card',
    name: 'Lembrança elegante',
    description: 'Cartão mais clean para compartilhar como recordação do evento.',
    width: 1080,
    height: 1350,
    backgroundStart: '#f8f1ea',
    backgroundEnd: '#ead8c7',
    surfaceColor: '#ffffff',
    textColor: '#402f25',
    accentColor: '#d1a56f',
    media: { x: 96, y: 90, width: 888, height: 760, radius: 36 },
    text: { align: 'center', titleY: 930, subtitleY: 1010, footerY: 1196 },
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    description: 'Visual de lembrança impressa, ótimo para fotos e vídeos curtos.',
    width: 1080,
    height: 1350,
    backgroundStart: '#ece7df',
    backgroundEnd: '#d7cbbd',
    surfaceColor: '#fffdfb',
    textColor: '#3f342c',
    accentColor: '#b88a58',
    media: { x: 140, y: 108, width: 800, height: 820, radius: 20 },
    text: { align: 'left', titleY: 1010, subtitleY: 1090, footerY: 1215 },
  },
]
