import type { Locale } from '../i18n/locales'

export type WeddingModelId = 'classic' | 'sage' | 'monogram' | 'film'

type Localized = Record<Locale, string>

export type WeddingModel = {
  id: WeddingModelId
  slug: string
  title: Localized
  line: Localized
}

export const weddingModels: WeddingModel[] = [
  {
    id: 'classic',
    slug: 'default',
    title: { 'pt-BR': 'Clássico', en: 'Classic', es: 'Clásico' },
    line: {
      'pt-BR': 'Página completa, com envelope, mapa e confirmação.',
      en: 'A full page, with envelope, map and RSVP.',
      es: 'Página completa, con sobre, mapa y confirmación.',
    },
  },
  {
    id: 'sage',
    slug: 'default-verde',
    title: { 'pt-BR': 'Verde', en: 'Sage', es: 'Verde' },
    line: {
      'pt-BR': 'Pais, calendário, programa do dia e livro de mensagens.',
      en: 'Parents, calendar, the day’s program and a guestbook.',
      es: 'Padres, calendario, programa del día y libro de mensajes.',
    },
  },
  {
    id: 'monogram',
    slug: 'default-monograma',
    title: { 'pt-BR': 'Monograma', en: 'Monogram', es: 'Monograma' },
    line: {
      'pt-BR': 'Envelope creme, fita sálvia, rosa branca e selo dourado.',
      en: 'Cream envelope, sage ribbon, white rose and gold seal.',
      es: 'Sobre crema, cinta salvia, rosa blanca y sello dorado.',
    },
  },
  {
    id: 'film',
    slug: 'default-filme',
    title: { 'pt-BR': 'Filme', en: 'Film', es: 'Filme' },
    line: {
      'pt-BR': 'As cenas passam sozinhas, com carta, data e local.',
      en: 'The scenes play on their own, with the letter, date and venue.',
      es: 'Las escenas pasan solas, con carta, fecha y lugar.',
    },
  },
]

export const weddingShowcaseCopy: Record<
  Locale,
  {
    eyebrow: string
    cardEyebrow: string
    title: string
    description: string
    open: string
    whatsapp: string
    whatsappMessage: (title: string) => string
  }
> = {
  'pt-BR': {
    eyebrow: 'Casamento',
    cardEyebrow: 'Casamento',
    title: 'Quatro jeitos de contar o casamento',
    description: 'O valor continua único. O estilo é escolhido com a gente.',
    open: 'Ver este modelo',
    whatsapp: 'Quero este estilo',
    whatsappMessage: (title) =>
      `Olá! Vi o modelo de casamento ${title} no Convites Diversos e gostaria do convite de R$ 50,00 nesse estilo.`,
  },
  en: {
    eyebrow: 'Wedding',
    cardEyebrow: 'Wedding',
    title: 'Four ways to tell the wedding',
    description: 'The price stays the same. The style is chosen with us.',
    open: 'See this model',
    whatsapp: 'I want this style',
    whatsappMessage: (title) =>
      `Hi! I saw the ${title} wedding model on Convites Diversos and would like the R$ 50 invitation in that style.`,
  },
  es: {
    eyebrow: 'Boda',
    cardEyebrow: 'Boda',
    title: 'Cuatro formas de contar la boda',
    description: 'El valor sigue siendo único. El estilo se elige con nosotros.',
    open: 'Ver este modelo',
    whatsapp: 'Quiero este estilo',
    whatsappMessage: (title) =>
      `¡Hola! Vi el modelo de boda ${title} en Convites Diversos y me gustaría la invitación de R$ 50 en ese estilo.`,
  },
}
