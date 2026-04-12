-- URL pública por convite: /c/<slug>
-- Executar no Supabase: SQL Editor → Run (depois da 001).

alter table public.invite_config add column if not exists slug text;

update public.invite_config set slug = id where slug is null;

alter table public.invite_config alter column slug set not null;

create unique index if not exists invite_config_slug_key on public.invite_config (slug);
