-- Evita envio duplicado de purchase ao GA4 (Measurement Protocol).

alter table public.orders
  add column if not exists ga4_purchase_sent_at timestamptz;

comment on column public.orders.ga4_purchase_sent_at is
  'Quando o evento purchase foi enviado ao GA4 via Measurement Protocol.';
