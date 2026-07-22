// Supabase Edge Function: resolve-order-payment
// Usada pela página /pagamento/* para sincronizar status Pix (MP devolve pending e aprova depois).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { maybeNotifyOwnerPaymentApproved } from '../_shared/ownerTelegram.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''

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
    return { ok: false as const, reason: 'MISSING_EXTERNAL_REFERENCE' }
  }

  const status = mapPaymentStatus(payment.status)
  const paidAt = status === 'approved' ? payment.date_approved || new Date().toISOString() : null

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

  return { ok: true as const, status, mpStatus: payment.status ?? null, notified }
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

  const body = (await request.json().catch(() => ({}))) as {
    orderId?: string
    paymentId?: string
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : ''

  if (!orderId && !paymentId) {
    return json({ error: 'MISSING_IDS' }, { status: 400 })
  }

  try {
    if (paymentId) {
      const result = await applyPayment(paymentId)
      if (result.ok) {
        return json({
          orderId: orderId || null,
          status: result.status,
          mpStatus: result.mpStatus,
          synced: true,
          notified: result.notified,
        })
      }
    }

    if (orderId) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, mp_status, mp_payment_id, external_reference')
        .eq('id', orderId)
        .maybeSingle()

      if (error) {
        return json({ error: 'ORDER_LOOKUP_FAILED', details: error.message }, { status: 500 })
      }
      if (!order) {
        return json({ error: 'ORDER_NOT_FOUND' }, { status: 404 })
      }

      if (order.mp_payment_id && order.status !== 'approved') {
        const result = await applyPayment(String(order.mp_payment_id))
        if (result.ok) {
          return json({
            orderId: order.id,
            status: result.status,
            mpStatus: result.mpStatus,
            synced: true,
            notified: result.notified,
          })
        }
      }

      let notified = false
      if (order.status === 'approved' && order.external_reference) {
        notified = await maybeNotifyOwnerPaymentApproved(supabase, String(order.external_reference))
      }

      return json({
        orderId: order.id,
        status: order.status,
        mpStatus: order.mp_status,
        synced: false,
        notified,
      })
    }

    return json({ error: 'UNRESOLVED' }, { status: 422 })
  } catch (error) {
    console.error('[resolve-order-payment]', error)
    return json(
      { error: error instanceof Error ? error.message : 'RESOLVE_FAILED' },
      { status: 500 },
    )
  }
})
