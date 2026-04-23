import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeInviteSlug } from './inviteSlug'

export const GUEST_UPLOADS_BUCKET = 'invite-guest-uploads'

export const GUEST_UPLOAD_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
].join(',')

export const MAX_GUEST_IMAGE_BYTES = 12 * 1024 * 1024
export const MAX_GUEST_VIDEO_BYTES = 80 * 1024 * 1024

export type GuestUploadStatus = 'pending' | 'approved' | 'rejected'
export type GuestUploadKind = 'image' | 'video'

export type GuestUploadRecord = {
  id: string
  invite_slug: string
  guest_name: string
  caption: string
  original_file_name: string
  file_size_bytes: number
  file_type: GuestUploadKind
  mime_type: string
  storage_path: string
  status: GuestUploadStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  approved_at: string | null
  rejected_at: string | null
}

export type GuestUploadWithUrl = GuestUploadRecord & {
  signedUrl: string
}

function extensionFromFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext) return ext.replace(/[^a-z0-9]/g, '')
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/webm') return 'webm'
  if (file.type === 'video/quicktime') return 'mov'
  return 'bin'
}

export function detectGuestUploadKind(file: File): GuestUploadKind {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

export function validateGuestUploadFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!GUEST_UPLOAD_ACCEPT.split(',').includes(file.type)) {
    return { ok: false, message: 'Formato não suportado. Envie JPG, PNG, WEBP, MP4, MOV ou WEBM.' }
  }

  const kind = detectGuestUploadKind(file)
  const maxBytes = kind === 'video' ? MAX_GUEST_VIDEO_BYTES : MAX_GUEST_IMAGE_BYTES

  if (file.size > maxBytes) {
    const maxLabel = kind === 'video' ? '80 MB' : '12 MB'
    return { ok: false, message: `O arquivo excede o limite de ${maxLabel}.` }
  }

  return { ok: true }
}

export function buildGuestUploadPath(inviteSlug: string, uploadId: string, file: File) {
  const slug = normalizeInviteSlug(inviteSlug) ?? 'default'
  const ext = extensionFromFile(file)
  return `${slug}/${uploadId}.${ext}`
}

export async function uploadGuestUploadFile(
  supabase: SupabaseClient,
  inviteSlug: string,
  uploadId: string,
  file: File,
): Promise<string> {
  const path = buildGuestUploadPath(inviteSlug, uploadId, file)
  const { error } = await supabase.storage.from(GUEST_UPLOADS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) throw new Error(error.message)
  return path
}

export async function removeGuestUploadObject(supabase: SupabaseClient, storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(GUEST_UPLOADS_BUCKET).remove([storagePath])
  if (error) throw new Error(error.message)
}

export async function removeGuestUploadFolderContents(
  supabase: SupabaseClient,
  inviteSlug: string,
): Promise<void> {
  const folder = normalizeInviteSlug(inviteSlug) ?? 'default'
  const { data, error } = await supabase.storage.from(GUEST_UPLOADS_BUCKET).list(folder, { limit: 500 })
  if (error) throw new Error(error.message)
  if (!data?.length) return

  const paths = data.map((item) => `${folder}/${item.name}`)
  const { error: removeError } = await supabase.storage.from(GUEST_UPLOADS_BUCKET).remove(paths)
  if (removeError) throw new Error(removeError.message)
}

export async function createGuestUploadSignedUrls(
  supabase: SupabaseClient,
  storagePaths: string[],
  expiresInSeconds = 60 * 60,
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(storagePaths.filter(Boolean)))
  if (!unique.length) return {}

  const { data, error } = await supabase.storage
    .from(GUEST_UPLOADS_BUCKET)
    .createSignedUrls(unique, expiresInSeconds)

  if (error) throw new Error(error.message)

  return Object.fromEntries(
    unique.map((path, index) => {
      const row = data?.[index]
      return [path, row?.signedUrl ?? '']
    }),
  )
}
