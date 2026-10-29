import { parseWaMeLink } from '../lib/whatsappLink'
import type { Locale } from '../i18n/locales'

export const inviteTranslationLocales = ['en', 'es'] as const
export type InviteTranslationLocale = (typeof inviteTranslationLocales)[number]

export const inviteTranslatableFields = [
  'openingSealHint',
  'openingPreviewTitle',
  'eventDetailsHeading',
  'dressCodeLabel',
  'mapsButtonLabel',
  'rsvpButtonLabel',
  'heroContinueLabel',
  'seoTitle',
  'seoDescription',
  'coupleNames',
  'heroSubtitle',
  'verse',
  'weddingDateLabel',
  'message',
  'venue',
  'address',
  'time',
  'dressCode',
  'notes',
  'rsvpWhatsappMessage',
  'giftsButtonLabel',
  'giftsIntro',
  'giftsQrCaption',
  'guestUploadsTitle',
  'guestUploadsDescription',
  'footerThanks',
  'footerContact',
  'coupleStoryHeading',
  'coupleStory',
  'ceremonyTitle',
  'ceremonyTime',
  'ceremonyVenue',
  'ceremonyAddress',
  'receptionTitle',
  'receptionTime',
  'receptionVenue',
  'receptionAddress',
  'guestGuideHeading',
  'guestGuideLodging',
  'guestGuideParking',
  'guestGuideDress',
  'guestGuideBeauty',
] as const

export type InviteTranslatableField = (typeof inviteTranslatableFields)[number]
export type InviteTranslations = Partial<Record<InviteTranslationLocale, Partial<Record<InviteTranslatableField, string>>>>

export const inviteThemes = ['classic', 'sage'] as const
export type InviteTheme = (typeof inviteThemes)[number]

export type DayProgramItem = {
  time: string
  title: string
}

export type GuestbookSample = {
  name: string
  message: string
}

/** Separa «Elaine e Leonardo» ou «Maria & João» em duas linhas. */
export function coupleNameParts(names: string): string[] {
  const parts = names
    .split(/\s*(?:&| e )\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length >= 2) return [parts[0]!, parts.slice(1).join(' e ')]
  const single = names.trim()
  return single ? [single] : []
}

/** Primeira letra de cada nome quando o formato é «Nome & Nome» ou «Nome e Nome». */
export function initialsFromCoupleNames(names: string): string {
  const parts = names
    .split(/\s*(?:&| e )\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)
  const letter = (fragment: string) => {
    const m = fragment.match(/[A-Za-zÀ-ÿ]/)
    return m ? m[0].toUpperCase() : ''
  }
  if (parts.length >= 2) {
    const a = letter(parts[0]!)
    const b = letter(parts[1]!)
    if (a && b) return `${a} & ${b}`
  }
  const one = letter(names)
  return one || '&'
}

/** Lacre: usa `openingSealMark` se preenchido; senão calcula a partir de `coupleNames`. */
export function resolveSealMark(d: {
  coupleNames: string
  openingSealMark: string
}): string {
  const manual = d.openingSealMark.trim()
  if (manual) return manual
  return initialsFromCoupleNames(d.coupleNames)
}

export const eventData = {
  /** Texto discreto acima do envelope (opcional; não é exibido na abertura atual) */
  openingEyebrow: '',
  /** Texto de ajuda — o convite só abre ao clicar no selo */
  openingSealHint: 'Clique no selo para abrir o convite',
  /**
   * Texto manual no lacre (ex.: «T ♥ S»). Deixe vazio para gerar iniciais a partir de `coupleNames`
   * (ex.: «Maria & João» → «M & J»).
   */
  openingSealMark: '',
  /**
   * `seal` = selo dourado clássico; `soccer_goal` = trave + animação de bola ao golo (mesma âncora do selo);
   * `butterfly` = borboleta no lugar do selo que voa ao ser tocada e abre o convite.
   * Os slugs `san-barssoti` (futebol) e `cleyzamara` (borboleta) também ativam o modo no código até gravares a opção no CMS.
   */
  openingInteractionMode: 'seal' as 'seal' | 'soccer_goal' | 'butterfly',
  /**
   * Moldura de fundo na abertura (PNG em `public/images/frames/`).
   * Vazio = usa a moldura padrão do casamento.
   */
  openingFrameImageUrl: '',
  /**
   * Cor atrás da moldura na abertura (faixas letterbox / transparência).
   * Vazio = `var(--color-cream)`; use um cinza escuro em molduras escuras para não “clarear” o centro.
   */
  openingBackdropColor: '',
  /**
   * Espaço extra acima do bloco de abertura (envelope + textos de data/hora).
   * Valor CSS (ex.: «clamp(1rem,4vh,2.5rem)» ou «32px»). Vazio = sem offset.
   */
  openingLayoutOffsetTop: '',
  /** Margem só no envelope; o bloco de dicas/data compensa para não subir/descer junto. Vazio = sem. */
  openingEnvelopeMarginTop: '',
  /** Cor CSS opcional dos textos abaixo do envelope. Vazio = estilo do tema. */
  openingTextColor: '',
  /** Opacidade opcional dos textos abaixo do envelope (0 a 1). null = estilo do tema. */
  openingTextOpacity: null as number | null,
  /** Estilos opcionais dos textos abaixo do envelope. */
  openingTextBold: false,
  openingTextItalic: false,
  openingTextUnderline: false,
  /** Imagem do envelope na abertura (ficheiro em `public/images/`). */
  openingEnvelopeImageUrl: '/images/envelope-burgundy.png',
  /** Envelope já aberto (aba para cima); mostrado após rasgar o selo. `public/images/`. */
  openingEnvelopeOpenImageUrl: '/images/envelope-open.png',
  /**
   * Proporção nativa do PNG do envelope (largura × altura), usada para calcular a caixa e o selo.
   * O modelo antigo usa 1024×682; artes novas costumam ser 1536×1024.
   */
  openingEnvelopeNaturalWidth: 1024,
  openingEnvelopeNaturalHeight: 682,
  /**
   * Dimensões nativas do PNG aberto quando **diferem** do fechado (ex.: fechado 1536×1024, aberto 1024×1024).
   * null = assume iguais às do fechado. A caixa usa max(h/w) entre os dois para não cortar a arte aberta.
   */
  openingEnvelopeOpenNaturalWidth: null as number | null,
  openingEnvelopeOpenNaturalHeight: null as number | null,
  /** Posição vertical do selo (0–1), relativa à caixa do envelope fechado. Valores maiores descem o selo (ponta do aba). */
  openingSealAnchorY: 0.8,
  /** Posição horizontal do selo (0 = esquerda, 1 = direita). 0,5 = centro; ajuste se o PNG do envelope tiver arte descentrada (ex.: com zoom 1). */
  openingSealAnchorX: 0.5,
  /**
   * Zoom na textura do envelope fechado/aberto (>1 aproxima e corta bordas).
   * null = usa 1,24 (desktop) / 1,32 (mobile). Use 1 em artes que não devem ser cortadas.
   */
  openingEnvelopeTextureZoom: null as number | null,
  /**
   * Largura máxima (px) da caixa do envelope na abertura. null = 400.
   * Em artes 3∶2 só fechado/aberto, aumentar também aumenta a altura (proporção fixa).
   */
  openingEnvelopeBoxWidthMaxPx: null as number | null,
  /** Tecto em vh da altura da caixa do envelope. null = 42. */
  openingEnvelopeBoxHeightVhCap: null as number | null,
  /** Tecto em px da altura da caixa (ex.: PNG 1∶1). null = 440. */
  openingEnvelopeBoxMaxHeightPx: null as number | null,
  /** Título curto no cartão que sobe após abrir o envelope. */
  openingPreviewTitle: 'Convite especial',
  /** Título da secção de detalhes (ex.: «Detalhes do evento»). */
  eventDetailsHeading: 'Detalhes do evento',
  /** Rótulo do campo de traje / vestimenta. */
  dressCodeLabel: 'Traje',
  /** Texto do botão do mapa. */
  mapsButtonLabel: 'Ver no mapa',
  /** Texto do botão de confirmação (RSVP). */
  rsvpButtonLabel: 'Confirmar presença',
  /** Texto do botão principal na hero após abrir o convite. */
  heroContinueLabel: 'Ver convite',
  /** SEO opcional para convites em /c/:slug (title da página). Vazio = fallback automático. */
  seoTitle: 'Convite Digital Casamento Personalizado | Convites Diversos',
  /** SEO opcional para convites em /c/:slug (meta description). Vazio = mensagem resumida. */
  seoDescription:
    'Convite digital de casamento com abertura animada, mapa, RSVP e trilha sonora. Um link completo para seus convidados.',
  coupleNames: 'Maria & João',
  /** Texto opcional exibido logo abaixo do título principal na hero. */
  heroSubtitle: '',
  verse:
    'O amor é paciente, o amor é bondoso. — 1 Coríntios 13:4',
  weddingDateLabel: '15 de novembro de 2026',
  /** Data e hora do evento em ISO 8601 (fuso local do casamento) */
  weddingDateTime: '2026-11-15T16:00:00',
  coverImageUrl:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  message:
    'Com o coração transbordando de alegria, convidamos você para celebrar conosco o início da nossa família. Sua presença será o maior presente que poderíamos receber.',
  venue: 'Espaço Jardim Imperial',
  address: 'Rua das Flores, 123 — São Paulo/SP',
  time: '16h00',
  dressCode: 'Esporte fino',
  /** Mostrar o cartão de traje / dress code em «Detalhes do evento». */
  dressCodeEnabled: true,
  /**
   * false = o link público não abre o convite.
   * Quem acessa vê o aviso de visualização vitalícia após a aprovação do pagamento.
   */
  inviteEnabled: true,
  notes: 'Estacionamento no local. Cerimônia e festa no mesmo endereço.',
  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=Espa%C3%A7o+Jardim+Imperial+S%C3%A3o+Paulo',
  /** Apenas dígitos (DDI + DDD + número), sem + nem espaços. */
  rsvpWhatsappPhone: '5511999999999',
  /** Texto pré-preenchido no WhatsApp (acentos ok; o link é montado em código). */
  rsvpWhatsappMessage: 'Olá, confirmo minha presença no casamento!',
  giftsLink: 'https://www.example.com/lista-de-presentes',
  /** Mostrar botão, texto intro e QR da lista de presentes abaixo do mapa/RSVP. */
  giftsSectionEnabled: true,
  /** Texto do terceiro botão de ação. */
  giftsButtonLabel: 'Lista de presentes',
  /** Texto opcional acima do botão «Lista de presentes». Vazio = não mostra. */
  giftsIntro: '',
  /** URL da imagem do QR Code da lista de presentes (PNG, opcional). */
  giftsQrCodeImageUrl: '',
  /**
   * Conteúdo lido do QR. Vazio = o convite lê a imagem.
   * O “clique aqui” usa este conteúdo, e não o link da lista.
   */
  giftsQrPayload: '',
  /**
   * Frase abaixo do QR. Use {link} onde fica “clique aqui”.
   * Vazio = frase automática conforme o QR (Pix, site ou texto).
   */
  giftsQrCaption: '',
  /** Tamanho exibido do QR Code em px (largura e altura). */
  giftsQrCodeSizePx: 180,
  /** Fotos da galeria (URLs públicas ou caminhos em `public/`). */
  galleryPhotos: [
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  ],
  /** Ativa a secção pública para envio de fotos e vídeos pelos convidados. */
  guestUploadsEnabled: false,
  /** Título da secção pública de uploads. */
  guestUploadsTitle: 'Compartilhe suas fotos e vídeos do evento',
  /** Texto de apoio da secção pública de uploads. */
  guestUploadsDescription:
    'Envie um registro deste momento especial. O conteúdo será publicado no convite após aprovação do responsável.',
  /** URL de um arquivo de áudio em `public/audio/` (ex.: `/audio/velha-infancia.mp3`). */
  backgroundAudioUrl: '/audio/velha-infancia.mp3',
  footerThanks: 'Obrigado por fazer parte da nossa história.',
  footerContact: 'Dúvidas? Fale com os noivos pelo WhatsApp do RSVP.',
  /**
   * Blocos opcionais. Vazio = a secção não aparece.
   * Cerimônia e recepção substituem o cartão único de local quando algum dos dois está preenchido.
   */
  coupleStoryHeading: '',
  coupleStory: '',
  /** Foto opcional da secção «O casal». Vazio = sem imagem. */
  coupleStoryImageUrl: '',
  ceremonyTitle: '',
  ceremonyTime: '',
  ceremonyVenue: '',
  ceremonyAddress: '',
  ceremonyMapsLink: '',
  /** Foto opcional do cartão de cerimônia. Vazio = sem imagem. */
  ceremonyImageUrl: '',
  receptionTitle: '',
  receptionTime: '',
  receptionVenue: '',
  receptionAddress: '',
  receptionMapsLink: '',
  /** Foto opcional do cartão de recepção. Vazio = sem imagem. */
  receptionImageUrl: '',
  guestGuideHeading: '',
  guestGuideLodging: '',
  guestGuideParking: '',
  guestGuideDress: '',
  guestGuideBeauty: '',
  /**
   * `classic` = envelope e página atuais.
   * `sage` = modelo verde minimalista (capa, pais, calendário, programa e livro de mensagens).
   */
  inviteTheme: 'classic' as InviteTheme,
  /** Linha curta acima dos nomes no modelo verde. Vazio = não mostra. */
  sageEyebrow: '',
  parentsLeftLabel: '',
  parentsLeftNames: '',
  parentsRightLabel: '',
  parentsRightNames: '',
  dayProgramHeading: '',
  dayProgram: [] as DayProgramItem[],
  /** O livro só aparece no modelo verde, e só quando esta opção está ligada. */
  guestbookEnabled: false,
  guestbookHeading: '',
  guestbookSamples: [] as GuestbookSample[],
  translations: {} as InviteTranslations,
}

export type EventData = typeof eventData

/** Modelo de conteúdo ao criar um convite novo no /admin (o slug continua livre: letras, números e hífens). */
export const inviteCreationTemplates = ['wedding', 'birthday_milestone', 'neutral'] as const
export type InviteCreationTemplate = (typeof inviteCreationTemplates)[number]

/**
 * Payload inicial para `invite_config.insert`.
 * - `wedding`: exemplo atual (Maria & João).
 * - `birthday_milestone`: textos em tom de aniversário / 50 anos (substituir nomes e datas).
 * - `neutral`: campos mínimos para personalizar qualquer ocasião.
 */
export function getNewInvitePayload(template: InviteCreationTemplate): EventData {
  const base = structuredClone(eventData) as EventData

  if (template === 'wedding') {
    return base
  }

  if (template === 'neutral') {
    return {
      ...base,
      openingEyebrow: '',
      openingPreviewTitle: 'Convite especial',
      eventDetailsHeading: 'Detalhes do evento',
      dressCodeLabel: 'Vestimenta',
      seoTitle: '',
      seoDescription: '',
      coupleNames: 'Nome do evento ou anfitrião',
      verse: '',
      weddingDateLabel: 'Data do evento',
      weddingDateTime: '2030-06-15T19:00:00',
      coverImageUrl:
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      message: 'Substitua este texto por uma mensagem de convite aos seus convidados.',
      venue: 'Local da festa',
      address: 'Endereço completo — Cidade/UF',
      time: '19h00',
      dressCode: 'A combinar com o anfitrião',
      notes: '',
      mapsLink: 'https://www.google.com/maps',
      rsvpWhatsappMessage: 'Olá! Confirmo a minha presença.',
      guestUploadsTitle: 'Compartilhe fotos e vídeos do evento',
      guestUploadsDescription:
        'Envie um registro deste momento. O conteúdo será publicado no convite após aprovação do responsável.',
      galleryPhotos: [],
      footerThanks: 'Obrigado por fazer parte deste momento.',
      footerContact: 'Dúvidas? Contacte o anfitrião pelo WhatsApp do RSVP.',
      translations: {},
    }
  }

  return {
    ...base,
    openingPreviewTitle: '50 anos — uma festa à altura',
    eventDetailsHeading: 'Detalhes da festa',
    dressCodeLabel: 'Vestimenta',
    seoTitle: '',
    seoDescription: '',
    coupleNames: 'Nome do aniversariante',
    verse: 'A vida é feita de momentos que merecem ser celebrados com quem amamos.',
    weddingDateLabel: '20 de junho de 2026',
    weddingDateTime: '2026-06-20T19:00:00',
    coverImageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
    message:
      'Com alegria no coração, convidamos você para celebrar conosco esta data tão especial. Sua presença será a melhor companhia!',
    venue: 'Salão de festas (substitua pelo nome real)',
    address: 'Endereço completo — São Paulo/SP',
    time: '19h00',
    dressCode: 'Esporte fino',
    notes: 'Substitua ou remova estas notas.',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=S%C3%A3o+Paulo',
    rsvpWhatsappMessage: 'Olá! Confirmo minha presença na festa de aniversário.',
    guestUploadsTitle: 'Compartilhe fotos e vídeos da festa',
    guestUploadsDescription:
      'Envie um registro desta celebração. O conteúdo será publicado no convite após aprovação do responsável.',
    galleryPhotos: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80',
    ],
    footerThanks: 'Obrigado por fazer parte desta celebração.',
    footerContact: 'Dúvidas? Fale com a organização pelo WhatsApp do RSVP.',
    translations: {},
  }
}

type StoredPayload = Partial<EventData> & { rsvpWhatsappLink?: string }

function normalizeInviteTranslations(value: unknown): InviteTranslations {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const raw = value as Record<string, unknown>
  const next: InviteTranslations = {}

  for (const locale of inviteTranslationLocales) {
    const localeValue = raw[locale]
    if (!localeValue || typeof localeValue !== 'object' || Array.isArray(localeValue)) continue
    const translation: Partial<Record<InviteTranslatableField, string>> = {}
    const fields = localeValue as Record<string, unknown>
    for (const field of inviteTranslatableFields) {
      if (typeof fields[field] === 'string') translation[field] = fields[field]
    }
    next[locale] = translation
  }

  return next
}

function normalizeDayProgram(value: unknown): DayProgramItem[] {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const time = typeof (item as DayProgramItem).time === 'string' ? (item as DayProgramItem).time.trim() : ''
      const title = typeof (item as DayProgramItem).title === 'string' ? (item as DayProgramItem).title.trim() : ''
      if (!time && !title) return []
      return [{ time, title }]
    })
    .slice(0, 12)
}

function normalizeGuestbookSamples(value: unknown): GuestbookSample[] {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const name = typeof (item as GuestbookSample).name === 'string' ? (item as GuestbookSample).name.trim() : ''
      const message = typeof (item as GuestbookSample).message === 'string' ? (item as GuestbookSample).message.trim() : ''
      if (!name || !message) return []
      return [{ name, message }]
    })
    .slice(0, 12)
}

function normalizeOpeningTextOpacity(value: unknown): number | null {
  if (value == null || value === '') return null
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(numeric) ? Math.min(1, Math.max(0, numeric)) : null
}

export function resolveEventDataForLocale(data: EventData, locale: Locale): EventData {
  if (locale === 'pt-BR') return data
  const translation = data.translations?.[locale]
  if (!translation) return data

  const localized = { ...data }
  for (const field of inviteTranslatableFields) {
    const value = translation[field]?.trim()
    if (value) {
      localized[field] = value as never
    }
  }
  return localized
}

/** Galeria demo antiga (Unsplash) ainda gravada no CMS. */
const LEGACY_GALLERY_PHOTOS = [
  'https://images.unsplash.com/photo-1522673606560-13142e25f67d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529636799528-293b665e4a38?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80',
] as const

function isLegacyGalleryPhotos(photos: string[]): boolean {
  if (photos.length !== LEGACY_GALLERY_PHOTOS.length) return false
  return LEGACY_GALLERY_PHOTOS.every((url, i) => photos[i] === url)
}

export function inviteMomentFilled(time: string, venue: string, address: string, image = ''): boolean {
  return Boolean(time.trim() || venue.trim() || address.trim() || image.trim())
}

/**
 * Conteúdo de exemplo do convite `/c/default` (Elaine e Leonardo).
 * Só entra quando o payload ainda não tem a chave `coupleStory`, para o admin poder editar e gravar por cima.
 */
const defaultInviteShowcase = {
  coupleStoryHeading: 'O casal',
  coupleStory:
    'Tem dias que a gente guarda para dividir com quem importa. Elaine e Leonardo preparam este para celebrar o amor, a parceria e os planos que agora têm data, hora e endereço. A sua presença é o que transforma o convite em festa.',
  ceremonyTitle: 'Cerimônia',
  ceremonyTime: '15h00',
  ceremonyVenue: 'Campo da Ford',
  ceremonyAddress: 'Rua Henry Ford - Pres. Altino, Osasco - SP, 06210-108',
  ceremonyMapsLink:
    'https://www.google.com/maps/place/Campo+Da+Ford/@-23.5255801,-46.7652351,17z',
  receptionTitle: 'Recepção',
  receptionTime: '18h00',
  receptionVenue: 'Campo da Ford',
  receptionAddress: 'Rua Henry Ford - Pres. Altino, Osasco - SP, 06210-108',
  receptionMapsLink:
    'https://www.google.com/maps/place/Campo+Da+Ford/@-23.5255801,-46.7652351,17z',
  guestGuideHeading: 'Para os convidados',
  guestGuideLodging:
    'A recepção é no Terraço Itália, na Avenida Ipiranga, 344, República. Quem vem de fora encontra hotel na mesma avenida, a poucos minutos a pé: Delplaza Excelsior (nº 770) e Delplaza Marabá (nº 757). A estação República do metrô também fica ali perto.',
  guestGuideParking:
    'O Edifício Itália tem manobrista na entrada da Avenida Ipiranga, 344. O valet é cobrado à parte, então vale confirmar o valor na chegada. Quem preferir, vem de metrô: a estação República fica a uma curta caminhada.',
  giftsIntro:
    'Sua presença já é o nosso maior presente. Se quiser presentear, clique em Lista de presentes. Se for mais fácil, também pode fazer um Pix.',
  guestGuideDress:
    'Esporte chique. Cores claras e tecidos leves combinam com a tarde. O branco fica reservado à noiva.',
  guestGuideBeauty:
    'Se for se arrumar em salão, reserve a manhã do dia 9. O caminho até Osasco pede uma folga antes da cerimônia.',
  coupleStoryImageUrl:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  ceremonyImageUrl:
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
  receptionImageUrl:
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
  translations: {
    en: {
      coupleStoryHeading: 'The couple',
      coupleStory:
        'Some days are meant to be shared with the people who matter. Elaine and Leonardo prepared this one to celebrate love, partnership and the plans that now have a date, a time and an address. Your presence is what turns the invitation into a party.',
      ceremonyTitle: 'Ceremony',
      ceremonyTime: '3:00 p.m.',
      ceremonyVenue: 'Campo da Ford',
      ceremonyAddress: 'Rua Henry Ford - Pres. Altino, Osasco - SP, 06210-108',
      receptionTitle: 'Reception',
      receptionTime: '6:00 p.m.',
      receptionVenue: 'Campo da Ford',
      receptionAddress: 'Rua Henry Ford - Pres. Altino, Osasco - SP, 06210-108',
      guestGuideHeading: 'For the guests',
      guestGuideLodging:
        'The reception is at Terraço Itália, Avenida Ipiranga 344, in República. Two hotels on the same avenue are a short walk away: Delplaza Excelsior (no. 770) and Delplaza Marabá (no. 757). República metro station is nearby too.',
      guestGuideParking:
        'Edifício Itália has a valet at the entrance on Avenida Ipiranga 344. Valet is charged separately, so confirm the price when you arrive. República metro station is a short walk away.',
      giftsIntro:
        'Your presence is already our best gift. If you would like to give something, click the gift list button. A Pix transfer is welcome too, if that is easier.',
      guestGuideDress:
        'Smart casual. Light colors and light fabrics suit the afternoon. White is reserved for the bride.',
      guestGuideBeauty:
        'If you are getting ready at a salon, book the morning of the 9th. The drive to Osasco needs a margin before the ceremony.',
    },
    es: {
      coupleStoryHeading: 'La pareja',
      coupleStory:
        'Hay días que se guardan para compartir con quien importa. Elaine y Leonardo preparan este para celebrar el amor, la compañía y los planes que ahora tienen fecha, hora y dirección. Tu presencia es lo que convierte la invitación en fiesta.',
      ceremonyTitle: 'Ceremonia',
      ceremonyTime: '15h00',
      ceremonyVenue: 'Campo da Ford',
      ceremonyAddress: 'Rua Henry Ford - Pres. Altino, Osasco - SP, 06210-108',
      receptionTitle: 'Recepción',
      receptionTime: '18h00',
      receptionVenue: 'Campo da Ford',
      receptionAddress: 'Rua Henry Ford - Pres. Altino, Osasco - SP, 06210-108',
      guestGuideHeading: 'Para los invitados',
      guestGuideLodging:
        'La recepción es en Terraço Itália, Avenida Ipiranga 344, en República. Hay hoteles en la misma avenida, a pocos minutos a pie: Delplaza Excelsior (n.º 770) y Delplaza Marabá (n.º 757). La estación de metro República también queda cerca.',
      guestGuideParking:
        'El Edifício Itália tiene valet en la entrada de la Avenida Ipiranga 344. El valet se cobra aparte, así que conviene confirmar el valor al llegar. La estación República queda a una corta caminata.',
      giftsIntro:
        'Tu presencia ya es nuestro mejor regalo. Si quieres hacer un regalo, haz clic en Lista de presentes. Si te queda más fácil, también puedes hacer un Pix.',
      guestGuideDress:
        'Elegante sport. Los colores claros y las telas livianas combinan con la tarde. El blanco queda reservado para la novia.',
      guestGuideBeauty:
        'Si te vas a arreglar en un salón, reserva la mañana del día 9. El camino hasta Osasco pide un margen antes de la ceremonia.',
    },
  } satisfies InviteTranslations,
}

function storedHasKey(stored: unknown, key: string): boolean {
  return Boolean(stored && typeof stored === 'object' && !Array.isArray(stored) && Object.prototype.hasOwnProperty.call(stored, key))
}

/**
 * Exemplo do modelo verde em `/c/default`.
 * Só entra enquanto o payload não tem a chave `inviteTheme`, para o admin poder voltar ao clássico.
 * Os pais e os horários depois da recepção são texto de exemplo, editável no painel.
 */
const defaultSageShowcase = {
  inviteTheme: 'sage' as InviteTheme,
  sageEyebrow: 'Nosso casamento',
  parentsLeftLabel: 'Da noiva',
  parentsLeftNames: 'Família de Elaine',
  parentsRightLabel: 'Do noivo',
  parentsRightNames: 'Família de Leonardo',
  dayProgramHeading: 'Programa do dia',
  dayProgram: [
    { time: '15:00', title: 'Cerimônia na Paróquia Nossa Senhora do Brasil' },
    { time: '18:00', title: 'Recepção no Terraço Itália' },
    { time: '19:30', title: 'Jantar' },
    { time: '21:00', title: 'Corte do bolo' },
    { time: '21:30', title: 'Dança e festa' },
  ] satisfies DayProgramItem[],
  guestbookEnabled: true,
  guestbookHeading: 'Livro de mensagens',
  guestbookSamples: [
    { name: 'Marina', message: 'Que este dia seja leve e cheio de gente querida.' },
    { name: 'Paulo e Helena', message: 'Estaremos aí para brindar com vocês.' },
    { name: 'Amigos da faculdade', message: 'Que a festa tenha a cara de vocês: alegre e sem pressa.' },
  ] satisfies GuestbookSample[],
}

export function withDefaultInviteShowcase(data: EventData, slug: string, stored?: unknown): EventData {
  if (slug !== 'default') return data

  const translations: InviteTranslations = { ...data.translations }
  let next: EventData = data

  if (!storedHasKey(stored, 'coupleStory')) {
    for (const locale of inviteTranslationLocales) {
      translations[locale] = {
        ...(data.translations?.[locale] ?? {}),
        ...(defaultInviteShowcase.translations[locale] ?? {}),
      }
    }
    next = {
      ...data,
      ...defaultInviteShowcase,
      translations,
    }
  }

  if (!storedHasKey(stored, 'coupleStoryImageUrl')) {
    next = {
      ...next,
      coupleStoryImageUrl: defaultInviteShowcase.coupleStoryImageUrl,
      ceremonyImageUrl: defaultInviteShowcase.ceremonyImageUrl,
      receptionImageUrl: defaultInviteShowcase.receptionImageUrl,
    }
  }

  next = replaceDefaultInviteCopy(next)

  if (!storedHasKey(stored, 'inviteTheme')) {
    next = {
      ...next,
      ...defaultSageShowcase,
    }
  }

  return next
}

const legacyDefaultLodging =
  'Osasco tem hotéis perto da Rodovia Castelo Branco. Vale reservar com antecedência: o sábado de maio costuma encher.'
const legacyDefaultParking =
  'O Campo da Ford tem estacionamento no local. Chegue um pouco antes das 15h para estacionar com calma.'

function withShowcaseTranslation(
  data: EventData,
  field: 'guestGuideLodging' | 'guestGuideParking' | 'giftsIntro',
): EventData {
  const translations: InviteTranslations = { ...data.translations }
  for (const locale of inviteTranslationLocales) {
    const current = translations[locale]?.[field]?.trim()
    const sample = defaultInviteShowcase.translations[locale]?.[field]?.trim()
    if (current || !sample) continue
    translations[locale] = { ...(translations[locale] ?? {}), [field]: sample }
  }
  return { ...data, translations }
}

/** Troca o texto antigo de Osasco no convite default pelo Terraço Itália, sem apagar o que já foi reescrito. */
function replaceDefaultInviteCopy(data: EventData): EventData {
  let next = data
  if (next.guestGuideLodging.trim() === legacyDefaultLodging) {
    next = withShowcaseTranslation({ ...next, guestGuideLodging: defaultInviteShowcase.guestGuideLodging }, 'guestGuideLodging')
  }
  if (next.guestGuideParking.trim() === legacyDefaultParking) {
    next = withShowcaseTranslation({ ...next, guestGuideParking: defaultInviteShowcase.guestGuideParking }, 'guestGuideParking')
  }
  if (!next.giftsIntro.trim()) {
    next = withShowcaseTranslation({ ...next, giftsIntro: defaultInviteShowcase.giftsIntro }, 'giftsIntro')
  }
  return next
}

/** Junta o JSON guardado no CMS com os valores por omissão (novas chaves no código). */
export function mergeInvitePayload(stored: unknown): EventData {
  const defaults = structuredClone(eventData)
  if (stored == null || typeof stored !== 'object' || Array.isArray(stored)) {
    return defaults
  }

  const s = stored as StoredPayload
  const merged = { ...defaults, ...s } as EventData & { rsvpWhatsappLink?: string }
  merged.translations = normalizeInviteTranslations(s.translations)
  merged.openingTextColor = typeof s.openingTextColor === 'string' ? s.openingTextColor.trim() : ''
  merged.openingTextOpacity = normalizeOpeningTextOpacity(s.openingTextOpacity)
  merged.inviteTheme = s.inviteTheme === 'sage' ? 'sage' : 'classic'
  merged.sageEyebrow = typeof s.sageEyebrow === 'string' ? s.sageEyebrow : ''
  merged.parentsLeftLabel = typeof s.parentsLeftLabel === 'string' ? s.parentsLeftLabel : ''
  merged.parentsLeftNames = typeof s.parentsLeftNames === 'string' ? s.parentsLeftNames : ''
  merged.parentsRightLabel = typeof s.parentsRightLabel === 'string' ? s.parentsRightLabel : ''
  merged.parentsRightNames = typeof s.parentsRightNames === 'string' ? s.parentsRightNames : ''
  merged.dayProgramHeading = typeof s.dayProgramHeading === 'string' ? s.dayProgramHeading : ''
  merged.dayProgram = normalizeDayProgram(s.dayProgram)
  merged.guestbookEnabled = s.guestbookEnabled === true
  merged.guestbookHeading = typeof s.guestbookHeading === 'string' ? s.guestbookHeading : ''
  merged.guestbookSamples = normalizeGuestbookSamples(s.guestbookSamples)

  /** Payloads antigos ainda apontam para a demo; alinhar à faixa por omissão do código. */
  if (merged.backgroundAudioUrl.trim() === '/audio/from-this-moment-on.mp3') {
    merged.backgroundAudioUrl = defaults.backgroundAudioUrl
  }

  if (isLegacyGalleryPhotos(merged.galleryPhotos)) {
    merged.galleryPhotos = defaults.galleryPhotos
  }

  const hasExplicitNew =
    Object.prototype.hasOwnProperty.call(s, 'rsvpWhatsappPhone') ||
    Object.prototype.hasOwnProperty.call(s, 'rsvpWhatsappMessage')

  if (hasExplicitNew) {
    delete merged.rsvpWhatsappLink
    return merged as EventData
  }

  const link = typeof s.rsvpWhatsappLink === 'string' ? s.rsvpWhatsappLink.trim() : ''
  if (link) {
    const parsed = parseWaMeLink(link)
    if (parsed?.phone) {
      merged.rsvpWhatsappPhone = parsed.phone
      merged.rsvpWhatsappMessage = parsed.message.trim()
        ? parsed.message
        : defaults.rsvpWhatsappMessage
    } else {
      merged.rsvpWhatsappPhone = ''
      merged.rsvpWhatsappMessage = ''
      merged.rsvpWhatsappLink = link
    }
  }

  if (!merged.rsvpWhatsappLink) {
    delete merged.rsvpWhatsappLink
  }

  return merged as EventData
}
