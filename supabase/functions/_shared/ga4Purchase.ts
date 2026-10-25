/** Envia `purchase` ao GA4 via Measurement Protocol (servidor). */

export type Ga4PurchaseOrder = {
  id: string
  amount_cents: number
  currency: string
  plan_key: string
  source_path?: string | null
}

/** Lê gclid e ids da sessão GA4 gravados em `orders.source_path` no checkout. */
function attributionFromSourcePath(sourcePath: string | null | undefined): {
  gclid?: string
  gaClientId?: string
  gaSessionId?: string
} {
  if (!sourcePath) return {}
  try {
    const url = new URL(sourcePath, 'https://convitesdiversos.com.br')
    const gclid = url.searchParams.get('gclid')?.trim() || ''
    const gaClientId = url.searchParams.get('ga_cid')?.trim() || ''
    const gaSessionId = url.searchParams.get('ga_sid')?.trim() || ''
    return {
      ...(gclid ? { gclid: gclid.slice(0, 200) } : {}),
      ...(/^\d+\.\d+$/.test(gaClientId) ? { gaClientId } : {}),
      ...(/^\d+$/.test(gaSessionId) ? { gaSessionId } : {}),
    }
  } catch {
    return {}
  }
}

function formatClientId(orderId: string): string {
  const hex = orderId.replace(/-/g, '')
  const left = Number.parseInt(hex.slice(0, 8) || '1', 16) || 1
  const right = Number.parseInt(hex.slice(8, 16) || '1', 16) || 1
  return `${left}.${right}`
}

async function sendGa4Purchase(order: Ga4PurchaseOrder): Promise<boolean> {
  const measurementId = (Deno.env.get('GA4_MEASUREMENT_ID') || Deno.env.get('VITE_GA_MEASUREMENT_ID') || '')
    .trim()
  const apiSecret = (Deno.env.get('GA4_API_SECRET') || '').trim()

  if (!measurementId || !apiSecret) {
    console.warn('[ga4] GA4_MEASUREMENT_ID ou GA4_API_SECRET ausente — purchase ignorado')
    return false
  }

  const value = order.amount_cents / 100
  const currency = (order.currency || 'BRL').toUpperCase()
  const attribution = attributionFromSourcePath(order.source_path)
  const clientId = attribution.gaClientId || formatClientId(order.id)
  const payload = {
    client_id: clientId,
    user_id: order.id,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: order.id,
          value,
          currency,
          engagement_time_msec: 1,
          ...(attribution.gaSessionId ? { session_id: attribution.gaSessionId } : {}),
          ...(attribution.gclid ? { gclid: attribution.gclid } : {}),
          items: [
            {
              item_id: order.plan_key || 'unico',
              item_name: 'Convite digital',
              item_category: 'convite',
              price: value,
              quantity: 1,
            },
          ],
        },
      },
    ],
  }

  const url =
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}` +
    `&api_secret=${encodeURIComponent(apiSecret)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  // MP responde 204 sem body em sucesso.
  if (!response.ok && response.status !== 204) {
    const details = await response.text().catch(() => '')
    console.error('[ga4] mp/collect failed', response.status, details)
    return false
  }

  return true
}

/**
 * Reserva e envia purchase uma única vez por pedido aprovado.
 */
export async function maybeSendGa4Purchase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  externalReference: string,
): Promise<boolean> {
  const { data: claimed, error } = await supabase
    .from('orders')
    .update({ ga4_purchase_sent_at: new Date().toISOString() })
    .eq('external_reference', externalReference)
    .eq('status', 'approved')
    .is('ga4_purchase_sent_at', null)
    .select('id, amount_cents, currency, plan_key, source_path')
    .maybeSingle()

  if (error) {
    console.error('[ga4] claim purchase failed', error.message)
    return false
  }
  if (!claimed) return false

  const sent = await sendGa4Purchase(claimed as Ga4PurchaseOrder)
  if (!sent) {
    await supabase
      .from('orders')
      .update({ ga4_purchase_sent_at: null })
      .eq('id', (claimed as Ga4PurchaseOrder).id)
      .eq('status', 'approved')
    return false
  }

  return true
}
