import { normalizeInviteSlug } from './inviteSlug'

const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateOwnerAccessCode(groups = 3, groupSize = 4): string {
  const chunks: string[] = []

  for (let groupIndex = 0; groupIndex < groups; groupIndex += 1) {
    let chunk = ''
    for (let i = 0; i < groupSize; i += 1) {
      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      chunk += ACCESS_CODE_ALPHABET[array[0]! % ACCESS_CODE_ALPHABET.length]
    }
    chunks.push(chunk)
  }

  return chunks.join('-')
}

export function normalizeOwnerAccessCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '')
}

export async function hashOwnerAccessCode(raw: string): Promise<string> {
  const normalized = normalizeOwnerAccessCode(raw)
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function buildOwnerClaimUrl(inviteSlug: string, accessCode: string) {
  const url = new URL('/owner/claim', window.location.origin)
  url.searchParams.set('slug', normalizeInviteSlug(inviteSlug) ?? inviteSlug.trim())
  url.searchParams.set('code', normalizeOwnerAccessCode(accessCode))
  return url.toString()
}
