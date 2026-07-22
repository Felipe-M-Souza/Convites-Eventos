-- Status público do pedido (só status), para a página /pagamento/pendente fazer polling.
-- O UUID do pedido funciona como token de acesso (não listável).

create or replace function public.get_order_payment_status(p_order_id uuid)
returns table (
  status text,
  mp_status text,
  paid_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select o.status, o.mp_status, o.paid_at
  from public.orders o
  where o.id = p_order_id;
$$;

revoke all on function public.get_order_payment_status(uuid) from public;
grant execute on function public.get_order_payment_status(uuid) to anon, authenticated;

comment on function public.get_order_payment_status(uuid) is
  'Retorna status do pedido para a tela de retorno do checkout (polling Pix).';
