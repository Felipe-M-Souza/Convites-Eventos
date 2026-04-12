import { Link } from 'react-router-dom'

export function PortfolioPage() {
  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] px-6 py-16 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--color-ink-muted)]">
          Convites digitais
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">
          Um convite que abre como um envelope
        </h1>
        <p className="mt-6 text-base leading-relaxed text-[color:var(--color-ink-muted)]">
          Música, contagem decrescente, RSVP por WhatsApp, galeria de momentos e painel para o casal editar textos e
          fotos — tudo responsivo para telemóvel.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/c/default"
            className="inline-flex rounded-full bg-[color:var(--color-gold)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Ver exemplo ao vivo
          </Link>
          <Link
            to="/admin"
            className="inline-flex rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            Painel (clientes)
          </Link>
        </div>
        <p className="mt-12 text-xs text-[color:var(--color-ink-muted)]">
          Cada casamento tem o seu link: <span className="font-mono text-stone-600">/c/nome-do-casal</span>
        </p>
      </div>
    </div>
  )
}
