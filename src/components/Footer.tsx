import type { EventData } from '../data/eventData'

type Props = {
  data: EventData
}

export function Footer({ data }: Props) {
  return (
    <footer className="border-t border-stone-200/80 bg-white/60 px-6 py-14 text-center">
      <p className="font-display text-2xl text-[color:var(--color-ink)]">
        {data.footerThanks}
      </p>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
        {data.footerContact}
      </p>
      <p className="mt-10 text-xs uppercase tracking-[0.2em] text-stone-400">
        {data.coupleNames}
      </p>
    </footer>
  )
}
