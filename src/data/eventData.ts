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
  'guestUploadsTitle',
  'guestUploadsDescription',
  'footerThanks',
  'footerContact',
] as const

export type InviteTranslatableField = (typeof inviteTranslatableFields)[number]
export type InviteTranslations = Partial<Record<InviteTranslationLocale, Partial<Record<InviteTranslatableField, string>>>>

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
   * `seal` = selo dourado clássico; `soccer_goal` = trave + animação de bola ao golo (mesma âncora do selo).
   * O slug `san-barssoti` também ativa este modo no código até gravares a opção no CMS.
   */
  openingInteractionMode: 'seal' as 'seal' | 'soccer_goal',
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
    seoTitle: 'Convite digital aniversário 50 anos | Convites Diversos',
    seoDescription:
      'Convite digital para celebrar os 50 anos: data, local, mapa e confirmação por WhatsApp num único link.',
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

/** Junta o JSON guardado no CMS com os valores por omissão (novas chaves no código). */
export function mergeInvitePayload(stored: unknown): EventData {
  const defaults = structuredClone(eventData)
  if (stored == null || typeof stored !== 'object' || Array.isArray(stored)) {
    return defaults
  }

  const s = stored as StoredPayload
  const merged = { ...defaults, ...s } as EventData & { rsvpWhatsappLink?: string }
  merged.translations = normalizeInviteTranslations(s.translations)

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
