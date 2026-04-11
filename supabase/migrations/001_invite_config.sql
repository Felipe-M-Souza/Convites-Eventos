-- Executar no Supabase: SQL Editor → New query → Run
-- Tabela única com JSON do convite (espelha `EventData` no frontend).

create table if not exists public.invite_config (
  id text primary key,
  payload jsonb not null default '{}'::jsonb
);

alter table public.invite_config enable row level security;

-- Visitantes: leitura pública (chave anónima só faz SELECT).
create policy "invite_select_public"
  on public.invite_config for select
  using (true);

-- Utilizadores autenticados (painel /admin): inserir e atualizar.
create policy "invite_insert_authenticated"
  on public.invite_config for insert
  with check (auth.role() = 'authenticated');

create policy "invite_update_authenticated"
  on public.invite_config for update
  using (auth.role() = 'authenticated');
