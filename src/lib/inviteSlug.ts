/** Slug seguro para URL (/c/maria-joao). */
export function normalizeInviteSlug(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
  if (s.length < 2 || s.length > 64) return null
  return s
}
