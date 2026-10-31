export type DressAvoidColor = {
  label: string
  hex: string
}

/** Cores vetadas pela cliente. A escrita fica à frente da bolinha. */
export const DRESS_AVOID_BY_SLUG: Record<string, { note: string; colors: DressAvoidColor[] }> = {
  'kemilly-15-anos': {
    note: 'Não pode ser utilizado',
    colors: [
      { label: 'Rosa', hex: '#e56b98' },
      { label: 'Rosa claro', hex: '#f6c6d6' },
      { label: 'Rosê', hex: '#c48996' },
      { label: 'Rosa pink', hex: '#ff4f9a' },
    ],
  },
}

export function dressAvoidFor(slug?: string) {
  if (!slug) return undefined
  return DRESS_AVOID_BY_SLUG[slug]
}
