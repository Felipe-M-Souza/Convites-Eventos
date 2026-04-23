-- Corrige a função de vinculação do dono do convite no Supabase.
-- Em projetos Supabase, `digest` costuma ficar no schema `extensions`.

create extension if not exists pgcrypto with schema extensions;

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

grant execute on function public.claim_invite_owner(text, text) to authenticated;
