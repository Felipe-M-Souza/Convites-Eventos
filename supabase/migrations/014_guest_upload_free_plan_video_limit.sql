-- Supabase Free projects enforce a 50 MB global Storage upload limit.
-- Keep the guest uploads bucket aligned so client-side copy and Storage limits match.

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ]
where id = 'invite-guest-uploads';
