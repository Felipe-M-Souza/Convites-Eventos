import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applySeoMeta } from '../lib/seoMeta'
import { applyStructuredData, clearStructuredData } from '../lib/structuredData'
import { trackCtaClick, trackGoogleAdsConversion } from '../lib/analytics'

const PORTFOLIO_CONTACT_EMAIL = 'contato@convitesdiversos.com.br'
/** (11) 96581-4224 — wa.me sem espaços ou símbolos */
const PORTFOLIO_CONTACT_WHATSAPP_E164 = '5511965814224'

const portfolioContactMailtoHref = `mailto:${PORTFOLIO_CONTACT_EMAIL}?subject=${encodeURIComponent('Orçamento — convite digital')}&body=${encodeURIComponent(
  'Olá,\n\nGostaria de solicitar um orçamento para convite digital.\n\nNome:\nData do evento:\nTipo de celebração:\n\nObrigado/a.',
)}`

const portfolioContactWhatsHref = `https://wa.me/${PORTFOLIO_CONTACT_WHATSAPP_E164}?text=${encodeURIComponent(
  'Olá! Gostaria de um orçamento para convite digital pela Convites Diversos.',
)}`

export function PortfolioPage() {
  const highlights = [
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
  ]

  const sections = [
    'Abertura em estilo envelope para criar uma apresentação sofisticada.',
    'Página responsiva com data, local, mapa, confirmação de presença e contagem regressiva.',
    'Galeria de fotos, trilha sonora e identidade visual alinhadas ao momento celebrado.',
  ]

  const process = [
    'Definimos o estilo visual e reunimos textos, fotos e referências para a ocasião.',
    'Montamos o convite com navegação fluida, identidade personalizada, contagem regressiva e versão para celular.',
    'Entrego o link final pronto para compartilhamento com convidados, familiares ou homenageados, com fotos, música e recursos do evento.',
  ]

  const seoOccasions = [
    { label: 'Convite digital aniversário infantil', href: '/convite-digital/aniversario-infantil' },
    { label: 'Convite digital 15 anos', href: '/convite-digital/15-anos' },
    { label: 'Convite digital chá de bebê', href: '/convite-digital/cha-de-bebe' },
    { label: 'Convite digital chá revelação', href: '/convite-digital/cha-revelacao' },
    { label: 'Convite digital aniversário adulto', href: '/convite-digital/aniversario-adulto' },
    { label: 'Convite digital homenagem', href: '/convite-digital/homenagem' },
    { label: 'Convite digital casamento', href: '/convite-digital/casamento' },
    { label: 'Convite digital bodas', href: '/convite-digital/bodas' },
  ]

  const trustSignals = [
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
  ]

  const faqs = [
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
  ]

  useEffect(() => {
    const siteUrl = window.location.origin
    applySeoMeta({
      title: 'Convites Digitais Personalizados | Convites Diversos',
      description:
        'Convites digitais personalizados com abertura animada, mapa, RSVP e partilha por WhatsApp para diferentes ocasiões.',
      image: `${siteUrl}/images/hero-couple.jpg`,
      url: window.location.href,
    })

    applyStructuredData('website-org', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Convites Diversos',
          url: siteUrl,
          logo: `${siteUrl}/images/logo-convitesdiversos-transparent.png`,
          sameAs: [],
        },
        {
          '@type': 'WebSite',
          name: 'Convites Diversos',
          url: siteUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/modelos`,
            'query-input': 'required name=ocasião',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        },
      ],
    })

    return () => clearStructuredData('website-org')
  }, [])

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] text-[color:var(--color-ink)]">
      <section className="px-6 pb-18 pt-16">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <img
              src="/images/logo-convitesdiversos-transparent.png"
              alt="Convites Diversos"
              className="mb-10 h-auto w-full max-w-[560px]"
            />
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--color-ink-muted)]">
              Portfolio de convites digitais
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-none sm:text-6xl">
              Convites digitais feitos para emocionar em qualquer ocasião.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[color:var(--color-ink-muted)] sm:text-lg">
              Desenvolvimento convites digitais elegantes, personalizados e responsivos para casamentos, bodas,
              aniversários, celebrações especiais, homenagens e outros momentos importantes, com contagem regressiva,
              fotos, música e compartilhamento por link.
            </p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                to="/c/default?utm_source=portfolio&utm_medium=cta&utm_campaign=demo_home"
                onClick={() => trackCtaClick('portfolio_hero', 'ver_convite_demonstrativo', '/c/default')}
                className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                Ver convite demonstrativo
              </Link>
              <Link
                to="/modelos?utm_source=portfolio&utm_medium=cta&utm_campaign=modelos_home"
                onClick={() => trackCtaClick('portfolio_hero', 'ver_outros_modelos', '/modelos')}
                className="inline-flex rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                Ver outros modelos
              </Link>
            </div>
            <p className="mt-6 text-sm">
              <Link
                to="#contato"
                onClick={() => trackCtaClick('portfolio_hero', 'link_secao_contato', '#contato')}
                className="font-medium text-[color:var(--color-gold)] underline decoration-[color:var(--color-gold-soft)] underline-offset-4 transition hover:decoration-[color:var(--color-gold)]"
              >
                Pedir orçamento ou falar conosco
              </Link>
            </p>
            <p className="mt-8 text-sm text-[color:var(--color-ink-muted)]">
              Cada projeto pode ter seu próprio link, identidade visual e experiência personalizada para o tipo de evento.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_rgba(44,38,34,0.08)] backdrop-blur">
            <div className="rounded-[1.6rem] bg-[linear-gradient(160deg,rgba(212,188,148,0.24),rgba(255,255,255,0.95))] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
                Destaques
              </p>
              <div className="mt-6 space-y-4">
                {highlights.map((item) => (
                  <article key={item.title} className="rounded-[1.3rem] bg-white/90 p-5 shadow-sm">
                    <h2 className="font-display text-2xl font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink-muted)]">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-y border-stone-200/80 bg-white/70 px-6 py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
              O que o portfolio entrega
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              Uma vitrine digital refinada para transformar convite em experiência.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {sections.map((item) => (
              <div
                key={item}
                className="rounded-[1.6rem] border border-stone-200 bg-[color:var(--color-cream)] p-6 shadow-sm"
              >
                <p className="text-sm leading-7 text-[color:var(--color-ink-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-18">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
              Processo
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Como funciona o desenvolvimento</h2>
          </div>
          <div className="space-y-4">
            {process.map((item, index) => (
              <div key={item} className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-gold)]">
                  Etapa {index + 1}
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200/80 bg-white/70 px-6 py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
              Prova de valor
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              O que faz o convite digital transmitir mais cuidado e profissionalismo.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">
              Em vez de um convite simples em imagem, o convidado recebe uma experiência completa, clara e pensada para
              funcionar bem no celular.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {trustSignals.map((item) => (
              <article key={item.title} className="rounded-[1.6rem] bg-[color:var(--color-cream)] p-6 shadow-sm ring-1 ring-stone-200/70">
                <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200/80 bg-white/70 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
            Ocasiões populares
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            Encontre o tipo de convite digital ideal para o seu evento.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {seoOccasions.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => trackCtaClick('portfolio_occasions', item.label, item.href)}
                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-18">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">
            Perguntas frequentes
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            Dúvidas comuns sobre convites digitais personalizados.
          </h2>
          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-[1.4rem] border border-stone-200 bg-[color:var(--color-cream)] px-5 py-4 shadow-sm open:bg-white"
              >
                <summary className="cursor-pointer list-none pr-6 font-medium text-[color:var(--color-ink)]">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="border-t border-stone-200/80 bg-[color:var(--color-blush)]/60 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--color-ink-muted)]">Orçamento</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-[color:var(--color-ink)] sm:text-4xl">
            Fale conosco e peça o seu orçamento
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-ink-muted)] sm:text-base">
            Conte-nos a ocasião, a data aproximada e o que imagina para o convite. Respondemos por e-mail ou WhatsApp
            para alinhar detalhes e valores.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <a
              href={portfolioContactMailtoHref}
              onClick={() => {
                trackCtaClick('portfolio_contact', 'email_orcamento', portfolioContactMailtoHref)
                trackGoogleAdsConversion()
              }}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
            >
              Enviar e-mail
            </a>
            <a
              href={portfolioContactWhatsHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackCtaClick('portfolio_contact', 'whatsapp_orcamento', portfolioContactWhatsHref)
                trackGoogleAdsConversion()
              }}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 pb-18">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-[color:var(--color-ink)] px-8 py-12 text-center text-white shadow-[0_25px_80px_rgba(44,38,34,0.18)] sm:px-12">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/70">Demonstração</p>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            Veja um convite completo publicado em formato real.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            A demonstração mostra a estrutura visual do projeto e a experiência que pode ser adaptada para diferentes
            tipos de convite.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/c/default?utm_source=portfolio&utm_medium=cta&utm_campaign=demo_footer"
              onClick={() => trackCtaClick('portfolio_footer', 'abrir_demonstracao', '/c/default')}
              className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Abrir demonstração
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
