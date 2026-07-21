// Supabase Edge Function: create-mercadopago-preference
// Cria um pedido em `orders` e uma preferência Checkout Pro no Mercado Pago.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''
const PUBLIC_SITE_URL = (Deno.env.get('PUBLIC_SITE_URL') ?? Deno.env.get('VITE_PUBLIC_SITE_URL') ?? 'https://www.convitesdiversos.com.br').replace(/\/$/, '')

/** Espelha a oferta vigente do frontend (`src/config/pricing.ts`). */
const PLANS = {
  unico: {
    title: 'Convite digital',
    amountCents: 5_000,
    currency: 'BRL',
  },
} as const

type PlanKey = keyof typeof PLANS

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  })
}

function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === 'string' && value in PLANS
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
  }

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return json({ error: 'MERCADOPAGO_NOT_CONFIGURED' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({})) as {
    planKey?: string
    payerEmail?: string
    payerName?: string
    customerNote?: string
    sourcePath?: string
    locale?: string
  }

  const planKey = isPlanKey(body.planKey) ? body.planKey : 'unico'
  const plan = PLANS[planKey]
  const payerEmail = typeof body.payerEmail === 'string' ? body.payerEmail.trim().slice(0, 180) : ''
  const payerName = typeof body.payerName === 'string' ? body.payerName.trim().slice(0, 120) : ''
  const customerNote = typeof body.customerNote === 'string' ? body.customerNote.trim().slice(0, 500) : ''
  const sourcePath = typeof body.sourcePath === 'string' ? body.sourcePath.trim().slice(0, 200) : '/'
  const locale = typeof body.locale === 'string' ? body.locale.trim().slice(0, 12) : 'pt-BR'

  const orderId = crypto.randomUUID()
  const externalReference = orderId
  const unitPrice = plan.amountCents / 100

  const { error: insertError } = await supabase.from('orders').insert({
    id: orderId,
    status: 'pending',
    plan_key: planKey,
    title: plan.title,
    amount_cents: plan.amountCents,
    currency: plan.currency,
    payer_email: payerEmail || null,
    payer_name: payerName || null,
    customer_note: customerNote,
    source_path: sourcePath || '/',
    locale,
    external_reference: externalReference,
  })

  if (insertError) {
    console.error('[create-mercadopago-preference] insert', insertError.message)
    return json({ error: 'ORDER_CREATE_FAILED', details: insertError.message }, { status: 500 })
  }

  const preferencePayload = {
    items: [
      {
        id: planKey,
        title: plan.title,
        description: 'Convite digital personalizado — Convites Diversos',
        quantity: 1,
        currency_id: plan.currency,
        unit_price: unitPrice,
      },
    ],
    external_reference: externalReference,
    metadata: {
      order_id: orderId,
      plan_key: planKey,
      source_path: sourcePath,
    },
    back_urls: {
      success: `${PUBLIC_SITE_URL}/pagamento/sucesso?order=${encodeURIComponent(orderId)}`,
      pending: `${PUBLIC_SITE_URL}/pagamento/pendente?order=${encodeURIComponent(orderId)}`,
      failure: `${PUBLIC_SITE_URL}/pagamento/erro?order=${encodeURIComponent(orderId)}`,
    },
    auto_return: 'approved',
    notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
    statement_descriptor: 'CONVITES DIVERSOS',
    ...(payerEmail
      ? {
          payer: {
            email: payerEmail,
            ...(payerName ? { name: payerName } : {}),
          },
        }
      : {}),
  }

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferencePayload),
  })

  const mpJson = await mpResponse.json().catch(() => ({})) as {
    id?: string
    init_point?: string
    sandbox_init_point?: string
    message?: string
    error?: string
  }

  if (!mpResponse.ok || !mpJson.id || !(mpJson.init_point || mpJson.sandbox_init_point)) {
    console.error('[create-mercadopago-preference] mp', mpResponse.status, mpJson)
    await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
    return json(
      {
        error: 'PREFERENCE_CREATE_FAILED',
        details: mpJson.message || mpJson.error || `HTTP ${mpResponse.status}`,
      },
      { status: 502 },
    )
  }

  const checkoutUrl = mpJson.init_point || mpJson.sandbox_init_point!

  await supabase
    .from('orders')
    .update({
      mp_preference_id: mpJson.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  return json({
    orderId,
    preferenceId: mpJson.id,
    checkoutUrl,
  })
})
