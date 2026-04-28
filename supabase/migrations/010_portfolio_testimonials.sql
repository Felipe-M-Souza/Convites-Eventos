-- Depoimentos enviados pela página inicial.
-- Executar no Supabase: SQL Editor -> Run (depois das migrations 001-009).

create extension if not exists pgcrypto;

create table if not exists public.portfolio_testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default '',
  event_context text not null default '',
  message text not null,
  source_path text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  constraint portfolio_testimonials_message_length check (char_length(btrim(message)) between 12 and 1200),
  constraint portfolio_testimonials_client_name_length check (char_length(client_name) <= 120),
  constraint portfolio_testimonials_event_context_length check (char_length(event_context) <= 160)
);

alter table public.portfolio_testimonials enable row level security;

create index if not exists portfolio_testimonials_status_created_idx
  on public.portfolio_testimonials (status, created_at desc);

drop policy if exists "portfolio_testimonials_insert_public" on public.portfolio_testimonials;
drop policy if exists "portfolio_testimonials_select_admin" on public.portfolio_testimonials;
drop policy if exists "portfolio_testimonials_update_admin" on public.portfolio_testimonials;
drop policy if exists "portfolio_testimonials_delete_admin" on public.portfolio_testimonials;

create policy "portfolio_testimonials_insert_public"
  on public.portfolio_testimonials for insert
  with check (
    status = 'pending'
    and char_length(btrim(message)) between 12 and 1200
    and char_length(client_name) <= 120
    and char_length(event_context) <= 160
  );

create policy "portfolio_testimonials_select_admin"
  on public.portfolio_testimonials for select
  using (public.is_admin());

create policy "portfolio_testimonials_update_admin"
  on public.portfolio_testimonials for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "portfolio_testimonials_delete_admin"
  on public.portfolio_testimonials for delete
  using (public.is_admin());

grant insert on public.portfolio_testimonials to anon, authenticated;
grant select, update, delete on public.portfolio_testimonials to authenticated;
