/**
 * Fonte única de preços e urgência promocional.
 * Atualize apenas este arquivo para refletir em home, landings e popup.
 */

export type PricingLocale = 'pt-BR' | 'en' | 'es'

/** Oferta única vigente: R$ 50,00 até 15/08/2026 (inclusive, horário de Brasília). */
export const PROMO = {
  /** Preço promocional em centavos. */
  priceCents: 5_000,
  /** Preço de referência (riscado) em centavos. */
  fromPriceCents: 8_000,
  /** Início da vigência (YYYY-MM-DD, America/Sao_Paulo). */
  validFrom: '2026-07-13',
  /** Fim da vigência inclusive (YYYY-MM-DD, America/Sao_Paulo). */
  validUntil: '2026-08-15',
  /** Chave para sessionStorage do popup (muda a cada campanha). */
  dismissStorageKey: 'promo_unico_ago2026_dismissed',
  /** Identificador estável para analytics. */
  planKey: 'unico' as const,
} as const

function parseSaoPauloDayBoundary(isoDate: string, endOfDay: boolean): number {
  // Offset fixo -03:00 cobre o calendário comercial BR nesta campanha (sem DST).
  const suffix = endOfDay ? 'T23:59:59.999-03:00' : 'T00:00:00.000-03:00'
  return new Date(`${isoDate}${suffix}`).getTime()
}

/** Retorna true enquanto a oferta única estiver dentro da vigência. */
export function isPromoActive(now: Date = new Date()): boolean {
  const t = now.getTime()
  return t >= parseSaoPauloDayBoundary(PROMO.validFrom, false) && t <= parseSaoPauloDayBoundary(PROMO.validUntil, true)
}

export function formatPriceBRL(cents: number, locale: PricingLocale): string {
  const value = cents / 100
  if (locale === 'en') {
    return `R$ ${value.toFixed(2)}`
  }
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

type PromoUiCopy = {
  badge: string
  title: string
  subtitle: string
  sectionEyebrow: string
  sectionTitle: string
  sectionDescription: string
  offerName: string
  offerDescription: string
  offerItems: string[]
  fromLabel: string
  validUntilLabel: string
  cta: string
  whatsappMessage: string
  heroCta: string
}

const COPY: Record<PricingLocale, PromoUiCopy> = {
  'pt-BR': {
    badge: 'Oferta por tempo limitado',
    title: 'Convite digital por R$ 50,00',
    subtitle:
      'Valor único promocional válido até 15/08. Fale no WhatsApp e garanta o seu convite digital personalizado.',
    sectionEyebrow: 'Oferta especial',
    sectionTitle: 'Valor único de R$ 50,00 até 15/08.',
    sectionDescription:
      'Promoção por tempo limitado: um preço único para o seu convite digital personalizado, com atendimento direto no WhatsApp.',
    offerName: 'Convite digital',
    offerDescription:
      'Convite personalizado com abertura animada, trilha, mapa, confirmação por WhatsApp e experiência pensada para celular.',
    offerItems: [
      '1 página de convite digital personalizado',
      'Abertura animada e trilha sonora',
      'Mapa e botão de WhatsApp',
      'Link exclusivo para compartilhar',
    ],
    fromLabel: 'de',
    validUntilLabel: 'Válido até 15/08',
    cta: 'Quero este preço no WhatsApp',
    whatsappMessage:
      'Olá! Vi a oferta de valor único no Convites Diversos e quero o convite digital por R$ 50,00 (válido até 15/08). Pode me ajudar?',
    heroCta: 'Ver oferta de R$ 50',
  },
  en: {
    badge: 'Limited-time offer',
    title: 'Digital invitation for R$ 50.00',
    subtitle:
      'Single promotional price valid until August 15. Talk to us on WhatsApp to lock in your personalized digital invitation.',
    sectionEyebrow: 'Special offer',
    sectionTitle: 'Single price of R$ 50.00 until August 15.',
    sectionDescription:
      'Limited-time promotion: one flat price for your personalized digital invitation, with direct WhatsApp support.',
    offerName: 'Digital invitation',
    offerDescription:
      'Personalized invitation with animated opening, soundtrack, map, WhatsApp RSVP and a mobile-first experience.',
    offerItems: [
      'One personalized digital invitation page',
      'Animated opening and soundtrack',
      'Map and WhatsApp button',
      'Exclusive shareable link',
    ],
    fromLabel: 'was',
    validUntilLabel: 'Valid until August 15',
    cta: 'Get this price on WhatsApp',
    whatsappMessage:
      'Hi! I saw the single-price offer on Convites Diversos and I want the digital invitation for R$ 50.00 (valid until August 15). Can you help me?',
    heroCta: 'See R$ 50 offer',
  },
  es: {
    badge: 'Oferta por tiempo limitado',
    title: 'Invitación digital por R$ 50,00',
    subtitle:
      'Precio único promocional válido hasta el 15 de agosto. Háblanos por WhatsApp y asegura tu invitación digital personalizada.',
    sectionEyebrow: 'Oferta especial',
    sectionTitle: 'Precio único de R$ 50,00 hasta el 15/08.',
    sectionDescription:
      'Promoción por tiempo limitado: un solo precio para tu invitación digital personalizada, con atención directa por WhatsApp.',
    offerName: 'Invitación digital',
    offerDescription:
      'Invitación personalizada con apertura animada, música, mapa, confirmación por WhatsApp y experiencia pensada para celular.',
    offerItems: [
      '1 página de invitación digital personalizada',
      'Apertura animada y música',
      'Mapa y botón de WhatsApp',
      'Enlace exclusivo para compartir',
    ],
    fromLabel: 'antes',
    validUntilLabel: 'Válido hasta el 15/08',
    cta: 'Quiero este precio por WhatsApp',
    whatsappMessage:
      '¡Hola! Vi la oferta de precio único en Convites Diversos y quiero la invitación digital por R$ 50,00 (válida hasta el 15/08). ¿Me ayudas?',
    heroCta: 'Ver oferta de R$ 50',
  },
}

export function getPromoCopy(locale: string): PromoUiCopy {
  if (locale === 'en') return COPY.en
  if (locale === 'es') return COPY.es
  return COPY['pt-BR']
}

export function getPromoOffer(locale: string) {
  const copy = getPromoCopy(locale)
  const pricingLocale: PricingLocale = locale === 'en' || locale === 'es' ? locale : 'pt-BR'
  return {
    key: PROMO.planKey,
    name: copy.offerName,
    price: formatPriceBRL(PROMO.fromPriceCents, pricingLocale),
    promoPrice: formatPriceBRL(PROMO.priceCents, pricingLocale),
    description: copy.offerDescription,
    items: copy.offerItems,
    whatsappMessage: copy.whatsappMessage,
    validUntilLabel: copy.validUntilLabel,
    fromLabel: copy.fromLabel,
    cta: copy.cta,
    badge: copy.badge,
    title: copy.title,
    subtitle: copy.subtitle,
    sectionEyebrow: copy.sectionEyebrow,
    sectionTitle: copy.sectionTitle,
    sectionDescription: copy.sectionDescription,
    heroCta: copy.heroCta,
  }
}
