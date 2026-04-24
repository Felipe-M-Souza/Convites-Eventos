alter table public.guest_uploads
add column if not exists expires_at timestamptz;

alter table public.guest_uploads
add column if not exists deleted_at timestamptz;

update public.guest_uploads
set expires_at = coalesce(expires_at, created_at + interval '5 days')
where expires_at is null;

alter table public.guest_uploads
alter column expires_at set default (timezone('utc', now()) + interval '5 days');

create index if not exists guest_uploads_expires_at_idx
  on public.guest_uploads (expires_at)
  where deleted_at is null;
