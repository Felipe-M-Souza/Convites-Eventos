import { useEffect, useState } from 'react'

type DotsProps = {
  count: number
  index: number
  onSelect: (index: number) => void
  label: (index: number) => string
}

/** Bolinhas do carrossel verde. A área de toque é maior que o ponto visível. */
export function SageDots({ count, index, onSelect, label }: DotsProps) {
  if (count < 2) return null
  return (
    <div className="mt-1 flex flex-wrap justify-center">
      {Array.from({ length: count }, (_, dot) => {
        const active = dot === index
        return (
          <button
            key={dot}
            type="button"
            aria-label={label(dot)}
            aria-current={active ? 'true' : undefined}
            onClick={() => onSelect(dot)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center"
          >
            <span
              className={`block h-2.5 w-2.5 rounded-full transition-colors ${active ? 'bg-[#5f734f]' : 'bg-[#c5d5be]'}`}
            />
          </button>
        )
      })}
    </div>
  )
}

/** Avança sozinho e reinicia a espera quando a pessoa escolhe uma bolinha. */
export function useSagePager(length: number, delay = 3500) {
  const [index, setIndex] = useState(0)
  const [clock, setClock] = useState(0)

  useEffect(() => {
    if (length < 2) return undefined
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % length)
    }, delay)
    return () => window.clearInterval(id)
  }, [length, delay, clock])

  useEffect(() => {
    if (length > 0 && index >= length) setIndex(0)
  }, [index, length])

  const select = (next: number) => {
    if (length < 1) return
    const bounded = ((next % length) + length) % length
    setIndex(bounded)
    setClock((value) => value + 1)
  }

  return { index: length > 0 ? index % length : 0, select }
}
