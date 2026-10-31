type Props = {
  names: string[]
  elegant?: boolean
  className?: string
  as?: 'h1' | 'div'
}

/** Nomes do casal. No modo elegante, o e comercial fica entre os dois nomes, em letra script. */
export function SageCoupleNames({ names, elegant = false, className = '', as: Tag = 'div' }: Props) {
  if (elegant && names.length >= 2) {
    return (
      <Tag className={`font-script leading-[1.05] ${className}`}>
        <span className="block">{names[0]}</span>
        <span className="block text-[0.62em] leading-none">&</span>
        <span className="block">{names[1]}</span>
      </Tag>
    )
  }

  return (
    <Tag className={`font-display leading-none ${className}`}>
      {names.map((name, index) => (
        <span key={`${name}-${index}`} className="block">
          {name}
        </span>
      ))}
    </Tag>
  )
}
