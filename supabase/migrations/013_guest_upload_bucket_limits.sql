-- Align the private guest upload bucket with the client-side limits.
-- Supabase Storage defaults can be lower than the 120 MB video limit shown in the UI.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invite-guest-uploads',
  'invite-guest-uploads',
  false,
  125829120,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
