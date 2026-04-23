import type { SupabaseClient } from '@supabase/supabase-js'

export type AppRole = 'admin' | 'owner'

type RoleRow = {
  role: AppRole
}

export async function fetchCurrentAppRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from('app_account_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as RoleRow | null)?.role ?? null
}

export async function hasAnyAdminAccount(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_admin_account')
  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function bootstrapCurrentUserAsFirstAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('app_account_roles').insert({ user_id: userId, role: 'admin' })
  if (error) throw new Error(error.message)
}
