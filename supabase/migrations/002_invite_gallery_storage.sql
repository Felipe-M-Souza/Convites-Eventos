-- Bucket público para fotos da galeria (upload no /admin).
-- Executar no Supabase: SQL Editor → Run (depois da 001).

insert into storage.buckets (id, name, public)
values ('invite-gallery', 'invite-gallery', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "invite_gallery_select_public" on storage.objects;
drop policy if exists "invite_gallery_insert_authenticated" on storage.objects;
drop policy if exists "invite_gallery_update_authenticated" on storage.objects;
drop policy if exists "invite_gallery_delete_authenticated" on storage.objects;

create policy "invite_gallery_select_public"
  on storage.objects for select
  using (bucket_id = 'invite-gallery');

create policy "invite_gallery_insert_authenticated"
  on storage.objects for insert
  with check (bucket_id = 'invite-gallery' and auth.role() = 'authenticated');

create policy "invite_gallery_update_authenticated"
  on storage.objects for update
  using (bucket_id = 'invite-gallery' and auth.role() = 'authenticated');

create policy "invite_gallery_delete_authenticated"
  on storage.objects for delete
  using (bucket_id = 'invite-gallery' and auth.role() = 'authenticated');
