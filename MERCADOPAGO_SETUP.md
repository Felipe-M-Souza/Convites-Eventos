# Mercado Pago (Checkout Pro)

Checkout de venda do convite digital (oferta única em `src/config/pricing.ts`) via **Checkout Pro** do Mercado Pago, com pedidos em Supabase e webhooks.

## Fluxo

1. Visitante clica em **Pagar** no site.
2. Frontend chama a Edge Function `create-mercadopago-preference` (anon key).
3. A função cria uma linha em `orders` e uma preferência no MP (preço fixo no servidor).
4. O browser redireciona para `init_point` / `sandbox_init_point`.
5. Após o pagamento, o MP notifica `mercadopago-webhook`, que consulta o pagamento na API e atualiza `orders`.
6. O visitante volta para `/pagamento/sucesso|pendente|erro`.

## 1. Migration

No SQL Editor do Supabase, execute:

`supabase/migrations/015_orders_mercadopago.sql`

## 2. Secrets (Edge Functions)

No painel Supabase → **Edge Functions** → **Secrets** (ou CLI):

```bash
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
supabase secrets set PUBLIC_SITE_URL=https://www.convitesdiversos.com.br
```

- **Access Token**: [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app) → sua aplicação → Credenciais de produção (ou teste).
- `PUBLIC_SITE_URL` deve ser o domínio HTTPS público (usado em `back_urls`).
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem no runtime das functions.

## 3. Deploy das functions

```bash
supabase functions deploy create-mercadopago-preference
supabase functions deploy mercadopago-webhook --no-verify-jwt
```

O webhook **precisa** de `--no-verify-jwt`: o Mercado Pago chama a URL sem o JWT do Supabase.

URL do webhook (também enviada em `notification_url` ao criar a preferência):

`https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`

## 4. Frontend

Não há token do Mercado Pago no browser. Basta o CMS já configurado:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_PUBLIC_SITE_URL=https://www.convitesdiversos.com.br
```

CTAs de pagamento: `PayCheckoutButton` em home (`#planos`), landings de serviço e popup promocional. WhatsApp permanece como canal secundário.

A página `/pagamento/pendente` faz polling do status (Pix costuma voltar `pending` e só depois aprovar). Deploy também:

```bash
supabase functions deploy resolve-order-payment
```

No SQL Editor, execute `supabase/migrations/016_get_order_payment_status.sql` (fallback de leitura do status).

## 5. Teste

1. Use credenciais de **teste** do MP e um [cartão de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards).
2. Clique em Pagar → conclua no sandbox → confira status em `orders` no Table Editor.
3. Confirme que o webhook recebeu a notificação (Logs da function).

## 6. Operação

Pedidos ficam na tabela `orders`. Contas `admin` podem fazer `SELECT` via RLS; criação/atualização só com service role (Edge Functions).

Após pagamento aprovado, o processo comercial (briefing / personalização) continua por WhatsApp — a página de sucesso orienta o cliente a falar consigo.
