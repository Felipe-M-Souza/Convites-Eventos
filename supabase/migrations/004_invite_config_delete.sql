-- Apagar convites a partir do painel (/admin).
-- Executar no Supabase: SQL Editor → Run.

drop policy if exists "invite_delete_authenticated" on public.invite_config;

create policy "invite_delete_authenticated"
  on public.invite_config for delete
  using (auth.role() = 'authenticated');
