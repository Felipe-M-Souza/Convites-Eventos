-- Marca se o dono já foi avisado no Telegram (evita mensagem duplicada).

alter table public.orders
  add column if not exists owner_notified_at timestamptz;

comment on column public.orders.owner_notified_at is
  'Quando o aviso de pagamento aprovado foi enviado ao Telegram do dono.';
