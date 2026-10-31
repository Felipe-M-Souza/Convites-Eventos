import { eventData, type EventData, type StoryFrame } from './eventData'

/** Convite da Helena: a história passa em vídeo e os textos ficam editáveis no painel. */
export const helenaStorySlug = 'helena-jardim'

const frame = (
  imageUrl: string,
  speaker: string,
  caption: string,
  holdMs: number,
): StoryFrame => ({
  imageUrl,
  speaker,
  caption,
  captionOverImage: false,
  holdMs,
})

export const helenaStoryFrames: StoryFrame[] = [
  frame(
    '/images/helena-jardim/01.jpg',
    '',
    'Em um lugar muito especial, existe um jardim...',
    5600,
  ),
  frame(
    '/images/helena-jardim/02.jpg',
    'Jesus',
    'Helena, minha pequena flor... sabe por que preparei este jardim tão bonito para você?',
    8000,
  ),
  frame('/images/helena-jardim/03.jpg', 'Helena', 'Por quê, Jesus?', 4200),
  frame(
    '/images/helena-jardim/04.jpg',
    'Jesus',
    'Porque existe uma família lá na Terra que sonha muito com você. Dois corações que esperaram, tiveram esperança e nunca deixaram de acreditar.',
    10000,
  ),
  frame(
    '/images/helena-jardim/05.jpg',
    'Jesus',
    'Eu escolhi você para chegar até eles, para florescer a vida deles com amor, alegria e muitos sorrisos.',
    8500,
  ),
  frame('/images/helena-jardim/06.jpg', 'Helena', 'Então eu vou ser a florzinha deles?', 5000),
  frame(
    '/images/helena-jardim/07.jpg',
    'Jesus',
    'Você será muito mais que uma florzinha, minha menina. Você será a promessa que vai transformar a vida deles!',
    9500,
  ),
  frame('/images/helena-jardim/08.jpg', 'Helena', 'Jesus, e quando eu chegar lá, eles vão me amar?', 5500),
  frame(
    '/images/helena-jardim/09.jpg',
    'Jesus',
    'Ah, minha pequena... eles já amam você antes mesmo de te conhecer. E quando olharem nos seus olhinhos, vão entender que algumas promessas florescem no tempo certo.',
    12000,
  ),
  frame(
    '/images/helena-jardim/10.jpg',
    'Helena',
    'E agora que minha florzinha já floresceu por um aninho, quero convidar você para comemorar comigo!',
    8500,
  ),
  frame(
    '/images/helena-jardim/11.jpg',
    '',
    'O Jardim de Promessas. Helena faz 1 aninho! 09 de janeiro de 2027, 13 horas, Hug Recepções. Uma promessa que floresceu em amor.',
    9000,
  ),
  frame('/images/helena-jardim/12.jpg', '', 'Esperamos você!', 7000),
]

export function helenaStoryInvite(): EventData {
  return {
    ...structuredClone(eventData),
    inviteTheme: 'story',
    coupleNames: 'Helena',
    openingPreviewTitle: 'faz 1 aninho',
    seoTitle: 'Helena faz 1 aninho | O Jardim de Promessas',
    seoDescription:
      'Helena faz 1 aninho no dia 09 de janeiro de 2027, às 13 horas, na Hug Recepções. Uma promessa que floresceu em amor.',
    weddingDateLabel: '09 de janeiro de 2027',
    weddingDateTime: '2027-01-09T13:00:00',
    time: '13h00',
    venue: 'Hug Recepções',
    address: '',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=Hug+Recep%C3%A7%C3%B5es',
    message: 'Uma promessa que floresceu em amor.',
    verse: 'O Jardim de Promessas',
    coverImageUrl: '/images/helena-jardim/11.jpg',
    backgroundAudioUrl: '',
    galleryPhotos: ['/images/helena-jardim/02.jpg', '/images/helena-jardim/09.jpg', '/images/helena-jardim/12.jpg'],
    rsvpWhatsappPhone: '',
    rsvpWhatsappMessage: '',
    giftsLink: '',
    giftsIntro: '',
    storyFrames: helenaStoryFrames,
  }
}
