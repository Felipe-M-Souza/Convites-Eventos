export type ServiceLandingPage = {
  slug: string
  occasion: string
  title: string
  description: string
  heading: string
  intro: string
  demoSlug: string
  bullets: string[]
  faqs: Array<{
    question: string
    answer: string
  }>
}

export const serviceLandingPages: ServiceLandingPage[] = [
  {
    slug: 'aniversario-infantil',
    occasion: 'aniversário infantil',
    title: 'Convite Digital Aniversário Infantil Personalizado | Convites Diversos',
    description:
      'Convite digital infantil com animação, tema personalizado e envio fácil por WhatsApp. Encante os convidados com um link único.',
    heading: 'Convite digital de aniversário infantil personalizado',
    intro:
      'Modelos leves e coloridos, com abertura em envelope, texto personalizado e link pronto para compartilhar no WhatsApp.',
    demoSlug: 'demo-aniversario-infantil',
    bullets: [
      'Temas delicados, lúdicos ou coloridos conforme a festa.',
      'Link único para enviar em WhatsApp, Instagram e Telegram.',
      'Contagem regressiva, fotos, música e dados da festa no mesmo convite.',
    ],
    faqs: [
      {
        question: 'O convite digital de aniversário infantil pode seguir o tema da festa?',
        answer:
          'Sim. O layout pode ser adaptado com cores, referências visuais e estilo alinhados ao tema da comemoração.',
      },
      {
        question: 'Os convidados recebem um link para abrir no celular?',
        answer:
          'Sim. O convite é entregue em um link responsivo, pensado para abrir bem no celular e ser compartilhado com facilidade.',
      },
      {
        question: 'Posso incluir data, endereço e confirmação de presença?',
        answer:
          'Sim. O convite pode reunir data, horário, local, mapa, confirmação por WhatsApp e outras informações importantes.',
      },
      {
        question: 'O convite também pode ter contagem regressiva, fotos e música?',
        answer:
          'Sim. Os modelos podem incluir contagem regressiva, galeria de fotos e música para deixar a experiência mais completa e envolvente.',
      },
    ],
  },
  {
    slug: '15-anos',
    occasion: '15 anos',
    title: 'Convite Digital 15 Anos Personalizado | Convites Diversos',
    description:
      'Convite digital para debutante com visual elegante, animações e identidade exclusiva. Pronto para compartilhar no WhatsApp.',
    heading: 'Convite digital de 15 anos personalizado',
    intro:
      'Uma apresentação elegante para debutantes, com identidade visual refinada e experiência memorável no celular.',
    demoSlug: 'demo-festa-15-anos',
    bullets: [
      'Visual premium com abertura animada em envelope.',
      'Informações completas de data, horário, local e mapa.',
      'Contagem regressiva, fotos e música em uma experiência elegante no mesmo link.',
    ],
    faqs: [
      {
        question: 'O convite digital de 15 anos pode ter visual mais elegante?',
        answer:
          'Sim. A proposta para 15 anos pode seguir uma linha mais sofisticada, com identidade visual refinada e apresentação marcante.',
      },
      {
        question: 'O link do convite pode ser enviado por WhatsApp?',
        answer:
          'Sim. O convite é entregue em link pronto para compartilhar por WhatsApp, redes sociais ou mensagem direta.',
      },
      {
        question: 'Posso mostrar local, horário e mapa no mesmo convite?',
        answer:
          'Sim. O modelo pode concentrar as principais informações do evento em uma única página, facilitando a consulta pelos convidados.',
      },
      {
        question: 'O convite de 15 anos pode incluir contagem regressiva, fotos e música?',
        answer:
          'Sim. Esses recursos ajudam a valorizar a apresentação da debutante e tornam o convite mais memorável para os convidados.',
      },
    ],
  },
  {
    slug: 'cha-de-bebe',
    occasion: 'chá de bebê',
    title: 'Convite Digital Chá de Bebê Personalizado | Convites Diversos',
    description:
      'Convite digital de chá de bebê com design delicado, abertura animada e detalhes personalizados. Compartilhe com praticidade.',
    heading: 'Convite digital de chá de bebê personalizado',
    intro:
      'Layouts delicados para anunciar esse momento especial, com detalhes personalizados e envio simples por link.',
    demoSlug: 'demo-cha-de-bebe',
    bullets: [
      'Paleta suave e elementos visuais temáticos.',
      'Nome do bebê, data e local com edição rápida.',
      'Contagem regressiva, galeria de fotos e música no mesmo convite digital.',
    ],
    faqs: [
      {
        question: 'O convite digital de chá de bebê pode ter nome do bebê e mensagem personalizada?',
        answer:
          'Sim. O convite pode incluir nome, data, local, frase especial e outras informações definidas para esse momento.',
      },
      {
        question: 'É possível compartilhar o convite com familiares e amigos por link?',
        answer:
          'Sim. O envio é simples: basta compartilhar o link do convite nos canais que preferir.',
      },
      {
        question: 'Posso atualizar algum dado depois do convite pronto?',
        answer:
          'Sim. Caso seja necessário ajustar horário, endereço ou outro detalhe, o conteúdo pode ser atualizado com rapidez.',
      },
      {
        question: 'O convite pode ter contagem regressiva, fotos e música?',
        answer:
          'Sim. É possível incluir esses recursos para enriquecer a experiência e deixar o convite mais especial para familiares e convidados.',
      },
    ],
  },
  {
    slug: 'cha-revelacao',
    occasion: 'chá revelação',
    title: 'Convite Digital Chá Revelação Personalizado | Convites Diversos',
    description:
      'Convite digital para chá revelação com tema criativo, animação e envio por link. Personalize com nome, data e local.',
    heading: 'Convite digital de chá revelação personalizado',
    intro:
      'Modelos criativos para partilhar a surpresa com família e amigos em uma experiência digital bonita e prática.',
    demoSlug: 'demo-cha-revelacao',
    bullets: [
      'Convite com abertura animada e visual temático.',
      'Link de confirmação e localização integrado.',
      'Contagem regressiva, fotos e música para valorizar a surpresa.',
    ],
    faqs: [
      {
        question: 'O convite digital de chá revelação pode ter visual temático?',
        answer:
          'Sim. O convite pode seguir uma proposta delicada, divertida ou elegante, conforme o estilo desejado para a revelação.',
      },
      {
        question: 'O convite funciona bem no celular?',
        answer:
          'Sim. A experiência é pensada para mobile, com leitura fácil, navegação simples e compartilhamento rápido.',
      },
      {
        question: 'É possível incluir confirmação de presença no convite?',
        answer:
          'Sim. O modelo pode reunir confirmação de presença, localização e demais detalhes no mesmo link.',
      },
      {
        question: 'O convite de chá revelação pode incluir contagem regressiva, fotos e música?',
        answer:
          'Sim. Esses elementos ajudam a criar expectativa antes do evento e deixam a apresentação mais envolvente.',
      },
    ],
  },
  {
    slug: 'aniversario-adulto',
    occasion: 'aniversário adulto',
    title: 'Convite Digital Aniversário Adulto Personalizado | Convites Diversos',
    description:
      'Convite digital para aniversário adulto com estilo sofisticado e experiência interativa. Ideal para WhatsApp e redes sociais.',
    heading: 'Convite digital de aniversário adulto personalizado',
    intro:
      'Design moderno e elegante para aniversários adultos, com foco em estilo e praticidade no compartilhamento.',
    demoSlug: 'demo-aniversario-adulto',
    bullets: [
      'Visual sofisticado com leitura otimizada em fundo escuro.',
      'Link único para WhatsApp, Instagram e e-mail.',
      'Conteúdo completo com contagem regressiva, fotos, música, local e RSVP.',
    ],
    faqs: [
      {
        question: 'O convite digital de aniversário adulto pode ter estilo mais sofisticado?',
        answer:
          'Sim. Os modelos podem seguir uma linha mais elegante, moderna e alinhada ao perfil da celebração.',
      },
      {
        question: 'O convite pode incluir mapa e confirmação de presença?',
        answer:
          'Sim. Essas informações podem ficar no mesmo link para facilitar o acesso dos convidados.',
      },
      {
        question: 'Posso usar o convite em WhatsApp e redes sociais?',
        answer:
          'Sim. O formato por link facilita o compartilhamento em WhatsApp, Instagram, e-mail e outros canais.',
      },
      {
        question: 'O convite pode incluir contagem regressiva, fotos e música?',
        answer:
          'Sim. Esses recursos ajudam a valorizar a experiência do convite e deixam a apresentação mais sofisticada e interativa.',
      },
    ],
  },
  {
    slug: 'homenagem',
    occasion: 'homenagem',
    title: 'Convite Digital Homenagem Personalizado | Convites Diversos',
    description:
      'Convite digital de homenagem com visual respeitoso e elegante. Personalize textos e informações para compartilhar com familiares.',
    heading: 'Convite digital de homenagem personalizado',
    intro:
      'Uma forma sensível de reunir familiares e amigos, com comunicação clara e linguagem visual respeitosa.',
    demoSlug: 'demo-homenagem',
    bullets: [
      'Tom visual sóbrio e acolhedor.',
      'Dados de encontro, horários e localização no mesmo link.',
      'Possibilidade de incluir fotos, música e informações essenciais de forma organizada.',
    ],
    faqs: [
      {
        question: 'O convite digital de homenagem pode ter visual mais discreto e respeitoso?',
        answer:
          'Sim. A proposta visual pode seguir um tom sóbrio, acolhedor e adequado ao momento.',
      },
      {
        question: 'É possível reunir todas as informações do encontro em um único link?',
        answer:
          'Sim. O convite pode concentrar endereço, horário, localização e outros detalhes importantes em uma única página.',
      },
      {
        question: 'Se houver mudança de horário ou local, o convite pode ser atualizado?',
        answer:
          'Sim. Ajustes podem ser feitos rapidamente para manter familiares e convidados bem informados.',
      },
      {
        question: 'É possível incluir fotos e música em um convite de homenagem?',
        answer:
          'Sim. Quando fizer sentido para a proposta, o convite pode reunir fotos e música para criar uma apresentação mais afetiva e significativa.',
      },
    ],
  },
  {
    slug: 'casamento',
    occasion: 'casamento',
    title: 'Convite Digital Casamento Personalizado | Convites Diversos',
    description:
      'Convite digital de casamento com abertura animada, mapa, RSVP e trilha sonora. Um link completo para seus convidados.',
    heading: 'Convite digital de casamento personalizado',
    intro:
      'Convites de casamento com aparência premium, animações suaves e todos os detalhes importantes no mesmo link.',
    demoSlug: 'default',
    bullets: [
      'Abertura em envelope para o primeiro impacto.',
      'Mapa, confirmação, contagem regressiva, fotos e música em uma única página.',
      'Compatível com partilha rápida por WhatsApp.',
    ],
    faqs: [
      {
        question: 'O convite digital de casamento pode reunir todos os detalhes do evento?',
        answer:
          'Sim. O modelo pode incluir data, local, mapa, confirmação de presença, galeria e outros conteúdos no mesmo link.',
      },
      {
        question: 'Os noivos podem compartilhar o convite facilmente pelo WhatsApp?',
        answer:
          'Sim. O envio por link facilita a distribuição para convidados individuais, grupos e familiares.',
      },
      {
        question: 'O convite pode ter abertura animada?',
        answer:
          'Sim. A apresentação com envelope animado faz parte do diferencial da experiência e valoriza o primeiro contato com o convite.',
      },
      {
        question: 'O convite de casamento pode incluir contagem regressiva, fotos e música?',
        answer:
          'Sim. Esses recursos ajudam a criar clima para o evento e tornam o link do convite mais completo e emocionante.',
      },
    ],
  },
  {
    slug: 'bodas',
    occasion: 'bodas',
    title: 'Convite Digital Bodas Personalizado | Convites Diversos',
    description:
      'Convite digital para bodas com layout elegante e personalização completa. Compartilhe com facilidade e encante os convidados.',
    heading: 'Convite digital de bodas personalizado',
    intro:
      'Celebre bodas com um convite digital elegante, fácil de partilhar e pensado para emocionar convidados e familiares.',
    demoSlug: 'demo-bodas-de-ouro',
    bullets: [
      'Modelos para bodas de prata, ouro e outras celebrações.',
      'Design clássico com toque contemporâneo.',
      'Contagem regressiva, fotos e música para valorizar a celebração no mesmo link.',
    ],
    faqs: [
      {
        question: 'O convite digital de bodas pode ser personalizado para prata, ouro e outras datas?',
        answer:
          'Sim. O visual e os textos podem ser adaptados conforme o tipo de bodas e a proposta da celebração.',
      },
      {
        question: 'O convite pode ser enviado por link para familiares e amigos?',
        answer:
          'Sim. O formato digital facilita o envio imediato por WhatsApp e outros canais.',
      },
      {
        question: 'Posso incluir local, horário e informações complementares?',
        answer:
          'Sim. O convite pode reunir os principais dados do evento em uma página prática e organizada.',
      },
      {
        question: 'O convite de bodas pode ter contagem regressiva, fotos e música?',
        answer:
          'Sim. Esses recursos ajudam a contar a história da celebração e deixam o convite mais completo e emocional.',
      },
    ],
  },
]

export const serviceLandingPagesBySlug: Record<string, ServiceLandingPage> = Object.fromEntries(
  serviceLandingPages.map((page) => [page.slug, page]),
)
