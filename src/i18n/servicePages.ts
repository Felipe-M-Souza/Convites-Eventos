import { serviceLandingPages, type ServiceLandingPage } from '../data/serviceLandingPages'
import type { Locale } from './locales'

type OccasionCopy = {
  occasion: string
  title: string
  description: string
  heading: string
  intro: string
}

const enOccasions: Record<string, OccasionCopy> = {
  'aniversario-infantil': {
    occasion: 'kids birthday',
    title: 'Custom Kids Birthday Digital Invitation | Convites Diversos',
    description: 'Animated kids birthday digital invitation with custom theme and easy WhatsApp sharing.',
    heading: 'Custom kids birthday digital invitation',
    intro: 'Light and colorful layouts with envelope opening, personalized text and a link ready to share.',
  },
  '15-anos': {
    occasion: 'quinceañera',
    title: 'Custom Quinceañera Digital Invitation | Convites Diversos',
    description: 'Elegant digital invitation for quinceañeras with animations, custom identity and WhatsApp sharing.',
    heading: 'Custom quinceañera digital invitation',
    intro: 'An elegant presentation with refined identity and a memorable mobile experience.',
  },
  'cha-de-bebe': {
    occasion: 'baby shower',
    title: 'Custom Baby Shower Digital Invitation | Convites Diversos',
    description: 'Delicate digital baby shower invitation with animated opening and personalized details.',
    heading: 'Custom baby shower digital invitation',
    intro: 'Delicate layouts to announce this special moment with personalized details and simple link sharing.',
  },
  'cha-revelacao': {
    occasion: 'gender reveal',
    title: 'Custom Gender Reveal Digital Invitation | Convites Diversos',
    description: 'Digital invitation for gender reveal parties with creative theme, animation and link sharing.',
    heading: 'Custom gender reveal digital invitation',
    intro: 'Creative models to share the surprise with family and friends in a beautiful digital experience.',
  },
  'aniversario-adulto': {
    occasion: 'adult birthday',
    title: 'Custom Adult Birthday Digital Invitation | Convites Diversos',
    description: 'Sophisticated adult birthday digital invitation with interactive experience and easy sharing.',
    heading: 'Custom adult birthday digital invitation',
    intro: 'Modern and elegant design for adult birthdays, focused on style and practical sharing.',
  },
  homenagem: {
    occasion: 'memorial or tribute',
    title: 'Custom Memorial Digital Invitation | Convites Diversos',
    description: 'Respectful and elegant digital invitation for memorials or tributes with custom text.',
    heading: 'Custom memorial digital invitation',
    intro: 'A sensitive way to gather family and friends with clear communication and respectful visuals.',
  },
  casamento: {
    occasion: 'wedding',
    title: 'Custom Wedding Digital Invitation | Convites Diversos',
    description: 'Wedding digital invitation with animated opening, map, RSVP and soundtrack in one complete link.',
    heading: 'Custom wedding digital invitation',
    intro: 'Premium wedding invitations with smooth animations and all important details in one link.',
  },
  bodas: {
    occasion: 'anniversary celebration',
    title: 'Custom Anniversary Digital Invitation | Convites Diversos',
    description: 'Elegant digital invitation for anniversary celebrations with complete customization and easy sharing.',
    heading: 'Custom anniversary digital invitation',
    intro: 'Celebrate anniversaries with an elegant digital invitation designed to move guests and family.',
  },
  'evento-corporativo': {
    occasion: 'corporate event',
    title: 'Custom Corporate Digital Invitation | Convites Diversos',
    description:
      'Corporate digital invitation for launches, company gatherings and business events. Brand-aligned look, RSVP and an easy-to-share link.',
    heading: 'Custom corporate digital invitation',
    intro:
      'Professional invitations for launches, kickoffs, trainings and company gatherings, with brand identity, clear details and fast link distribution.',
  },
}

const esOccasions: Record<string, OccasionCopy> = {
  'aniversario-infantil': {
    occasion: 'cumpleaños infantil',
    title: 'Invitación Digital Cumpleaños Infantil Personalizada | Convites Diversos',
    description: 'Invitación digital infantil animada con tema personalizado y envío fácil por WhatsApp.',
    heading: 'Invitación digital de cumpleaños infantil personalizada',
    intro: 'Diseños livianos y coloridos con apertura de sobre, texto personalizado y enlace listo para compartir.',
  },
  '15-anos': {
    occasion: '15 años',
    title: 'Invitación Digital 15 Años Personalizada | Convites Diversos',
    description: 'Invitación digital para quinceañera con visual elegante, animaciones e identidad exclusiva.',
    heading: 'Invitación digital de 15 años personalizada',
    intro: 'Una presentación elegante para quinceañeras, con identidad visual refinada y experiencia móvil memorable.',
  },
  'cha-de-bebe': {
    occasion: 'baby shower',
    title: 'Invitación Digital Baby Shower Personalizada | Convites Diversos',
    description: 'Invitación digital para baby shower con diseño delicado, apertura animada y detalles personalizados.',
    heading: 'Invitación digital de baby shower personalizada',
    intro: 'Diseños delicados para anunciar este momento especial con detalles personalizados y envío simple por enlace.',
  },
  'cha-revelacao': {
    occasion: 'revelación de género',
    title: 'Invitación Digital Revelación Personalizada | Convites Diversos',
    description: 'Invitación digital para revelación de género con tema creativo, animación y envío por enlace.',
    heading: 'Invitación digital de revelación personalizada',
    intro: 'Modelos creativos para compartir la sorpresa con familia y amigos en una experiencia digital bonita y práctica.',
  },
  'aniversario-adulto': {
    occasion: 'cumpleaños adulto',
    title: 'Invitación Digital Cumpleaños Adulto Personalizada | Convites Diversos',
    description: 'Invitación digital para cumpleaños adulto con estilo sofisticado y experiencia interactiva.',
    heading: 'Invitación digital de cumpleaños adulto personalizada',
    intro: 'Diseño moderno y elegante para cumpleaños adultos, con foco en estilo y practicidad para compartir.',
  },
  homenagem: {
    occasion: 'homenaje',
    title: 'Invitación Digital Homenaje Personalizada | Convites Diversos',
    description: 'Invitación digital de homenaje con visual respetuoso y elegante, personalizada para familiares.',
    heading: 'Invitación digital de homenaje personalizada',
    intro: 'Una forma sensible de reunir familiares y amigos, con comunicación clara y lenguaje visual respetuoso.',
  },
  casamento: {
    occasion: 'boda',
    title: 'Invitación Digital Boda Personalizada | Convites Diversos',
    description: 'Invitación digital de boda con apertura animada, mapa, RSVP y música en un enlace completo.',
    heading: 'Invitación digital de boda personalizada',
    intro: 'Invitaciones de boda con apariencia premium, animaciones suaves y todos los detalles importantes en un enlace.',
  },
  bodas: {
    occasion: 'aniversario',
    title: 'Invitación Digital Aniversario Personalizada | Convites Diversos',
    description: 'Invitación digital para aniversarios con layout elegante, personalización completa y fácil envío.',
    heading: 'Invitación digital de aniversario personalizada',
    intro: 'Celebra aniversarios con una invitación digital elegante, fácil de compartir y pensada para emocionar.',
  },
  'evento-corporativo': {
    occasion: 'evento corporativo',
    title: 'Invitación Digital Corporativa Personalizada | Convites Diversos',
    description:
      'Invitación digital corporativa para lanzamientos, convivencias y eventos de empresa. Visual alineado a la marca, RSVP y enlace fácil de distribuir.',
    heading: 'Invitación digital corporativa personalizada',
    intro:
      'Invitaciones profesionales para lanzamientos, kickoffs, capacitaciones y convivencias, con identidad de marca, información clara y distribución rápida por enlace.',
  },
}

function buildLocalizedPages(locale: Locale, source: Record<string, OccasionCopy>): ServiceLandingPage[] {
  return serviceLandingPages.map((page) => {
    const copy = source[page.slug]
    if (!copy) return page
    return {
      ...page,
      ...copy,
      bullets:
        locale === 'en'
          ? [
              'Animated envelope opening for a strong first impression.',
              'Map, RSVP, countdown, photos and music in one page.',
              'A single link ready to share on WhatsApp, Instagram and email.',
            ]
          : [
              'Apertura animada en sobre para un primer impacto especial.',
              'Mapa, confirmación, cuenta regresiva, fotos y música en una página.',
              'Un enlace único listo para compartir por WhatsApp, Instagram y email.',
            ],
      faqs:
        locale === 'en'
          ? [
              {
                question: `Can the digital invitation for ${copy.occasion} include all event details?`,
                answer: 'Yes. It can include date, time, venue, map, RSVP, gallery and other important information in one link.',
              },
              {
                question: 'Can the invitation be shared by WhatsApp?',
                answer: 'Yes. The final delivery is a responsive link ready to share on WhatsApp, social media or direct message.',
              },
              {
                question: 'Can the invitation have an animated opening?',
                answer: 'Yes. The animated envelope opening is part of the experience and enhances the first contact with the invitation.',
              },
              {
                question: 'Can it include countdown, photos and music?',
                answer: 'Yes. These resources make the invitation more complete, emotional and memorable for guests.',
              },
            ]
          : [
              {
                question: `¿La invitación digital para ${copy.occasion} puede reunir todos los detalles del evento?`,
                answer: 'Sí. Puede incluir fecha, horario, lugar, mapa, confirmación, galería y otra información importante en un solo enlace.',
              },
              {
                question: '¿La invitación se puede compartir por WhatsApp?',
                answer: 'Sí. La entrega final es un enlace responsive listo para compartir por WhatsApp, redes sociales o mensaje directo.',
              },
              {
                question: '¿La invitación puede tener apertura animada?',
                answer: 'Sí. La apertura animada en sobre forma parte de la experiencia y valoriza el primer contacto con la invitación.',
              },
              {
                question: '¿Puede incluir cuenta regresiva, fotos y música?',
                answer: 'Sí. Estos recursos hacen la invitación más completa, emocional y memorable para los invitados.',
              },
            ],
    }
  })
}

export function getLocalizedServiceLandingPages(locale: Locale): ServiceLandingPage[] {
  if (locale === 'en') return buildLocalizedPages(locale, enOccasions)
  if (locale === 'es') return buildLocalizedPages(locale, esOccasions)
  return serviceLandingPages
}

export function getLocalizedServiceLandingPage(slug: string, locale: Locale): ServiceLandingPage | undefined {
  return getLocalizedServiceLandingPages(locale).find((page) => page.slug === slug)
}
