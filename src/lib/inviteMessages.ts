import { supabase } from './supabase'

export type InviteMessage = {
  id: string
  invite_slug: string
  guest_name: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const NAME_MIN = 2
const NAME_MAX = 80
const MESSAGE_MIN = 4
const MESSAGE_MAX = 500

export function validateGuestbookDraft(name: string, message: string): 'name' | 'message' | null {
  const cleanName = name.trim()
  const cleanMessage = message.trim()
  if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) return 'name'
  if (cleanMessage.length < MESSAGE_MIN || cleanMessage.length > MESSAGE_MAX) return 'message'
  return null
}

export async function listApprovedInviteMessages(inviteSlug: string): Promise<InviteMessage[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('invite_messages')
    .select('id, invite_slug, guest_name, message, status, created_at')
    .eq('invite_slug', inviteSlug)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) return []
  return (data ?? []) as InviteMessage[]
}

export async function listInviteMessages(inviteSlug: string): Promise<{ rows: InviteMessage[]; error: string | null }> {
  if (!supabase) return { rows: [], error: null }
  const { data, error } = await supabase
    .from('invite_messages')
    .select('id, invite_slug, guest_name, message, status, created_at')
    .eq('invite_slug', inviteSlug)
    .order('created_at', { ascending: false })
    .limit(80)
  if (error) return { rows: [], error: error.message }
  return { rows: (data ?? []) as InviteMessage[], error: null }
}

export async function insertInviteMessage(inviteSlug: string, name: string, message: string): Promise<string | null> {
  if (!supabase) return 'unavailable'
  const { error } = await supabase.from('invite_messages').insert({
    invite_slug: inviteSlug,
    guest_name: name.trim(),
    message: message.trim(),
    status: 'pending',
  })
  return error ? error.message : null
}

export async function setInviteMessageStatus(id: string, status: InviteMessage['status']): Promise<string | null> {
  if (!supabase) return 'unavailable'
  const { error } = await supabase.from('invite_messages').update({ status }).eq('id', id)
  return error ? error.message : null
}
