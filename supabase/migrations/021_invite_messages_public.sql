-- Recados do livro aparecem na hora.
-- O admin continua podendo ocultar um recado (status rejected).

update public.invite_messages
set status = 'approved'
where status = 'pending';

alter table public.invite_messages
  alter column status set default 'approved';

drop policy if exists "invite_messages_insert_public" on public.invite_messages;
drop policy if exists "invite_messages_select_public_approved_or_admin" on public.invite_messages;
drop policy if exists "invite_messages_select_public_visible_or_admin" on public.invite_messages;

create policy "invite_messages_insert_public"
  on public.invite_messages for insert
  with check (
    status in ('pending', 'approved')
    and char_length(invite_slug) between 2 and 64
    and invite_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(btrim(guest_name)) between 2 and 80
    and char_length(btrim(message)) between 4 and 500
  );

create policy "invite_messages_select_public_visible_or_admin"
  on public.invite_messages for select
  using (status in ('pending', 'approved') or public.is_admin());
