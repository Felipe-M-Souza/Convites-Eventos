-- Pedidos / checkout Mercado Pago (Checkout Pro).
-- Executar no Supabase: SQL Editor -> Run.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'in_process', 'rejected', 'cancelled', 'refunded', 'charged_back')),
  plan_key text not null default 'unico',
  title text not null default 'Convite digital',
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'BRL',
  payer_email text,
  payer_name text,
  customer_note text not null default '',
  source_path text not null default '',
  locale text not null default 'pt-BR',
  mp_preference_id text,
  mp_payment_id text,
  mp_status text,
  mp_status_detail text,
  mp_payment_type text,
  external_reference text not null unique,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_mp_payment_id_idx on public.orders (mp_payment_id);

alter table public.orders enable row level security;

-- Sem INSERT/UPDATE públicos: só Edge Functions com service role.
-- Admin autenticado pode listar pedidos no painel.
drop policy if exists "orders_admin_select_all" on public.orders;
create policy "orders_admin_select_all"
  on public.orders
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_account_roles r
      where r.user_id = auth.uid()
        and r.role = 'admin'
    )
  );

comment on table public.orders is
  'Pedidos do checkout Mercado Pago. Criação e atualização só via Edge Functions (service role).';
