/**
 * Fonte única de preço.
 * O convite digital tem valor único de R$ 50,00. Atualize apenas este arquivo.
 */

export type PricingLocale = 'pt-BR' | 'en' | 'es'

/** Valor único vigente: R$ 50,00. */
export const PROMO = {
  /** Preço em centavos. O nome `PROMO` permanece porque o checkout e o analytics já usam esta constante. */
  priceCents: 5_000,
  /** Chave para sessionStorage do popup. */
  dismissStorageKey: 'offer_unico_padrao_dismissed',
  /** Identificador estável para analytics. */
  planKey: 'unico' as const,
} as const

export function formatPriceBRL(cents: number, locale: PricingLocale): string {
  const value = cents / 100
  if (locale === 'en') {
    return `R$ ${value.toFixed(2)}`
  }
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

type OfferCopy = {
  badge: string
  title: string
  subtitle: string
  sectionEyebrow: string
  sectionTitle: string
  sectionDescription: string
  offerName: string
  offerDescription: string
  offerItems: string[]
  payCta: string
  cta: string
  whatsappMessage: string
  heroCta: string
}

const COPY: Record<PricingLocale, OfferCopy> = {
  'pt-BR': {
    badge: 'Valor único',
    title: 'Convite digital por R$ 50,00',
    subtitle: 'Pague com Mercado Pago ou PIX, ou fale no WhatsApp. O link personalizado sai depois da confirmação.',
    sectionEyebrow: 'Investimento',
    sectionTitle: 'Seu convite digital por R$ 50,00.',
    sectionDescription:
      'Um preço único para o convite personalizado, com abertura animada, trilha, mapa e confirmação por WhatsApp. Pagamento por Mercado Pago ou PIX.',
    offerName: 'Convite digital',
    offerDescription:
      'Convite personalizado com abertura animada, trilha, mapa, confirmação por WhatsApp e experiência pensada para celular.',
    offerItems: [
      '1 página de convite digital personalizado',
      'Abertura animada e trilha sonora',
      'Mapa e botão de WhatsApp',
      'Link exclusivo para compartilhar',
    ],
    payCta: 'Pagar R$ 50,00',
    cta: 'Prefiro falar no WhatsApp',
    whatsappMessage: 'Olá! Quero o convite digital do Convites Diversos por R$ 50,00. Pode me ajudar?',
    heroCta: 'Ver o valor de R$ 50',
  },
  en: {
    badge: 'Single price',
    title: 'Digital invitation for R$ 50.00',
    subtitle: 'Pay with Mercado Pago or PIX, or message us on WhatsApp. Your personalized link is delivered after confirmation.',
    sectionEyebrow: 'Pricing',
    sectionTitle: 'Your digital invitation for R$ 50.00.',
    sectionDescription:
      'One flat price for a personalized invitation with animated opening, soundtrack, map and WhatsApp RSVP. Pay with Mercado Pago or PIX.',
    offerName: 'Digital invitation',
    offerDescription:
      'Personalized invitation with animated opening, soundtrack, map, WhatsApp RSVP and a mobile-first experience.',
    offerItems: [
      'One personalized digital invitation page',
      'Animated opening and soundtrack',
      'Map and WhatsApp button',
      'Exclusive shareable link',
    ],
    payCta: 'Pay R$ 50.00',
    cta: 'Prefer WhatsApp',
    whatsappMessage: 'Hi! I want the Convites Diversos digital invitation for R$ 50.00. Can you help me?',
    heroCta: 'See the R$ 50 price',
  },
  es: {
    badge: 'Precio único',
    title: 'Invitación digital por R$ 50,00',
    subtitle: 'Paga con Mercado Pago o PIX, o escríbenos por WhatsApp. El enlace personalizado sale después de la confirmación.',
    sectionEyebrow: 'Inversión',
    sectionTitle: 'Tu invitación digital por R$ 50,00.',
    sectionDescription:
      'Un solo precio para la invitación personalizada, con apertura animada, música, mapa y confirmación por WhatsApp. Pago con Mercado Pago o PIX.',
    offerName: 'Invitación digital',
    offerDescription:
      'Invitación personalizada con apertura animada, música, mapa, confirmación por WhatsApp y experiencia pensada para celular.',
    offerItems: [
      '1 página de invitación digital personalizada',
      'Apertura animada y música',
      'Mapa y botón de WhatsApp',
      'Enlace exclusivo para compartir',
    ],
    payCta: 'Pagar R$ 50,00',
    cta: 'Prefiero WhatsApp',
    whatsappMessage: '¡Hola! Quiero la invitación digital de Convites Diversos por R$ 50,00. ¿Me ayudas?',
    heroCta: 'Ver el precio de R$ 50',
  },
}

export function getPromoOffer(locale: string) {
  const copy = locale === 'en' ? COPY.en : locale === 'es' ? COPY.es : COPY['pt-BR']
  const pricingLocale: PricingLocale = locale === 'en' || locale === 'es' ? locale : 'pt-BR'
  return {
    key: PROMO.planKey,
    dismissStorageKey: PROMO.dismissStorageKey,
    name: copy.offerName,
    promoPrice: formatPriceBRL(PROMO.priceCents, pricingLocale),
    description: copy.offerDescription,
    items: copy.offerItems,
    whatsappMessage: copy.whatsappMessage,
    payCta: copy.payCta,
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
