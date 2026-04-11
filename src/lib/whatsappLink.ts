import type { EventData } from '../data/eventData'

type DataWithLegacy = EventData & { rsvpWhatsappLink?: string }

/** Extrai número e texto de um URL `wa.me` (texto já vem decodificado de `URLSearchParams`). */
export function parseWaMeLink(link: string): { phone: string; message: string } | null {
  try {
    const url = new URL(link)
    if (!url.hostname.endsWith('wa.me')) return null
    const phone = url.pathname.replace(/\D/g, '')
    if (!phone) return null
    const message = url.searchParams.get('text') ?? ''
    return { phone, message }
  } catch {
    return null
  }
}

/**
 * Gera o link wa.me com `encodeURIComponent` na mensagem (evita texto corrompido no app).
 * Se existir `rsvpWhatsappPhone` + `rsvpWhatsappMessage`, usa-os; senão tenta o campo legado `rsvpWhatsappLink`.
 */
export function buildRsvpWhatsappHref(data: EventData): string {
  const d = data as DataWithLegacy
  const phone = d.rsvpWhatsappPhone?.replace(/\D/g, '') ?? ''
  const msg = d.rsvpWhatsappMessage?.trim() ?? ''
  if (phone && msg) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }
  const legacy = d.rsvpWhatsappLink?.trim()
  return legacy || '#'
}
