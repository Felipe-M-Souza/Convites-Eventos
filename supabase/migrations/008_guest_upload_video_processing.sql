-- Estados e caminhos de processamento assíncrono de vídeo.
-- Executar no Supabase: SQL Editor -> Run (depois da 005/006/007).

alter table public.guest_uploads
add column if not exists original_file_size_bytes bigint not null default 0
check (original_file_size_bytes >= 0);

alter table public.guest_uploads
add column if not exists processed_file_size_bytes bigint
check (processed_file_size_bytes is null or processed_file_size_bytes >= 0);

alter table public.guest_uploads
add column if not exists processed_storage_path text;

alter table public.guest_uploads
add column if not exists processing_status text not null default 'ready'
check (processing_status in ('uploaded', 'processing', 'ready', 'failed'));

alter table public.guest_uploads
add column if not exists processing_error text;

update public.guest_uploads
set original_file_size_bytes = file_size_bytes
where coalesce(original_file_size_bytes, 0) = 0;

update public.guest_uploads
set processing_status = case
  when file_type = 'video' then 'uploaded'
  else 'ready'
end
where processing_status is null
   or processing_status = 'ready';

create unique index if not exists guest_uploads_processed_storage_path_key
  on public.guest_uploads (processed_storage_path)
  where processed_storage_path is not null;

create index if not exists guest_uploads_processing_status_idx
  on public.guest_uploads (processing_status);

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
      where (gu.storage_path = p_storage_path or gu.processed_storage_path = p_storage_path)
        and gu.status = 'approved'
        and (gu.file_type <> 'video' or gu.processing_status = 'ready')
    );
$$;

grant execute on function public.can_read_guest_upload_object(text) to anon, authenticated;

drop policy if exists "invite_guest_uploads_insert_public" on storage.objects;

create policy "invite_guest_uploads_insert_public"
  on storage.objects for insert
  with check (
    bucket_id = 'invite-guest-uploads'
    and public.is_guest_uploads_enabled(split_part(name, '/', 1))
    and split_part(name, '/', 2) = 'original'
  );
