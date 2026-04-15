import { Link } from 'react-router-dom'

export function PortfolioPage() {
  const highlights = [
    {
      title: 'Experiência memorável',
      description: 'Convites com abertura em envelope, transições suaves e visual elegante para valorizar o primeiro impacto.',
    },
    {
      title: 'Tudo no mesmo link',
      description: 'Informações do evento, mapa, confirmação via WhatsApp, contagem regressiva, música e galeria no mesmo lugar.',
    },
    {
      title: 'Personalização para cada ocasião',
      description: 'Cada projeto recebe identidade própria, com link exclusivo e estrutura pensada para mobile e compartilhamento.',
    },
  ]

  const sections = [
    'Abertura em estilo envelope para criar uma apresentação sofisticada.',
    'Página responsiva com data, local, mapa, confirmação de presença e conteúdo personalizado.',
    'Galeria de fotos, trilha sonora e identidade visual alinhada ao momento celebrado.',
  ]

  const process = [
    'Definimos o estilo visual e reunimos textos, fotos e referências para a ocasião.',
    'Montamos o convite com navegação fluida, identidade personalizada e versão para celular.',
    'Entrego o link final pronto para compartilhamento com convidados, familiares ou homenageados.',
  ]

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
              aniversários, celebrações especiais, homenagens e outros momentos importantes.
            </p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                to="/c/default"
                className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                Ver convite demonstrativo
              </Link>
              <Link
                to="/modelos"
                className="inline-flex rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                Ver outros modelos
              </Link>
            </div>
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
              to="/c/default"
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
