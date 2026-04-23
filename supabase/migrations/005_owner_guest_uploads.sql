-- Donos de convites, uploads de convidados e permissões por papel.
-- Executar no Supabase: SQL Editor -> Run (depois das migrations 001-004).

create extension if not exists pgcrypto;

create table if not exists public.app_account_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'owner')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.app_account_roles enable row level security;

create table if not exists public.invite_owners (
  invite_slug text primary key references public.invite_config (slug) on update cascade on delete cascade,
  owner_user_id uuid unique references auth.users (id) on delete set null,
  owner_email text,
  owner_name text not null default '',
  access_code_hash text not null,
  claimed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.invite_owners enable row level security;

create table if not exists public.guest_uploads (
  id uuid primary key default gen_random_uuid(),
  invite_slug text not null references public.invite_config (slug) on update cascade on delete cascade,
  guest_name text not null default '',
  caption text not null default '',
  original_file_name text not null default '',
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0),
  file_type text not null check (file_type in ('image', 'video')),
  mime_type text not null,
  storage_path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  rejected_at timestamptz
);

alter table public.guest_uploads enable row level security;

create index if not exists app_account_roles_role_idx
  on public.app_account_roles (role);

create index if not exists guest_uploads_invite_status_created_idx
  on public.guest_uploads (invite_slug, status, created_at desc);

create or replace function public.set_updated_at_now()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists invite_owners_set_updated_at on public.invite_owners;

create trigger invite_owners_set_updated_at
before update on public.invite_owners
for each row
execute function public.set_updated_at_now();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_account_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.has_admin_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_account_roles
    where role = 'admin'
  );
$$;

create or replace function public.owns_invite_slug(p_invite_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invite_owners io
    where io.invite_slug = p_invite_slug
      and io.owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_guest_uploads_enabled(p_invite_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invite_config ic
    where ic.slug = p_invite_slug
      and coalesce((ic.payload ->> 'guestUploadsEnabled')::boolean, false)
  );
$$;

create or replace function public.can_read_guest_upload_object(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.owns_invite_slug(split_part(p_storage_path, '/', 1))
    or exists (
      select 1
      from public.guest_uploads gu
      where gu.storage_path = p_storage_path
        and gu.status = 'approved'
    );
$$;

create or replace function public.can_manage_guest_upload_object(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.owns_invite_slug(split_part(p_storage_path, '/', 1));
$$;

create or replace function public.claim_invite_owner(p_invite_slug text, p_access_code text)
returns public.invite_owners
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner public.invite_owners%rowtype;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_hash text := encode(extensions.digest(coalesce(p_access_code, ''), 'sha256'), 'hex');
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_owner
  from public.invite_owners
  where invite_slug = p_invite_slug
  for update;

  if not found then
    raise exception 'INVITE_OWNER_NOT_FOUND';
  end if;

  if coalesce(v_owner.access_code_hash, '') = '' or v_owner.access_code_hash <> v_hash then
    raise exception 'INVALID_ACCESS_CODE';
  end if;

  if v_owner.owner_email is not null and btrim(v_owner.owner_email) <> '' and lower(v_owner.owner_email) <> v_email then
    raise exception 'OWNER_EMAIL_MISMATCH';
  end if;

  if v_owner.owner_user_id is not null and v_owner.owner_user_id <> auth.uid() then
    raise exception 'INVITE_ALREADY_CLAIMED';
  end if;

  update public.invite_owners
  set owner_user_id = auth.uid(),
      owner_email = case
        when v_owner.owner_email is null or btrim(v_owner.owner_email) = '' then nullif(v_email, '')
        else v_owner.owner_email
      end,
      claimed_at = coalesce(v_owner.claimed_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where invite_slug = p_invite_slug
  returning *
  into v_owner;

  insert into public.app_account_roles (user_id, role)
  values (auth.uid(), 'owner')
  on conflict (user_id) do update
    set role = excluded.role
  where public.app_account_roles.role <> 'admin';

  return v_owner;
end;
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_admin_account() to anon, authenticated;
grant execute on function public.owns_invite_slug(text) to anon, authenticated;
grant execute on function public.is_guest_uploads_enabled(text) to anon, authenticated;
grant execute on function public.can_read_guest_upload_object(text) to anon, authenticated;
grant execute on function public.can_manage_guest_upload_object(text) to anon, authenticated;
grant execute on function public.claim_invite_owner(text, text) to authenticated;

drop policy if exists "app_account_roles_select_self_or_admin" on public.app_account_roles;
drop policy if exists "app_account_roles_insert_first_admin" on public.app_account_roles;
drop policy if exists "app_account_roles_update_admin" on public.app_account_roles;
drop policy if exists "app_account_roles_delete_admin" on public.app_account_roles;

create policy "app_account_roles_select_self_or_admin"
  on public.app_account_roles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "app_account_roles_insert_first_admin"
  on public.app_account_roles for insert
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and role = 'admin'
      and not public.has_admin_account()
    )
  );

create policy "app_account_roles_update_admin"
  on public.app_account_roles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "app_account_roles_delete_admin"
  on public.app_account_roles for delete
  using (public.is_admin());

drop policy if exists "invite_insert_authenticated" on public.invite_config;
drop policy if exists "invite_update_authenticated" on public.invite_config;
drop policy if exists "invite_delete_authenticated" on public.invite_config;
drop policy if exists "invite_insert_admin" on public.invite_config;
drop policy if exists "invite_update_admin" on public.invite_config;
drop policy if exists "invite_delete_admin" on public.invite_config;

create policy "invite_insert_admin"
  on public.invite_config for insert
  with check (public.is_admin());

create policy "invite_update_admin"
  on public.invite_config for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "invite_delete_admin"
  on public.invite_config for delete
  using (public.is_admin());

drop policy if exists "invite_owners_select_owner_or_admin" on public.invite_owners;
drop policy if exists "invite_owners_insert_admin" on public.invite_owners;
drop policy if exists "invite_owners_update_admin" on public.invite_owners;
drop policy if exists "invite_owners_delete_admin" on public.invite_owners;

create policy "invite_owners_select_owner_or_admin"
  on public.invite_owners for select
  using (public.is_admin() or owner_user_id = auth.uid());

create policy "invite_owners_insert_admin"
  on public.invite_owners for insert
  with check (public.is_admin());

create policy "invite_owners_update_admin"
  on public.invite_owners for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "invite_owners_delete_admin"
  on public.invite_owners for delete
  using (public.is_admin());

drop policy if exists "guest_uploads_select_public_owner_or_admin" on public.guest_uploads;
drop policy if exists "guest_uploads_insert_public" on public.guest_uploads;
drop policy if exists "guest_uploads_update_owner_or_admin" on public.guest_uploads;
drop policy if exists "guest_uploads_delete_owner_or_admin" on public.guest_uploads;

create policy "guest_uploads_select_public_owner_or_admin"
  on public.guest_uploads for select
  using (
    status = 'approved'
    or public.is_admin()
    or public.owns_invite_slug(invite_slug)
  );

create policy "guest_uploads_insert_public"
  on public.guest_uploads for insert
  with check (
    status = 'pending'
    and public.is_guest_uploads_enabled(invite_slug)
  );

create policy "guest_uploads_update_owner_or_admin"
  on public.guest_uploads for update
  using (public.is_admin() or public.owns_invite_slug(invite_slug))
  with check (public.is_admin() or public.owns_invite_slug(invite_slug));

create policy "guest_uploads_delete_owner_or_admin"
  on public.guest_uploads for delete
  using (public.is_admin() or public.owns_invite_slug(invite_slug));

insert into storage.buckets (id, name, public)
values ('invite-guest-uploads', 'invite-guest-uploads', false)
on conflict (id) do update
  set public = excluded.public;

drop policy if exists "invite_guest_uploads_select_controlled" on storage.objects;
drop policy if exists "invite_guest_uploads_insert_public" on storage.objects;
drop policy if exists "invite_guest_uploads_update_owner_or_admin" on storage.objects;
drop policy if exists "invite_guest_uploads_delete_owner_or_admin" on storage.objects;

create policy "invite_guest_uploads_select_controlled"
  on storage.objects for select
  using (
    bucket_id = 'invite-guest-uploads'
    and public.can_read_guest_upload_object(name)
  );

create policy "invite_guest_uploads_insert_public"
  on storage.objects for insert
  with check (
    bucket_id = 'invite-guest-uploads'
    and public.is_guest_uploads_enabled(split_part(name, '/', 1))
  );

create policy "invite_guest_uploads_update_owner_or_admin"
  on storage.objects for update
  using (
    bucket_id = 'invite-guest-uploads'
    and public.can_manage_guest_upload_object(name)
  );

create policy "invite_guest_uploads_delete_owner_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'invite-guest-uploads'
    and public.can_manage_guest_upload_object(name)
  );
