/** Aviso ao dono via Telegram quando um pedido é aprovado. */

export type OrderNotifyRow = {
  id: string
  amount_cents: number
  currency: string
  plan_key: string
  payer_email: string | null
  payer_name: string | null
  customer_note: string | null
  source_path: string | null
  mp_payment_id: string | null
  locale: string | null
}

function formatBrl(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

function extractWhatsapp(customerNote: string | null): string {
  if (!customerNote) return '—'
  const match = customerNote.match(/WhatsApp:\s*([+\d\s()-]+)/i)
  return match?.[1]?.replace(/\s+/g, '') || customerNote.trim() || '—'
}

function buildMessage(order: OrderNotifyRow): string {
  const whatsapp = extractWhatsapp(order.customer_note)
  const email = order.payer_email?.trim() || '—'
  const name = order.payer_name?.trim() || '—'
  const source = order.source_path?.trim() || '—'
  const mpId = order.mp_payment_id?.trim() || '—'
  const value = `R$ ${formatBrl(order.amount_cents)}`

  return [
    'Pagamento aprovado — Convites Diversos',
    '',
    `Pedido: ${order.id}`,
    `Valor: ${value} (${order.plan_key})`,
    `Cliente: ${name}`,
    `WhatsApp: ${whatsapp}`,
    `E-mail: ${email}`,
    `Origem: ${source}`,
    `MP payment: ${mpId}`,
    `Idioma: ${order.locale || 'pt-BR'}`,
  ].join('\n')
}

async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')?.trim()
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')?.trim()
  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausente — aviso ignorado')
    return false
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    console.error('[telegram] sendMessage failed', response.status, details)
    return false
  }
  return true
}

type OrdersClient = {
  from: (table: 'orders') => {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => unknown
    }
  }
}

/**
 * Reserva o aviso (owner_notified_at) e envia Telegram uma única vez por pedido aprovado.
 */
export async function maybeNotifyOwnerPaymentApproved(
  // Cliente service-role do Supabase (tipagem frouxa entre Edge Functions).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  externalReference: string,
): Promise<boolean> {
  const { data: claimed, error } = await supabase
    .from('orders')
    .update({ owner_notified_at: new Date().toISOString() })
    .eq('external_reference', externalReference)
    .eq('status', 'approved')
    .is('owner_notified_at', null)
    .select(
      'id, amount_cents, currency, plan_key, payer_email, payer_name, customer_note, source_path, mp_payment_id, locale',
    )
    .maybeSingle()

  if (error) {
    console.error('[telegram] claim notify failed', error.message)
    return false
  }
  if (!claimed) return false

  const sent = await sendTelegramMessage(buildMessage(claimed as OrderNotifyRow))
  if (!sent) {
    await supabase
      .from('orders')
      .update({ owner_notified_at: null })
      .eq('id', (claimed as OrderNotifyRow).id)
      .eq('status', 'approved')
    return false
  }

  return true
}

// Mantém o tipo exportado útil para testes/leitura.
export type { OrdersClient }
