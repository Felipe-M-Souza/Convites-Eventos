-- Livro de mensagens do modelo verde.
-- Executar no Supabase: SQL Editor -> Run (depois das migrations 001-018).

create extension if not exists pgcrypto;

create table if not exists public.invite_messages (
  id uuid primary key default gen_random_uuid(),
  invite_slug text not null,
  guest_name text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint invite_messages_slug_length check (
    char_length(invite_slug) between 2 and 64
    and invite_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint invite_messages_name_length check (char_length(btrim(guest_name)) between 2 and 80),
  constraint invite_messages_message_length check (char_length(btrim(message)) between 4 and 500)
);

alter table public.invite_messages enable row level security;

create index if not exists invite_messages_slug_status_created_idx
  on public.invite_messages (invite_slug, status, created_at desc);

drop policy if exists "invite_messages_insert_public" on public.invite_messages;
drop policy if exists "invite_messages_select_public_approved_or_admin" on public.invite_messages;
drop policy if exists "invite_messages_update_admin" on public.invite_messages;
drop policy if exists "invite_messages_delete_admin" on public.invite_messages;

create policy "invite_messages_insert_public"
  on public.invite_messages for insert
  with check (
    status = 'pending'
    and char_length(invite_slug) between 2 and 64
    and invite_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(btrim(guest_name)) between 2 and 80
    and char_length(btrim(message)) between 4 and 500
  );

create policy "invite_messages_select_public_approved_or_admin"
  on public.invite_messages for select
  using (status = 'approved' or public.is_admin());

create policy "invite_messages_update_admin"
  on public.invite_messages for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "invite_messages_delete_admin"
  on public.invite_messages for delete
  using (public.is_admin());

grant select, insert on public.invite_messages to anon, authenticated;
grant update, delete on public.invite_messages to authenticated;
