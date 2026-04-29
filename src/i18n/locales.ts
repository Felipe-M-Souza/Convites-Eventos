export const supportedLocales = ['pt-BR', 'en', 'es'] as const

export type Locale = (typeof supportedLocales)[number]

export const localeLabels: Record<Locale, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
}

const localeAliases: Record<string, Locale> = {
  pt: 'pt-BR',
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-BR',
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  es: 'es',
  'es-es': 'es',
  'es-mx': 'es',
  'es-ar': 'es',
}

export type TranslationKey =
  | 'language.label'
  | 'language.short.pt-BR'
  | 'language.short.en'
  | 'language.short.es'
  | 'common.backHome'
  | 'common.loadingInvite'
  | 'common.inviteNotFound'
  | 'common.inviteNotFoundDescription'
  | 'invite.openingFallback'
  | 'invite.heroContinue'
  | 'invite.messageHeading'
  | 'invite.countdownHeading'
  | 'invite.countdownDescription'
  | 'invite.countdown.days'
  | 'invite.countdown.hours'
  | 'invite.countdown.minutes'
  | 'invite.countdown.seconds'
  | 'invite.detailsHeading'
  | 'invite.detailsDateTime'
  | 'invite.detailsVenue'
  | 'invite.detailsDressCode'
  | 'invite.detailsNotes'
  | 'invite.mapButton'
  | 'invite.rsvpButton'
  | 'invite.giftsButton'
  | 'invite.galleryHeading'
  | 'invite.galleryDescription'
  | 'guestUploads.defaultTitle'
  | 'guestUploads.defaultDescription'
  | 'guestUploads.emptyCount'
  | 'guestUploads.singleCount'
  | 'guestUploads.multipleCount'
  | 'guestUploads.loading'
  | 'guestUploads.empty'
  | 'guestUploads.formTitle'
  | 'guestUploads.formDescription'
  | 'guestUploads.mobileHint'
  | 'guestUploads.name'
  | 'guestUploads.caption'
  | 'guestUploads.optional'
  | 'guestUploads.file'
  | 'guestUploads.constraints'
  | 'guestUploads.submit'
  | 'guestUploads.submitting'
  | 'guestUploads.readingFile'
  | 'guestUploads.chooseFile'
  | 'guestUploads.photo'
  | 'guestUploads.video'
  | 'guestUploads.noCaption'
  | 'guestUploads.processing'
  | 'guestUploads.successImage'
  | 'guestUploads.successVideo'
  | 'guestUploads.errorChooseFile'
  | 'guestUploads.errorLoad'
  | 'guestUploads.errorSubmit'
  | 'portfolio.seoTitle'
  | 'portfolio.seoDescription'
  | 'portfolio.logoAlt'
  | 'portfolio.heroEyebrow'
  | 'portfolio.heroTitle'
  | 'portfolio.heroDescription'
  | 'portfolio.ctaDemo'
  | 'portfolio.ctaModels'
  | 'portfolio.ctaBudget'
  | 'portfolio.heroNote'
  | 'portfolio.highlightsEyebrow'
  | 'portfolio.portfolioEyebrow'
  | 'portfolio.portfolioTitle'
  | 'portfolio.processEyebrow'
  | 'portfolio.processTitle'
  | 'portfolio.testimonialsEyebrow'
  | 'portfolio.testimonialsTitle'
  | 'portfolio.testimonialsDescription'
  | 'portfolio.testimonialFormTitle'
  | 'portfolio.testimonialFormDescription'
  | 'portfolio.testimonialNameLabel'
  | 'portfolio.testimonialContextLabel'
  | 'portfolio.testimonialMessageLabel'
  | 'portfolio.testimonialSubmit'
  | 'portfolio.testimonialSubmitting'
  | 'portfolio.testimonialSuccess'
  | 'portfolio.testimonialErrorRequired'
  | 'portfolio.testimonialErrorUnavailable'
  | 'portfolio.testimonialErrorGeneric'
  | 'portfolio.step'
  | 'portfolio.valueEyebrow'
  | 'portfolio.valueTitle'
  | 'portfolio.valueDescription'
  | 'portfolio.occasionsEyebrow'
  | 'portfolio.occasionsTitle'
  | 'portfolio.faqEyebrow'
  | 'portfolio.faqTitle'
  | 'portfolio.contactEyebrow'
  | 'portfolio.contactTitle'
  | 'portfolio.contactDescription'
  | 'portfolio.emailButton'
  | 'portfolio.whatsappButton'
  | 'portfolio.instagramButton'
  | 'portfolio.demoEyebrow'
  | 'portfolio.demoTitle'
  | 'portfolio.demoDescription'
  | 'portfolio.demoButton'
  | 'examples.back'
  | 'examples.eyebrow'
  | 'examples.title'
  | 'examples.description'
  | 'examples.open'
  | 'service.eyebrow'
  | 'service.why'
  | 'service.faqEyebrow'
  | 'service.faqTitle'
  | 'service.nextStepEyebrow'
  | 'service.nextStepTitle'
  | 'service.nextStepDescription'
  | 'service.viewExample'
  | 'service.exploreModels'
  | 'service.openDemo'
  | 'service.viewMoreModels'

type TranslationDictionary = Record<TranslationKey, string>

export const translations: Record<Locale, TranslationDictionary> = {
  'pt-BR': {
    'language.label': 'Idioma',
    'language.short.pt-BR': 'PT',
    'language.short.en': 'EN',
    'language.short.es': 'ES',
    'common.backHome': 'Voltar ao início',
    'common.loadingInvite': 'A carregar o convite...',
    'common.inviteNotFound': 'Convite não encontrado',
    'common.inviteNotFoundDescription': 'Não há nenhum convite com este link. Confira o endereço ou peça um novo ao organizador.',
    'invite.openingFallback': 'Você recebeu um convite especial.',
    'invite.heroContinue': 'Ver convite',
    'invite.messageHeading': 'Uma mensagem especial',
    'invite.countdownHeading': 'Contagem regressiva',
    'invite.countdownDescription': 'Falta pouco para esse momento especial',
    'invite.countdown.days': 'Dias',
    'invite.countdown.hours': 'Horas',
    'invite.countdown.minutes': 'Min',
    'invite.countdown.seconds': 'Seg',
    'invite.detailsHeading': 'Detalhes do evento',
    'invite.detailsDateTime': 'Data e horário',
    'invite.detailsVenue': 'Local',
    'invite.detailsDressCode': 'Traje',
    'invite.detailsNotes': 'Observações',
    'invite.mapButton': 'Ver no mapa',
    'invite.rsvpButton': 'Confirmar presença',
    'invite.giftsButton': 'Lista de presentes',
    'invite.galleryHeading': 'Momentos',
    'invite.galleryDescription': 'Alguns registros que ajudam a contar a história desse momento.',
    'guestUploads.defaultTitle': 'Compartilhe suas fotos e vídeos do evento',
    'guestUploads.defaultDescription': 'Envie um registro deste momento especial. O conteúdo será publicado no convite após aprovação do responsável.',
    'guestUploads.emptyCount': 'Ainda não há registros publicados.',
    'guestUploads.singleCount': '1 registro já aprovado',
    'guestUploads.multipleCount': '{count} registros já aprovados',
    'guestUploads.loading': 'Carregando registros aprovados...',
    'guestUploads.empty': 'Os primeiros registros aprovados aparecerão aqui.',
    'guestUploads.formTitle': 'Enviar foto ou vídeo',
    'guestUploads.formDescription': 'Envie 1 arquivo por vez. Fotos em JPG, PNG ou WEBP. Vídeos em MP4, MOV ou WEBM.',
    'guestUploads.mobileHint': 'Em celular, vídeos curtos funcionam melhor. Recomendado: até 1 minuto e preferencialmente em uma conexão estável.',
    'guestUploads.name': 'Seu nome',
    'guestUploads.caption': 'Legenda',
    'guestUploads.optional': 'Opcional',
    'guestUploads.file': 'Arquivo',
    'guestUploads.constraints': 'Fotos até 12 MB. Vídeos até 120 MB e 60 segundos. O arquivo só aparece no convite depois da aprovação.',
    'guestUploads.submit': 'Enviar para aprovação',
    'guestUploads.submitting': 'Enviando...',
    'guestUploads.readingFile': 'Analisando arquivo...',
    'guestUploads.chooseFile': 'Escolha um arquivo para enviar.',
    'guestUploads.photo': 'Foto',
    'guestUploads.video': 'Vídeo',
    'guestUploads.noCaption': 'Sem legenda.',
    'guestUploads.processing': 'Vídeo em processamento.',
    'guestUploads.successImage': 'Arquivo enviado com sucesso. Ele ficará visível após aprovação do responsável.',
    'guestUploads.successVideo': 'Vídeo enviado com sucesso. Ele será otimizado antes de ficar disponível para aprovação do responsável.',
    'guestUploads.errorChooseFile': 'Escolha um arquivo para enviar.',
    'guestUploads.errorLoad': 'Não foi possível carregar os registros aprovados.',
    'guestUploads.errorSubmit': 'Falha ao enviar o arquivo.',
    'portfolio.seoTitle': 'Convites Digitais Personalizados | Convites Diversos',
    'portfolio.seoDescription': 'Convites digitais personalizados com abertura animada, mapa, RSVP e partilha por WhatsApp para diferentes ocasiões.',
    'portfolio.logoAlt': 'Convites Diversos',
    'portfolio.heroEyebrow': 'Portfólio de convites digitais',
    'portfolio.heroTitle': 'Convites digitais feitos para emocionar em qualquer ocasião.',
    'portfolio.heroDescription': 'Desenvolvimento convites digitais elegantes, personalizados e responsivos para casamentos, bodas, aniversários, celebrações especiais, homenagens e outros momentos importantes, com contagem regressiva, fotos, música e compartilhamento por link.',
    'portfolio.ctaDemo': 'Ver convite demonstrativo',
    'portfolio.ctaModels': 'Ver outros modelos',
    'portfolio.ctaBudget': 'Pedir orçamento ou falar conosco',
    'portfolio.heroNote': 'Cada projeto pode ter seu próprio link, identidade visual e experiência personalizada para o tipo de evento.',
    'portfolio.highlightsEyebrow': 'Destaques',
    'portfolio.portfolioEyebrow': 'O que o portfólio entrega',
    'portfolio.portfolioTitle': 'Uma vitrine digital refinada para transformar convite em experiência.',
    'portfolio.processEyebrow': 'Processo',
    'portfolio.processTitle': 'Como funciona o desenvolvimento',
    'portfolio.testimonialsEyebrow': 'Depoimentos',
    'portfolio.testimonialsTitle': 'Clientes que transformaram o convite em experiência.',
    'portfolio.testimonialsDescription':
      'Alguns retornos de quem escolheu um convite digital personalizado para organizar as informações e encantar os convidados.',
    'portfolio.testimonialFormTitle': 'Deixe seu depoimento',
    'portfolio.testimonialFormDescription':
      'Recebeu seu convite? Escreva aqui como foi a experiência. O depoimento fica guardado para revisão antes de ser publicado.',
    'portfolio.testimonialNameLabel': 'Seu nome',
    'portfolio.testimonialContextLabel': 'Tipo de convite ou evento',
    'portfolio.testimonialMessageLabel': 'Depoimento',
    'portfolio.testimonialSubmit': 'Enviar depoimento',
    'portfolio.testimonialSubmitting': 'Enviando...',
    'portfolio.testimonialSuccess': 'Depoimento enviado com sucesso. Obrigado pelo carinho!',
    'portfolio.testimonialErrorRequired': 'Escreva um depoimento com pelo menos 12 caracteres.',
    'portfolio.testimonialErrorUnavailable': 'O envio de depoimentos ainda não está configurado.',
    'portfolio.testimonialErrorGeneric': 'Não foi possível enviar o depoimento agora.',
    'portfolio.step': 'Etapa',
    'portfolio.valueEyebrow': 'Prova de valor',
    'portfolio.valueTitle': 'O que faz o convite digital transmitir mais cuidado e profissionalismo.',
    'portfolio.valueDescription': 'Em vez de um convite simples em imagem, o convidado recebe uma experiência completa, clara e pensada para funcionar bem no celular.',
    'portfolio.occasionsEyebrow': 'Ocasiões populares',
    'portfolio.occasionsTitle': 'Encontre o tipo de convite digital ideal para o seu evento.',
    'portfolio.faqEyebrow': 'Perguntas frequentes',
    'portfolio.faqTitle': 'Dúvidas comuns sobre convites digitais personalizados.',
    'portfolio.contactEyebrow': 'Orçamento',
    'portfolio.contactTitle': 'Fale conosco e peça o seu orçamento',
    'portfolio.contactDescription': 'Conte-nos a ocasião, a data aproximada e o que imagina para o convite. Respondemos por e-mail ou WhatsApp para alinhar detalhes e valores.',
    'portfolio.emailButton': 'Enviar e-mail',
    'portfolio.whatsappButton': 'WhatsApp',
    'portfolio.instagramButton': 'Seguir no Instagram',
    'portfolio.demoEyebrow': 'Demonstração',
    'portfolio.demoTitle': 'Veja um convite completo publicado em formato real.',
    'portfolio.demoDescription': 'A demonstração mostra a estrutura visual do projeto e a experiência que pode ser adaptada para diferentes tipos de convite.',
    'portfolio.demoButton': 'Abrir demonstração',
    'examples.back': 'Voltar para a página inicial',
    'examples.eyebrow': 'Modelos de demonstração',
    'examples.title': 'Exemplos de convites para diferentes ocasiões.',
    'examples.description': 'Aqui você pode navegar por modelos prontos para aniversários, debutante, bodas e outras celebrações, usando a mesma experiência visual do site final.',
    'examples.open': 'Abrir modelo',
    'service.eyebrow': 'Convites digitais personalizados',
    'service.why': 'Por que escolher convite digital para {occasion}?',
    'service.faqEyebrow': 'Perguntas frequentes',
    'service.faqTitle': 'Dúvidas comuns sobre convite digital para {occasion}',
    'service.nextStepEyebrow': 'Próximo passo',
    'service.nextStepTitle': 'Veja um modelo real e entenda a experiência completa do convite.',
    'service.nextStepDescription': 'A demonstração ajuda a visualizar abertura animada, contagem regressiva, fotos, música, mapa e navegação no formato final.',
    'service.viewExample': 'Ver exemplo desta ocasião',
    'service.exploreModels': 'Explorar todos os modelos',
    'service.openDemo': 'Abrir demonstração',
    'service.viewMoreModels': 'Ver mais modelos',
  },
  en: {
    'language.label': 'Language',
    'language.short.pt-BR': 'PT',
    'language.short.en': 'EN',
    'language.short.es': 'ES',
    'common.backHome': 'Back to home',
    'common.loadingInvite': 'Loading invitation...',
    'common.inviteNotFound': 'Invitation not found',
    'common.inviteNotFoundDescription': 'There is no invitation at this link. Check the address or ask the host for a new one.',
    'invite.openingFallback': 'You received a special invitation.',
    'invite.heroContinue': 'View invitation',
    'invite.messageHeading': 'A special message',
    'invite.countdownHeading': 'Countdown',
    'invite.countdownDescription': 'This special moment is almost here',
    'invite.countdown.days': 'Days',
    'invite.countdown.hours': 'Hours',
    'invite.countdown.minutes': 'Min',
    'invite.countdown.seconds': 'Sec',
    'invite.detailsHeading': 'Event details',
    'invite.detailsDateTime': 'Date and time',
    'invite.detailsVenue': 'Venue',
    'invite.detailsDressCode': 'Dress code',
    'invite.detailsNotes': 'Notes',
    'invite.mapButton': 'View map',
    'invite.rsvpButton': 'Confirm attendance',
    'invite.giftsButton': 'Gift registry',
    'invite.galleryHeading': 'Moments',
    'invite.galleryDescription': 'A few memories that help tell the story of this moment.',
    'guestUploads.defaultTitle': 'Share your event photos and videos',
    'guestUploads.defaultDescription': 'Send a memory from this special moment. The content will appear on the invitation after host approval.',
    'guestUploads.emptyCount': 'No published memories yet.',
    'guestUploads.singleCount': '1 approved memory',
    'guestUploads.multipleCount': '{count} approved memories',
    'guestUploads.loading': 'Loading approved memories...',
    'guestUploads.empty': 'The first approved memories will appear here.',
    'guestUploads.formTitle': 'Send photo or video',
    'guestUploads.formDescription': 'Send 1 file at a time. Photos in JPG, PNG or WEBP. Videos in MP4, MOV or WEBM.',
    'guestUploads.mobileHint': 'Short videos work best on mobile. Recommended: up to 1 minute and preferably on a stable connection.',
    'guestUploads.name': 'Your name',
    'guestUploads.caption': 'Caption',
    'guestUploads.optional': 'Optional',
    'guestUploads.file': 'File',
    'guestUploads.constraints': 'Photos up to 12 MB. Videos up to 120 MB and 60 seconds. The file appears only after approval.',
    'guestUploads.submit': 'Send for approval',
    'guestUploads.submitting': 'Sending...',
    'guestUploads.readingFile': 'Analyzing file...',
    'guestUploads.chooseFile': 'Choose a file to send.',
    'guestUploads.photo': 'Photo',
    'guestUploads.video': 'Video',
    'guestUploads.noCaption': 'No caption.',
    'guestUploads.processing': 'Video is processing.',
    'guestUploads.successImage': 'File sent successfully. It will be visible after host approval.',
    'guestUploads.successVideo': 'Video sent successfully. It will be optimized before becoming available for host approval.',
    'guestUploads.errorChooseFile': 'Choose a file to send.',
    'guestUploads.errorLoad': 'Could not load approved memories.',
    'guestUploads.errorSubmit': 'Could not send the file.',
    'portfolio.seoTitle': 'Custom Digital Invitations | Convites Diversos',
    'portfolio.seoDescription': 'Custom digital invitations with animated opening, map, RSVP and WhatsApp sharing for different occasions.',
    'portfolio.logoAlt': 'Convites Diversos',
    'portfolio.heroEyebrow': 'Digital invitation portfolio',
    'portfolio.heroTitle': 'Digital invitations made to move guests on every occasion.',
    'portfolio.heroDescription': 'Elegant, custom and responsive digital invitations for weddings, anniversaries, birthdays, memorials and special celebrations, with countdown, photos, music and easy link sharing.',
    'portfolio.ctaDemo': 'View demo invitation',
    'portfolio.ctaModels': 'View more models',
    'portfolio.ctaBudget': 'Request a quote or contact us',
    'portfolio.heroNote': 'Each project can have its own link, visual identity and personalized experience for the event type.',
    'portfolio.highlightsEyebrow': 'Highlights',
    'portfolio.portfolioEyebrow': 'What the portfolio delivers',
    'portfolio.portfolioTitle': 'A refined digital showcase that turns an invitation into an experience.',
    'portfolio.processEyebrow': 'Process',
    'portfolio.processTitle': 'How development works',
    'portfolio.testimonialsEyebrow': 'Testimonials',
    'portfolio.testimonialsTitle': 'Clients who turned invitations into an experience.',
    'portfolio.testimonialsDescription':
      'A few notes from people who chose a custom digital invitation to organize details and delight their guests.',
    'portfolio.testimonialFormTitle': 'Leave your testimonial',
    'portfolio.testimonialFormDescription':
      'Received your invitation? Write how the experience felt. The testimonial is saved for review before publication.',
    'portfolio.testimonialNameLabel': 'Your name',
    'portfolio.testimonialContextLabel': 'Invitation or event type',
    'portfolio.testimonialMessageLabel': 'Testimonial',
    'portfolio.testimonialSubmit': 'Send testimonial',
    'portfolio.testimonialSubmitting': 'Sending...',
    'portfolio.testimonialSuccess': 'Testimonial sent successfully. Thank you for your kind words!',
    'portfolio.testimonialErrorRequired': 'Write a testimonial with at least 12 characters.',
    'portfolio.testimonialErrorUnavailable': 'Testimonial submission is not configured yet.',
    'portfolio.testimonialErrorGeneric': 'Could not send the testimonial right now.',
    'portfolio.step': 'Step',
    'portfolio.valueEyebrow': 'Value proof',
    'portfolio.valueTitle': 'Why digital invitations feel more thoughtful and professional.',
    'portfolio.valueDescription': 'Instead of a simple image invitation, guests receive a complete, clear experience designed to work beautifully on mobile.',
    'portfolio.occasionsEyebrow': 'Popular occasions',
    'portfolio.occasionsTitle': 'Find the ideal digital invitation type for your event.',
    'portfolio.faqEyebrow': 'FAQ',
    'portfolio.faqTitle': 'Common questions about custom digital invitations.',
    'portfolio.contactEyebrow': 'Quote',
    'portfolio.contactTitle': 'Contact us and request your quote',
    'portfolio.contactDescription': 'Tell us the occasion, approximate date and what you imagine for the invitation. We reply by email or WhatsApp to align details and pricing.',
    'portfolio.emailButton': 'Send email',
    'portfolio.whatsappButton': 'WhatsApp',
    'portfolio.instagramButton': 'Follow on Instagram',
    'portfolio.demoEyebrow': 'Demo',
    'portfolio.demoTitle': 'See a complete invitation published in real format.',
    'portfolio.demoDescription': 'The demo shows the project structure and the experience that can be adapted to different invitation types.',
    'portfolio.demoButton': 'Open demo',
    'examples.back': 'Back to home',
    'examples.eyebrow': 'Demo models',
    'examples.title': 'Invitation examples for different occasions.',
    'examples.description': 'Browse ready-made models for birthdays, quinceañeras, anniversaries and other celebrations using the same visual experience as the final site.',
    'examples.open': 'Open model',
    'service.eyebrow': 'Custom digital invitations',
    'service.why': 'Why choose a digital invitation for {occasion}?',
    'service.faqEyebrow': 'FAQ',
    'service.faqTitle': 'Common questions about digital invitations for {occasion}',
    'service.nextStepEyebrow': 'Next step',
    'service.nextStepTitle': 'See a real model and understand the full invitation experience.',
    'service.nextStepDescription': 'The demo helps you preview the animated opening, countdown, photos, music, map and navigation in the final format.',
    'service.viewExample': 'View example for this occasion',
    'service.exploreModels': 'Explore all models',
    'service.openDemo': 'Open demo',
    'service.viewMoreModels': 'View more models',
  },
  es: {
    'language.label': 'Idioma',
    'language.short.pt-BR': 'PT',
    'language.short.en': 'EN',
    'language.short.es': 'ES',
    'common.backHome': 'Volver al inicio',
    'common.loadingInvite': 'Cargando invitación...',
    'common.inviteNotFound': 'Invitación no encontrada',
    'common.inviteNotFoundDescription': 'No hay ninguna invitación en este enlace. Revisa la dirección o solicita una nueva al anfitrión.',
    'invite.openingFallback': 'Has recibido una invitación especial.',
    'invite.heroContinue': 'Ver invitación',
    'invite.messageHeading': 'Un mensaje especial',
    'invite.countdownHeading': 'Cuenta regresiva',
    'invite.countdownDescription': 'Falta poco para este momento especial',
    'invite.countdown.days': 'Días',
    'invite.countdown.hours': 'Horas',
    'invite.countdown.minutes': 'Min',
    'invite.countdown.seconds': 'Seg',
    'invite.detailsHeading': 'Detalles del evento',
    'invite.detailsDateTime': 'Fecha y hora',
    'invite.detailsVenue': 'Lugar',
    'invite.detailsDressCode': 'Vestimenta',
    'invite.detailsNotes': 'Observaciones',
    'invite.mapButton': 'Ver mapa',
    'invite.rsvpButton': 'Confirmar asistencia',
    'invite.giftsButton': 'Lista de regalos',
    'invite.galleryHeading': 'Momentos',
    'invite.galleryDescription': 'Algunos recuerdos que ayudan a contar la historia de este momento.',
    'guestUploads.defaultTitle': 'Comparte tus fotos y videos del evento',
    'guestUploads.defaultDescription': 'Envía un recuerdo de este momento especial. El contenido se publicará en la invitación después de la aprobación del anfitrión.',
    'guestUploads.emptyCount': 'Aún no hay recuerdos publicados.',
    'guestUploads.singleCount': '1 recuerdo aprobado',
    'guestUploads.multipleCount': '{count} recuerdos aprobados',
    'guestUploads.loading': 'Cargando recuerdos aprobados...',
    'guestUploads.empty': 'Los primeros recuerdos aprobados aparecerán aquí.',
    'guestUploads.formTitle': 'Enviar foto o video',
    'guestUploads.formDescription': 'Envía 1 archivo por vez. Fotos en JPG, PNG o WEBP. Videos en MP4, MOV o WEBM.',
    'guestUploads.mobileHint': 'En celular, los videos cortos funcionan mejor. Recomendado: hasta 1 minuto y con conexión estable.',
    'guestUploads.name': 'Tu nombre',
    'guestUploads.caption': 'Leyenda',
    'guestUploads.optional': 'Opcional',
    'guestUploads.file': 'Archivo',
    'guestUploads.constraints': 'Fotos hasta 12 MB. Videos hasta 120 MB y 60 segundos. El archivo aparece solo después de la aprobación.',
    'guestUploads.submit': 'Enviar para aprobación',
    'guestUploads.submitting': 'Enviando...',
    'guestUploads.readingFile': 'Analizando archivo...',
    'guestUploads.chooseFile': 'Elige un archivo para enviar.',
    'guestUploads.photo': 'Foto',
    'guestUploads.video': 'Video',
    'guestUploads.noCaption': 'Sin leyenda.',
    'guestUploads.processing': 'Video en procesamiento.',
    'guestUploads.successImage': 'Archivo enviado correctamente. Será visible después de la aprobación del anfitrión.',
    'guestUploads.successVideo': 'Video enviado correctamente. Será optimizado antes de quedar disponible para aprobación.',
    'guestUploads.errorChooseFile': 'Elige un archivo para enviar.',
    'guestUploads.errorLoad': 'No fue posible cargar los recuerdos aprobados.',
    'guestUploads.errorSubmit': 'No fue posible enviar el archivo.',
    'portfolio.seoTitle': 'Invitaciones Digitales Personalizadas | Convites Diversos',
    'portfolio.seoDescription': 'Invitaciones digitales personalizadas con apertura animada, mapa, RSVP y envío por WhatsApp para diferentes ocasiones.',
    'portfolio.logoAlt': 'Convites Diversos',
    'portfolio.heroEyebrow': 'Portafolio de invitaciones digitales',
    'portfolio.heroTitle': 'Invitaciones digitales creadas para emocionar en cualquier ocasión.',
    'portfolio.heroDescription': 'Invitaciones digitales elegantes, personalizadas y responsivas para bodas, aniversarios, cumpleaños, homenajes y celebraciones especiales, con cuenta regresiva, fotos, música y envío por enlace.',
    'portfolio.ctaDemo': 'Ver invitación demo',
    'portfolio.ctaModels': 'Ver otros modelos',
    'portfolio.ctaBudget': 'Solicitar presupuesto o contacto',
    'portfolio.heroNote': 'Cada proyecto puede tener su propio enlace, identidad visual y experiencia personalizada para el tipo de evento.',
    'portfolio.highlightsEyebrow': 'Destacados',
    'portfolio.portfolioEyebrow': 'Qué entrega el portafolio',
    'portfolio.portfolioTitle': 'Una vitrina digital refinada para transformar la invitación en experiencia.',
    'portfolio.processEyebrow': 'Proceso',
    'portfolio.processTitle': 'Cómo funciona el desarrollo',
    'portfolio.testimonialsEyebrow': 'Testimonios',
    'portfolio.testimonialsTitle': 'Clientes que transformaron la invitación en una experiencia.',
    'portfolio.testimonialsDescription':
      'Algunos comentarios de quienes eligieron una invitación digital personalizada para organizar la información y encantar a sus invitados.',
    'portfolio.testimonialFormTitle': 'Deja tu testimonio',
    'portfolio.testimonialFormDescription':
      '¿Recibiste tu invitación? Escribe cómo fue la experiencia. El testimonio queda guardado para revisión antes de publicarse.',
    'portfolio.testimonialNameLabel': 'Tu nombre',
    'portfolio.testimonialContextLabel': 'Tipo de invitación o evento',
    'portfolio.testimonialMessageLabel': 'Testimonio',
    'portfolio.testimonialSubmit': 'Enviar testimonio',
    'portfolio.testimonialSubmitting': 'Enviando...',
    'portfolio.testimonialSuccess': 'Testimonio enviado con éxito. ¡Gracias por el cariño!',
    'portfolio.testimonialErrorRequired': 'Escribe un testimonio con al menos 12 caracteres.',
    'portfolio.testimonialErrorUnavailable': 'El envío de testimonios aún no está configurado.',
    'portfolio.testimonialErrorGeneric': 'No fue posible enviar el testimonio ahora.',
    'portfolio.step': 'Paso',
    'portfolio.valueEyebrow': 'Prueba de valor',
    'portfolio.valueTitle': 'Por qué la invitación digital transmite más cuidado y profesionalismo.',
    'portfolio.valueDescription': 'En lugar de una simple imagen, el invitado recibe una experiencia completa, clara y pensada para funcionar bien en celular.',
    'portfolio.occasionsEyebrow': 'Ocasiones populares',
    'portfolio.occasionsTitle': 'Encuentra el tipo de invitación digital ideal para tu evento.',
    'portfolio.faqEyebrow': 'Preguntas frecuentes',
    'portfolio.faqTitle': 'Dudas comunes sobre invitaciones digitales personalizadas.',
    'portfolio.contactEyebrow': 'Presupuesto',
    'portfolio.contactTitle': 'Contáctanos y solicita tu presupuesto',
    'portfolio.contactDescription': 'Cuéntanos la ocasión, fecha aproximada y qué imaginas para la invitación. Respondemos por email o WhatsApp para alinear detalles y valores.',
    'portfolio.emailButton': 'Enviar email',
    'portfolio.whatsappButton': 'WhatsApp',
    'portfolio.instagramButton': 'Seguir en Instagram',
    'portfolio.demoEyebrow': 'Demostración',
    'portfolio.demoTitle': 'Mira una invitación completa publicada en formato real.',
    'portfolio.demoDescription': 'La demostración muestra la estructura visual y la experiencia que puede adaptarse a diferentes tipos de invitación.',
    'portfolio.demoButton': 'Abrir demo',
    'examples.back': 'Volver al inicio',
    'examples.eyebrow': 'Modelos de demostración',
    'examples.title': 'Ejemplos de invitaciones para diferentes ocasiones.',
    'examples.description': 'Puedes navegar por modelos listos para cumpleaños, quinceañeras, aniversarios y otras celebraciones, usando la misma experiencia visual del sitio final.',
    'examples.open': 'Abrir modelo',
    'service.eyebrow': 'Invitaciones digitales personalizadas',
    'service.why': '¿Por qué elegir invitación digital para {occasion}?',
    'service.faqEyebrow': 'Preguntas frecuentes',
    'service.faqTitle': 'Dudas comunes sobre invitación digital para {occasion}',
    'service.nextStepEyebrow': 'Próximo paso',
    'service.nextStepTitle': 'Mira un modelo real y entiende la experiencia completa de la invitación.',
    'service.nextStepDescription': 'La demostración ayuda a visualizar apertura animada, cuenta regresiva, fotos, música, mapa y navegación en el formato final.',
    'service.viewExample': 'Ver ejemplo de esta ocasión',
    'service.exploreModels': 'Explorar todos los modelos',
    'service.openDemo': 'Abrir demo',
    'service.viewMoreModels': 'Ver más modelos',
  },
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  const key = value?.trim().toLowerCase()
  if (!key) return null
  return localeAliases[key] ?? null
}

export function detectInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const fromQuery = normalizeLocale(new URLSearchParams(window.location.search).get('lang'))
    if (fromQuery) return fromQuery

    const stored = normalizeLocale(window.localStorage.getItem('convitesdiversos.locale'))
    if (stored) return stored
  }

  if (typeof navigator !== 'undefined') {
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const candidate of candidates) {
      const exact = normalizeLocale(candidate)
      if (exact) return exact
      const base = normalizeLocale(candidate?.split('-')[0])
      if (base) return base
    }
  }

  return 'pt-BR'
}
