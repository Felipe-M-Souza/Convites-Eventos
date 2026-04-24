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
export const MAX_GUEST_VIDEO_BYTES = 120 * 1024 * 1024
export const MAX_GUEST_VIDEO_DURATION_SECONDS = 60

export type GuestUploadStatus = 'pending' | 'approved' | 'rejected'
export type GuestUploadKind = 'image' | 'video'
export type GuestUploadProcessingStatus = 'uploaded' | 'processing' | 'ready' | 'failed'

export type GuestUploadSelection = {
  kind: GuestUploadKind
  durationSeconds: number | null
}

export type GuestUploadRecord = {
  id: string
  invite_slug: string
  guest_name: string
  caption: string
  original_file_name: string
  file_size_bytes: number
  original_file_size_bytes: number
  processed_file_size_bytes: number | null
  duration_seconds: number | null
  file_type: GuestUploadKind
  mime_type: string
  storage_path: string
  processed_storage_path: string | null
  processing_status: GuestUploadProcessingStatus
  processing_error: string | null
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

function padTime(value: number) {
  return value.toString().padStart(2, '0')
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

export function formatGuestUploadBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatGuestUploadDuration(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return ''
  const rounded = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(rounded / 60)
  const rest = rounded % 60
  return `${padTime(minutes)}:${padTime(rest)}`
}

export async function readGuestUploadSelection(file: File): Promise<GuestUploadSelection> {
  const kind = detectGuestUploadKind(file)
  if (kind !== 'video') {
    return { kind, durationSeconds: null }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const durationSeconds = await new Promise<number>((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.playsInline = true

      const cleanup = () => {
        video.removeAttribute('src')
        video.load()
      }

      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0
        cleanup()
        resolve(duration)
      }

      video.onerror = () => {
        cleanup()
        reject(new Error('Não foi possível ler a duração do vídeo.'))
      }

      video.src = objectUrl
    })

    return { kind, durationSeconds }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function validateGuestUploadFile(
  file: File,
  selection?: GuestUploadSelection | null,
): { ok: true } | { ok: false; message: string } {
  if (!GUEST_UPLOAD_ACCEPT.split(',').includes(file.type)) {
    return { ok: false, message: 'Formato não suportado. Envie JPG, PNG, WEBP, MP4, MOV ou WEBM.' }
  }

  const kind = selection?.kind ?? detectGuestUploadKind(file)
  const maxBytes = kind === 'video' ? MAX_GUEST_VIDEO_BYTES : MAX_GUEST_IMAGE_BYTES

  if (file.size > maxBytes) {
    const maxLabel = kind === 'video' ? '120 MB' : '12 MB'
    return { ok: false, message: `O arquivo excede o limite de ${maxLabel}.` }
  }

  if (kind === 'video') {
    const durationSeconds = selection?.durationSeconds
    if (durationSeconds == null) {
      return { ok: false, message: 'Não foi possível validar a duração do vídeo. Tente novamente.' }
    }

    if (durationSeconds > MAX_GUEST_VIDEO_DURATION_SECONDS) {
      return {
        ok: false,
        message: `O vídeo excede o limite de ${MAX_GUEST_VIDEO_DURATION_SECONDS} segundos. Envie um vídeo curto, de até 1 minuto.`,
      }
    }
  }

  return { ok: true }
}

export function buildGuestUploadPath(inviteSlug: string, uploadId: string, file: File) {
  const slug = normalizeInviteSlug(inviteSlug) ?? 'default'
  const ext = extensionFromFile(file)
  return `${slug}/original/${uploadId}.${ext}`
}

export function buildProcessedGuestUploadPath(inviteSlug: string, uploadId: string) {
  const slug = normalizeInviteSlug(inviteSlug) ?? 'default'
  return `${slug}/processed/${uploadId}.mp4`
}

export function getGuestUploadPreviewPath(upload: Pick<GuestUploadRecord, 'file_type' | 'processing_status' | 'storage_path' | 'processed_storage_path'>) {
  if (upload.file_type === 'image') return upload.storage_path
  if (upload.processing_status !== 'ready') return ''
  return upload.processed_storage_path || upload.storage_path
}

export function getGuestUploadDisplaySize(upload: Pick<GuestUploadRecord, 'processed_file_size_bytes' | 'file_size_bytes'>) {
  return upload.processed_file_size_bytes ?? upload.file_size_bytes
}

export function getGuestUploadProcessingLabel(
  upload: Pick<GuestUploadRecord, 'file_type' | 'processing_status' | 'status'>,
) {
  if (upload.file_type !== 'video') return upload.status === 'approved' ? 'Aprovado' : upload.status === 'rejected' ? 'Rejeitado' : 'Pendente'

  switch (upload.processing_status) {
    case 'uploaded':
      return 'Aguardando processamento'
    case 'processing':
      return 'Processando vídeo'
    case 'ready':
      return upload.status === 'approved' ? 'Aprovado' : upload.status === 'rejected' ? 'Rejeitado' : 'Pronto para aprovação'
    case 'failed':
      return 'Falha no processamento'
    default:
      return 'Pendente'
  }
}

export function canApproveGuestUpload(
  upload: Pick<GuestUploadRecord, 'file_type' | 'processing_status' | 'status'>,
) {
  if (upload.status === 'approved') return false
  if (upload.file_type !== 'video') return true
  return upload.processing_status === 'ready'
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

export async function requestGuestVideoProcessing(
  supabase: SupabaseClient,
  uploadId: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('process-guest-video', {
    body: { uploadId },
  })

  if (error) throw new Error(error.message)
}

export async function removeGuestUploadObject(supabase: SupabaseClient, storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(GUEST_UPLOADS_BUCKET).remove([storagePath])
  if (error) throw new Error(error.message)
}

export async function removeGuestUploadAssets(
  supabase: SupabaseClient,
  paths: Array<string | null | undefined>,
): Promise<void> {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean) as string[]))
  if (!uniquePaths.length) return

  const { error } = await supabase.storage.from(GUEST_UPLOADS_BUCKET).remove(uniquePaths)
  if (error) throw new Error(error.message)
}

export async function removeGuestUploadFolderContents(
  supabase: SupabaseClient,
  inviteSlug: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('guest_uploads')
    .select('storage_path, processed_storage_path')
    .eq('invite_slug', inviteSlug)
  if (error) throw new Error(error.message)

  const paths = Array.from(
    new Set(
      (data ?? []).flatMap((row) => [row.storage_path, row.processed_storage_path].filter(Boolean) as string[]),
    ),
  )
  if (!paths.length) return

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
