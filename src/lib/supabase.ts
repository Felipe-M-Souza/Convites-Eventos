import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

function buildStorageUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.hostname.endsWith('.supabase.co')) {
      parsed.hostname = parsed.hostname.replace(/\.supabase\.co$/, '.storage.supabase.co')
    }
    return parsed.origin
  } catch {
    return rawUrl
  }
}

export const isCmsConfigured = Boolean(url && anonKey)
export const supabaseUrl = url ?? ''
export const supabaseStorageUrl = url ? buildStorageUrl(url) : ''
export const supabaseAnonKey = anonKey ?? ''

export const supabase: SupabaseClient | null =
  isCmsConfigured && url && anonKey ? createClient(url, anonKey) : null
