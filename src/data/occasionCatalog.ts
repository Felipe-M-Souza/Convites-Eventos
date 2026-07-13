/**
 * Catálogo comercial de tipos de convite.
 * Usado em /modelos — sem depender de demos interativos quebrados.
 */

export type OccasionCatalogItem = {
  id: string
  /** Slug da landing SEO, se existir. */
  serviceSlug?: string
  accent: string
  title: Record<'pt-BR' | 'en' | 'es', string>
  summary: Record<'pt-BR' | 'en' | 'es', string>
  highlights: Record<'pt-BR' | 'en' | 'es', string[]>
}

export const occasionCatalog: OccasionCatalogItem[] = [
  {
    id: 'casamento',
    serviceSlug: 'casamento',
    accent: '#C4A574',
    title: {
      'pt-BR': 'Casamento',
      en: 'Wedding',
      es: 'Boda',
    },
    summary: {
      'pt-BR': 'Convite elegante com abertura animada, mapa, RSVP e trilha para o grande dia.',
      en: 'Elegant invitation with animated opening, map, RSVP and soundtrack for the big day.',
      es: 'Invitación elegante con apertura animada, mapa, RSVP y música para el gran día.',
    },
    highlights: {
      'pt-BR': ['Visual romântico e sofisticado', 'Mapa e confirmação no WhatsApp', 'Link exclusivo para compartilhar'],
      en: ['Romantic and refined look', 'Map and WhatsApp RSVP', 'Exclusive shareable link'],
      es: ['Visual romántico y sofisticado', 'Mapa y confirmación por WhatsApp', 'Enlace exclusivo para compartir'],
    },
  },
  {
    id: '15-anos',
    serviceSlug: '15-anos',
    accent: '#B76E79',
    title: {
      'pt-BR': '15 anos',
      en: 'Quinceañera',
      es: '15 años',
    },
    summary: {
      'pt-BR': 'Apresentação marcante para debutante, com identidade visual refinada e clima de festa.',
      en: 'A striking quinceañera presentation with refined identity and celebration mood.',
      es: 'Presentación marcante para quinceañera, con identidad refinada y clima de fiesta.',
    },
    highlights: {
      'pt-BR': ['Estilo premium para a noite especial', 'Fotos, música e contagem regressiva', 'Envio fácil por WhatsApp'],
      en: ['Premium style for the special night', 'Photos, music and countdown', 'Easy WhatsApp sharing'],
      es: ['Estilo premium para la noche especial', 'Fotos, música y cuenta regresiva', 'Envío fácil por WhatsApp'],
    },
  },
  {
    id: 'aniversario-infantil',
    serviceSlug: 'aniversario-infantil',
    accent: '#7BA3A8',
    title: {
      'pt-BR': 'Aniversário infantil',
      en: 'Kids birthday',
      es: 'Cumpleaños infantil',
    },
    summary: {
      'pt-BR': 'Modelos leves e coloridos, alinhados ao tema da festa e fáceis de enviar aos convidados.',
      en: 'Light and colorful models aligned with the party theme and easy to send to guests.',
      es: 'Modelos livianos y coloridos, alineados al tema de la fiesta y fáciles de enviar.',
    },
    highlights: {
      'pt-BR': ['Temas lúdicos e personalizados', 'Dados da festa no mesmo link', 'Experiência pensada para celular'],
      en: ['Playful custom themes', 'Party details in one link', 'Mobile-first experience'],
      es: ['Temas lúdicos y personalizados', 'Datos de la fiesta en el mismo enlace', 'Experiencia pensada para celular'],
    },
  },
  {
    id: 'aniversario-adulto',
    serviceSlug: 'aniversario-adulto',
    accent: '#8B7355',
    title: {
      'pt-BR': 'Aniversário adulto',
      en: 'Adult birthday',
      es: 'Cumpleaños adulto',
    },
    summary: {
      'pt-BR': 'Visual moderno e sofisticado para celebrar com estilo, clareza e praticidade.',
      en: 'A modern and sophisticated look to celebrate with style, clarity and practicality.',
      es: 'Visual moderno y sofisticado para celebrar con estilo, claridad y practicidad.',
    },
    highlights: {
      'pt-BR': ['Identidade alinhada ao aniversariante', 'Mapa, horário e confirmação', 'Compartilhamento em um toque'],
      en: ['Identity matched to the birthday person', 'Map, time and RSVP', 'One-tap sharing'],
      es: ['Identidad alineada al cumpleañero', 'Mapa, horario y confirmación', 'Compartir con un toque'],
    },
  },
  {
    id: 'cha-de-bebe',
    serviceSlug: 'cha-de-bebe',
    accent: '#A8B5A0',
    title: {
      'pt-BR': 'Chá de bebê',
      en: 'Baby shower',
      es: 'Baby shower',
    },
    summary: {
      'pt-BR': 'Convite delicado para reunir família e amigos com carinho e todas as informações no link.',
      en: 'A delicate invitation to gather family and friends with care and all details in one link.',
      es: 'Invitación delicada para reunir familia y amigos con cariño y toda la información en el enlace.',
    },
    highlights: {
      'pt-BR': ['Clima suave e acolhedor', 'Detalhes do evento organizados', 'Pronto para WhatsApp e Instagram'],
      en: ['Soft and welcoming mood', 'Organized event details', 'Ready for WhatsApp and Instagram'],
      es: ['Clima suave y acogedor', 'Detalles del evento organizados', 'Listo para WhatsApp e Instagram'],
    },
  },
  {
    id: 'cha-revelacao',
    serviceSlug: 'cha-revelacao',
    accent: '#9AA7C1',
    title: {
      'pt-BR': 'Chá revelação',
      en: 'Gender reveal',
      es: 'Revelación de sexo',
    },
    summary: {
      'pt-BR': 'Modelos criativos para anunciar a surpresa com emoção e uma experiência memorável.',
      en: 'Creative models to announce the surprise with emotion and a memorable experience.',
      es: 'Modelos creativos para anunciar la sorpresa con emoción y una experiencia memorable.',
    },
    highlights: {
      'pt-BR': ['Tema criativo e personalizado', 'Contagem regressiva e fotos', 'Link único para o convite'],
      en: ['Creative custom theme', 'Countdown and photos', 'Unique invitation link'],
      es: ['Tema creativo y personalizado', 'Cuenta regresiva y fotos', 'Enlace único para la invitación'],
    },
  },
  {
    id: 'bodas',
    serviceSlug: 'bodas',
    accent: '#BFA46F',
    title: {
      'pt-BR': 'Bodas',
      en: 'Anniversary',
      es: 'Aniversario de boda',
    },
    summary: {
      'pt-BR': 'Celebre bodas de prata, ouro e outras datas com um convite elegante e emocional.',
      en: 'Celebrate silver, gold and other anniversaries with an elegant and emotional invitation.',
      es: 'Celebra aniversarios de plata, oro y otras fechas con una invitación elegante y emotiva.',
    },
    highlights: {
      'pt-BR': ['Tom nostálgico e sofisticado', 'Informações completas do encontro', 'Compartilhamento simples com a família'],
      en: ['Nostalgic and refined tone', 'Complete gathering details', 'Simple sharing with family'],
      es: ['Tono nostálgico y sofisticado', 'Información completa del encuentro', 'Compartir simple con la familia'],
    },
  },
  {
    id: 'homenagem',
    serviceSlug: 'homenagem',
    accent: '#7A7A72',
    title: {
      'pt-BR': 'Homenagem',
      en: 'Tribute / memorial',
      es: 'Homenaje',
    },
    summary: {
      'pt-BR': 'Formato respeitoso e cuidadoso para reunir pessoas em momentos de memória e gratidão.',
      en: 'A respectful and careful format to gather people in moments of memory and gratitude.',
      es: 'Formato respetuoso y cuidadoso para reunir personas en momentos de memoria y gratitud.',
    },
    highlights: {
      'pt-BR': ['Visual discreto e elegante', 'Textos personalizados com sensibilidade', 'Comunicação clara para a família'],
      en: ['Discreet and elegant visuals', 'Sensitive personalized text', 'Clear communication for family'],
      es: ['Visual discreto y elegante', 'Textos personalizados con sensibilidad', 'Comunicación clara para la familia'],
    },
  },
  {
    id: 'evento-corporativo',
    accent: '#5C6B73',
    title: {
      'pt-BR': 'Evento corporativo',
      en: 'Corporate event',
      es: 'Evento corporativo',
    },
    summary: {
      'pt-BR': 'Convite profissional para lançamentos, confraternizações e encontros de empresa.',
      en: 'A professional invitation for launches, company gatherings and corporate events.',
      es: 'Invitación profesional para lanzamientos, convivencias y encuentros de empresa.',
    },
    highlights: {
      'pt-BR': ['Visual alinhado à marca', 'Informações objetivas e claras', 'Link fácil de distribuir'],
      en: ['Brand-aligned look', 'Clear and objective details', 'Easy-to-distribute link'],
      es: ['Visual alineado a la marca', 'Información objetiva y clara', 'Enlace fácil de distribuir'],
    },
  },
]

export function getLocalizedCatalogItem(item: OccasionCatalogItem, locale: string) {
  const lang = locale === 'en' || locale === 'es' ? locale : 'pt-BR'
  return {
    id: item.id,
    serviceSlug: item.serviceSlug,
    accent: item.accent,
    title: item.title[lang],
    summary: item.summary[lang],
    highlights: item.highlights[lang],
  }
}
