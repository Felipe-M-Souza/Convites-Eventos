// Supabase Edge Function: mercadopago-webhook
// Recebe notificações do Mercado Pago e atualiza `orders`.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { maybeNotifyOwnerPaymentApproved } from '../_shared/ownerTelegram.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

function mapPaymentStatus(mpStatus: string | undefined): string {
  switch ((mpStatus ?? '').toLowerCase()) {
    case 'approved':
      return 'approved'
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return 'in_process'
    case 'rejected':
      return 'rejected'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    case 'charged_back':
      return 'charged_back'
    default:
      return 'pending'
  }
}

async function fetchPayment(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
    },
  })
  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`PAYMENT_FETCH_FAILED: ${response.status} ${details}`)
  }
  return (await response.json()) as {
    id?: number | string
    status?: string
    status_detail?: string
    payment_type_id?: string
    external_reference?: string
    date_approved?: string
  }
}

async function applyPayment(paymentId: string) {
  const payment = await fetchPayment(paymentId)
  const externalReference = payment.external_reference?.trim()
  if (!externalReference) {
    console.warn('[mercadopago-webhook] payment without external_reference', paymentId)
    return { ok: false, reason: 'MISSING_EXTERNAL_REFERENCE' }
  }

  const status = mapPaymentStatus(payment.status)
  const paidAt =
    status === 'approved'
      ? payment.date_approved || new Date().toISOString()
      : null

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      mp_payment_id: String(payment.id ?? paymentId),
      mp_status: payment.status ?? null,
      mp_status_detail: payment.status_detail ?? null,
      mp_payment_type: payment.payment_type_id ?? null,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq('external_reference', externalReference)

  if (error) {
    throw new Error(`ORDER_UPDATE_FAILED: ${error.message}`)
  }

  let notified = false
  if (status === 'approved') {
    notified = await maybeNotifyOwnerPaymentApproved(supabase, externalReference)
  }

  return { ok: true, externalReference, status, notified }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return json({ error: 'MERCADOPAGO_NOT_CONFIGURED' }, { status: 503 })
  }

  try {
    const url = new URL(request.url)
    let topic = url.searchParams.get('topic') || url.searchParams.get('type') || ''
    let resourceId = url.searchParams.get('id') || url.searchParams.get('data.id') || ''

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as {
        type?: string
        topic?: string
        action?: string
        data?: { id?: string | number }
        id?: string | number
      }
      topic = body.type || body.topic || topic
      const dataId = body.data?.id ?? body.id
      if (dataId != null) resourceId = String(dataId)
    }

    const normalizedTopic = topic.toLowerCase()
    if (!resourceId) {
      return json({ ok: true, ignored: true, reason: 'NO_RESOURCE_ID' })
    }

    if (normalizedTopic.includes('payment') || normalizedTopic === 'payment') {
      const result = await applyPayment(resourceId)
      return json({ ok: true, ...result })
    }

    // Merchant order / outros tópicos: ignorados com 200 para o MP não reenviar em loop.
    return json({ ok: true, ignored: true, topic: normalizedTopic })
  } catch (error) {
    console.error('[mercadopago-webhook]', error)
    return json(
      { error: error instanceof Error ? error.message : 'WEBHOOK_FAILED' },
      { status: 500 },
    )
  }
})
