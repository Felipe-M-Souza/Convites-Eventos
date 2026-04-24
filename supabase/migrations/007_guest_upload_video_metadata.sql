-- Metadados básicos para uploads mobile-first de vídeo.
-- Executar no Supabase: SQL Editor -> Run (depois da 005/006).

alter table public.guest_uploads
add column if not exists duration_seconds integer
check (duration_seconds is null or duration_seconds >= 0);
