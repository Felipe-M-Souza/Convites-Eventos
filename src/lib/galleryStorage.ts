import type { SupabaseClient } from '@supabase/supabase-js'

export const GALLERY_BUCKET = 'invite-gallery'

const CONFIG_FOLDER = 'default'

export function galleryObjectPath(fileName: string): string {
  return `${CONFIG_FOLDER}/${fileName}`
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
): Promise<string> {
  const name = `${crypto.randomUUID()}.jpg`
  const path = galleryObjectPath(name)
  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
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
