import type { SupabaseClient } from '@supabase/supabase-js'

export const GALLERY_BUCKET = 'invite-gallery'

function sanitizeFolder(folder: string): string {
  const s = folder.replace(/[^a-z0-9-]/gi, '').slice(0, 64)
  return s || 'default'
}

export function galleryObjectPath(folder: string, fileName: string): string {
  return `${sanitizeFolder(folder)}/${fileName}`
}

export function getGalleryPublicUrl(supabase: SupabaseClient, objectPath: string): string {
  const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(objectPath)
  return data.publicUrl
}

/** Extrai o caminho no bucket a partir do URL público do Supabase, ou null se for URL externo. */
export function pathFromInviteGalleryPublicUrl(publicUrl: string): string | null {
  try {
    const marker = `/object/public/${GALLERY_BUCKET}/`
    const i = publicUrl.indexOf(marker)
    if (i === -1) return null
    const rest = publicUrl.slice(i + marker.length)
    const path = rest.split('?')[0]
    return path ? decodeURIComponent(path) : null
  } catch {
    return null
  }
}

export async function uploadGalleryJpeg(
  supabase: SupabaseClient,
  blob: Blob,
  folder: string,
): Promise<string> {
  const name = `${crypto.randomUUID()}.jpg`
  const path = galleryObjectPath(folder, name)
  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return getGalleryPublicUrl(supabase, path)
}

/** Upload genérico (PNG/WebP/áudio, etc.) para o bucket `invite-gallery`. */
export async function uploadGalleryBlob(
  supabase: SupabaseClient,
  body: Blob,
  folder: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || `${crypto.randomUUID()}.bin`
  const path = galleryObjectPath(folder, safe)
  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, body, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return getGalleryPublicUrl(supabase, path)
}

export async function removeGalleryObject(
  supabase: SupabaseClient,
  publicUrl: string,
): Promise<void> {
  const path = pathFromInviteGalleryPublicUrl(publicUrl)
  if (!path) return
  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

/** Remove todos os ficheiros JPEG da pasta do slug no bucket (best-effort após apagar convite). */
export async function removeGalleryFolderContents(
  supabase: SupabaseClient,
  folder: string,
): Promise<void> {
  const prefix = sanitizeFolder(folder)
  const { data: items, error: listErr } = await supabase.storage
    .from(GALLERY_BUCKET)
    .list(prefix, { limit: 500 })
  if (listErr) throw new Error(listErr.message)
  if (!items?.length) return
  const paths = items.map((f) => `${prefix}/${f.name}`)
  const { error: remErr } = await supabase.storage.from(GALLERY_BUCKET).remove(paths)
  if (remErr) throw new Error(remErr.message)
}
