import type { Locale } from './locales'

type PortfolioContent = {
  highlights: Array<{ title: string; description: string }>
  sections: string[]
  process: string[]
  seoOccasions: Array<{ label: string; href: string }>
  trustSignals: Array<{ title: string; description: string }>
  faqs: Array<{ question: string; answer: string }>
  contactEmailSubject: string
  contactEmailBody: string
  contactWhatsappMessage: string
}

const content: Record<Locale, PortfolioContent> = {
  'pt-BR': {
    highlights: [
      {
        title: 'Experiência memorável',
        description: 'Convites com abertura em envelope, transições suaves e visual elegante para valorizar o primeiro impacto.',
      },
      {
        title: 'Tudo no mesmo link',
        description: 'Informações do evento, mapa, confirmação via WhatsApp, contagem regressiva, música e galeria de fotos no mesmo lugar.',
      },
      {
        title: 'Personalização para cada ocasião',
        description: 'Cada projeto recebe identidade própria, com link exclusivo e estrutura pensada para mobile e compartilhamento.',
      },
    ],
    sections: [
      'Abertura em estilo envelope para criar uma apresentação sofisticada.',
      'Página responsiva com data, local, mapa, confirmação de presença e contagem regressiva.',
      'Galeria de fotos, trilha sonora e identidade visual alinhadas ao momento celebrado.',
    ],
    process: [
      'Definimos o estilo visual e reunimos textos, fotos e referências para a ocasião.',
      'Montamos o convite com navegação fluida, identidade personalizada, contagem regressiva e versão para celular.',
      'Entrego o link final pronto para compartilhamento com convidados, familiares ou homenageados, com fotos, música e recursos do evento.',
    ],
    seoOccasions: [
      { label: 'Convite digital aniversário infantil', href: '/convite-digital/aniversario-infantil' },
      { label: 'Convite digital 15 anos', href: '/convite-digital/15-anos' },
      { label: 'Convite digital chá de bebê', href: '/convite-digital/cha-de-bebe' },
      { label: 'Convite digital chá revelação', href: '/convite-digital/cha-revelacao' },
      { label: 'Convite digital aniversário adulto', href: '/convite-digital/aniversario-adulto' },
      { label: 'Convite digital homenagem', href: '/convite-digital/homenagem' },
      { label: 'Convite digital casamento', href: '/convite-digital/casamento' },
      { label: 'Convite digital bodas', href: '/convite-digital/bodas' },
    ],
    trustSignals: [
      {
        title: 'Experiência completa no mesmo link',
        description:
          'O convite pode reunir abertura animada, contagem regressiva, fotos, música, mapa e confirmação de presença em uma navegação fluida.',
      },
      {
        title: 'Pensado para compartilhar com facilidade',
        description:
          'O formato por link facilita o envio no WhatsApp, Instagram e outros canais, sem complicar para os convidados.',
      },
      {
        title: 'Leitura otimizada no celular',
        description:
          'A estrutura é planejada para funcionar bem em mobile, com visual elegante e acesso simples às informações importantes.',
      },
    ],
    faqs: [
      {
        question: 'O que um convite digital da Convites Diversos pode incluir?',
        answer:
          'Os convites podem incluir abertura animada, data, horário, local, mapa, confirmação por WhatsApp, contagem regressiva, galeria de fotos e música.',
      },
      {
        question: 'O convite funciona bem no celular?',
        answer:
          'Sim. A experiência é pensada para mobile, com leitura confortável, navegação fluida e compartilhamento simples por link.',
      },
      {
        question: 'Posso usar o mesmo convite para diferentes ocasiões?',
        answer:
          'Sim. A estrutura é adaptada para casamento, bodas, aniversário infantil, 15 anos, chá de bebê, chá revelação, homenagem e outras celebrações.',
      },
      {
        question: 'Como o convite é entregue para compartilhar com os convidados?',
        answer:
          'Após a finalização, o convite fica disponível em um link pronto para ser enviado por WhatsApp, redes sociais, e-mail ou mensagem direta.',
      },
    ],
    contactEmailSubject: 'Orçamento — convite digital',
    contactEmailBody:
      'Olá,\n\nGostaria de solicitar um orçamento para convite digital.\n\nNome:\nData do evento:\nTipo de celebração:\n\nObrigado/a.',
    contactWhatsappMessage: 'Olá! Gostaria de um orçamento para convite digital pela Convites Diversos.',
  },
  en: {
    highlights: [
      {
        title: 'Memorable experience',
        description: 'Invitations with envelope opening, smooth transitions and elegant visuals to make the first impression count.',
      },
      {
        title: 'Everything in one link',
        description: 'Event details, map, WhatsApp RSVP, countdown, music and photo gallery in one place.',
      },
      {
        title: 'Personalized for each occasion',
        description: 'Each project receives its own identity, exclusive link and mobile-first sharing experience.',
      },
    ],
    sections: [
      'Envelope-style opening to create a sophisticated presentation.',
      'Responsive page with date, venue, map, RSVP and countdown.',
      'Photo gallery, soundtrack and visual identity aligned with the celebration.',
    ],
    process: [
      'We define the visual style and gather texts, photos and references for the occasion.',
      'We build the invitation with fluid navigation, custom identity, countdown and mobile experience.',
      'You receive the final link ready to share with guests, family or honorees, including photos, music and event resources.',
    ],
    seoOccasions: [
      { label: 'Kids birthday digital invitation', href: '/convite-digital/aniversario-infantil' },
      { label: 'Quinceañera digital invitation', href: '/convite-digital/15-anos' },
      { label: 'Baby shower digital invitation', href: '/convite-digital/cha-de-bebe' },
      { label: 'Gender reveal digital invitation', href: '/convite-digital/cha-revelacao' },
      { label: 'Adult birthday digital invitation', href: '/convite-digital/aniversario-adulto' },
      { label: 'Memorial digital invitation', href: '/convite-digital/homenagem' },
      { label: 'Wedding digital invitation', href: '/convite-digital/casamento' },
      { label: 'Anniversary digital invitation', href: '/convite-digital/bodas' },
    ],
    trustSignals: [
      {
        title: 'Complete experience in one link',
        description:
          'The invitation can combine animated opening, countdown, photos, music, map and RSVP in a fluid experience.',
      },
      {
        title: 'Designed for easy sharing',
        description:
          'The link format makes sharing on WhatsApp, Instagram and other channels simple for everyone.',
      },
      {
        title: 'Optimized for mobile reading',
        description:
          'The structure is planned for comfortable mobile use, with elegant visuals and easy access to key information.',
      },
    ],
    faqs: [
      {
        question: 'What can a Convites Diversos digital invitation include?',
        answer:
          'Invitations can include animated opening, date, time, venue, map, WhatsApp RSVP, countdown, photo gallery and music.',
      },
      {
        question: 'Does the invitation work well on mobile?',
        answer:
          'Yes. The experience is mobile-first, with comfortable reading, fluid navigation and simple link sharing.',
      },
      {
        question: 'Can I use the same structure for different occasions?',
        answer:
          'Yes. The structure can be adapted for weddings, anniversaries, birthdays, baby showers, memorials and other celebrations.',
      },
      {
        question: 'How is the invitation delivered?',
        answer:
          'After approval, the invitation is available as a link ready to share by WhatsApp, social media, email or direct message.',
      },
    ],
    contactEmailSubject: 'Quote — digital invitation',
    contactEmailBody:
      'Hello,\n\nI would like to request a quote for a digital invitation.\n\nName:\nEvent date:\nCelebration type:\n\nThank you.',
    contactWhatsappMessage: 'Hello! I would like a quote for a digital invitation by Convites Diversos.',
  },
  es: {
    highlights: [
      {
        title: 'Experiencia memorable',
        description: 'Invitaciones con apertura de sobre, transiciones suaves y visual elegante para valorar el primer impacto.',
      },
      {
        title: 'Todo en un solo enlace',
        description: 'Detalles del evento, mapa, RSVP por WhatsApp, cuenta regresiva, música y galería de fotos en un mismo lugar.',
      },
      {
        title: 'Personalización para cada ocasión',
        description: 'Cada proyecto recibe identidad propia, enlace exclusivo y experiencia pensada para celular y compartir.',
      },
    ],
    sections: [
      'Apertura estilo sobre para crear una presentación sofisticada.',
      'Página responsive con fecha, lugar, mapa, confirmación de asistencia y cuenta regresiva.',
      'Galería de fotos, música e identidad visual alineadas con el momento celebrado.',
    ],
    process: [
      'Definimos el estilo visual y reunimos textos, fotos y referencias para la ocasión.',
      'Montamos la invitación con navegación fluida, identidad personalizada, cuenta regresiva y versión móvil.',
      'Entregamos el enlace final listo para compartir con invitados, familiares u homenajeados, con fotos, música y recursos del evento.',
    ],
    seoOccasions: [
      { label: 'Invitación digital cumpleaños infantil', href: '/convite-digital/aniversario-infantil' },
      { label: 'Invitación digital 15 años', href: '/convite-digital/15-anos' },
      { label: 'Invitación digital baby shower', href: '/convite-digital/cha-de-bebe' },
      { label: 'Invitación digital revelación', href: '/convite-digital/cha-revelacao' },
      { label: 'Invitación digital cumpleaños adulto', href: '/convite-digital/aniversario-adulto' },
      { label: 'Invitación digital homenaje', href: '/convite-digital/homenagem' },
      { label: 'Invitación digital boda', href: '/convite-digital/casamento' },
      { label: 'Invitación digital aniversario', href: '/convite-digital/bodas' },
    ],
    trustSignals: [
      {
        title: 'Experiencia completa en un enlace',
        description:
          'La invitación puede reunir apertura animada, cuenta regresiva, fotos, música, mapa y confirmación de asistencia.',
      },
      {
        title: 'Pensado para compartir fácilmente',
        description:
          'El formato por enlace facilita el envío por WhatsApp, Instagram y otros canales sin complicar a los invitados.',
      },
      {
        title: 'Lectura optimizada en celular',
        description:
          'La estructura está pensada para mobile, con visual elegante y acceso simple a la información importante.',
      },
    ],
    faqs: [
      {
        question: '¿Qué puede incluir una invitación digital de Convites Diversos?',
        answer:
          'Puede incluir apertura animada, fecha, horario, lugar, mapa, confirmación por WhatsApp, cuenta regresiva, galería de fotos y música.',
      },
      {
        question: '¿La invitación funciona bien en celular?',
        answer:
          'Sí. La experiencia está pensada para mobile, con lectura cómoda, navegación fluida y fácil envío por enlace.',
      },
      {
        question: '¿Puedo usar la misma estructura para distintas ocasiones?',
        answer:
          'Sí. La estructura se adapta a bodas, aniversarios, cumpleaños, baby showers, homenajes y otras celebraciones.',
      },
      {
        question: '¿Cómo se entrega la invitación?',
        answer:
          'Después de finalizar, la invitación queda disponible en un enlace listo para compartir por WhatsApp, redes sociales, email o mensaje directo.',
      },
    ],
    contactEmailSubject: 'Presupuesto — invitación digital',
    contactEmailBody:
      'Hola,\n\nMe gustaría solicitar un presupuesto para una invitación digital.\n\nNombre:\nFecha del evento:\nTipo de celebración:\n\nGracias.',
    contactWhatsappMessage: '¡Hola! Me gustaría un presupuesto para una invitación digital de Convites Diversos.',
  },
}

export function getPortfolioContent(locale: Locale) {
  return content[locale] ?? content['pt-BR']
}
