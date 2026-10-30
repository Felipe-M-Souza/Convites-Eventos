type MarkProps = {
  mark: string
  className?: string
}

/** Medalhão oval dourado com a pedra verde-água e as iniciais do casal. */
export function MonogramMark({ mark, className = '' }: MarkProps) {
  const compact = mark.trim().length > 6
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 120 142" className="h-full w-full overflow-visible" aria-hidden>
        <path
          d="M60 8c-8 1-14 8-12 16 1 4 4 7 8 8 2-6 6-9 12-8 6-1 10 2 12 8 4-1 7-4 8-8 2-8-4-15-12-16-5 3-11 3-16 0z"
          fill="none"
          stroke="#c6a56a"
          strokeWidth="1.3"
        />
        <path d="M60 14l6 8-6 5-6-5z" fill="#1b7e7a" />
        <path d="M60 16l2.2 3.2L60 21.2 57.8 19.2z" fill="#d9fff6" opacity="0.85" />
        <ellipse cx="60" cy="80" rx="46" ry="52" fill="#fbf8f3" stroke="#c6a56a" strokeWidth="2.6" />
        <ellipse cx="60" cy="80" rx="39" ry="45" fill="none" stroke="#e4d2a4" strokeWidth="0.9" />
        <circle cx="60" cy="30" r="1.6" fill="#c6a56a" />
        <circle cx="60" cy="130" r="1.6" fill="#c6a56a" />
        <circle cx="16" cy="80" r="1.4" fill="#c6a56a" />
        <circle cx="104" cy="80" r="1.4" fill="#c6a56a" />
      </svg>
      <p
        className={`font-script pointer-events-none absolute inset-x-0 top-[54%] -translate-y-1/2 text-center leading-none text-[#4e463e] ${compact ? 'text-[1.55rem]' : 'text-[2.65rem]'}`}
      >
        {mark}
      </p>
    </div>
  )
}

/** Rosa branca, folhas de sálvia e pontos de mosquitinho, encostados no selo. */
export function WhiteBouquet({ className = '' }: { className?: string }) {
  const dots = [
    [78, 18], [96, 28], [112, 14], [188, 16], [206, 30], [222, 18], [64, 34], [236, 36], [128, 22], [172, 24],
  ]
  return (
    <svg viewBox="0 0 300 92" className={className} aria-hidden>
      <path d="M150 34C118 22 78 30 42 54c34-6 62-4 90 2-16 8-46 16-78 18 36-8 64-16 96-28z" fill="#8ea488" />
      <path d="M150 34c32-12 72-4 108 20-34-6-62-4-90 2 16 8 46 16 78 18-36-8-64-16-96-28z" fill="#9aaf92" />
      <path d="M118 46c18 4 28 2 36-6-8 14-24 18-40 14 2-4 3-6 4-8z" fill="#c6a56a" />
      <path d="M182 46c-18 4-28 2-36-6 8 14 24 18 40 14-2-4-3-6-4-8z" fill="#c6a56a" />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#fff" />
      ))}
      <g transform="translate(150 30)">
        <circle cx="-18" cy="8" r="14" fill="#fff" />
        <circle cx="18" cy="9" r="14" fill="#f4efe6" />
        <circle cx="0" cy="16" r="15" fill="#fff" />
        <circle cx="-9" cy="4" r="11" fill="#fbf8f2" />
        <circle cx="9" cy="3" r="11" fill="#f6f1e8" />
        <circle cx="0" cy="1" r="8" fill="#fff" />
        <circle cx="0" cy="1" r="3.6" fill="#efd7a4" />
      </g>
    </svg>
  )
}
