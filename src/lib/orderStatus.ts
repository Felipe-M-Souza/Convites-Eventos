import { isCmsConfigured, supabase } from './supabase'

export type OrderPaymentStatus =
  | 'pending'
  | 'approved'
  | 'in_process'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'

export type ResolvedOrderPayment = {
  status: OrderPaymentStatus | string
  mpStatus?: string | null
  synced?: boolean
}

/**
 * Consulta/sincroniza o status do pedido (útil no Pix: MP devolve pending e aprova depois).
 * Prefere a Edge Function; cai no RPC se a function falhar.
 */
export async function resolveOrderPayment(input: {
  orderId: string
  paymentId?: string
}): Promise<ResolvedOrderPayment | null> {
  if (!isCmsConfigured || !supabase) return null

  const orderId = input.orderId.trim()
  const paymentId = input.paymentId?.trim() || undefined
  if (!orderId && !paymentId) return null

  try {
    const { data, error } = await supabase.functions.invoke('resolve-order-payment', {
      body: {
        orderId: orderId || undefined,
        paymentId,
      },
    })
    if (!error && data && typeof data === 'object' && 'status' in data && data.status) {
      return {
        status: String((data as { status: string }).status),
        mpStatus:
          'mpStatus' in data && (data as { mpStatus?: string | null }).mpStatus != null
            ? String((data as { mpStatus: string }).mpStatus)
            : null,
        synced: Boolean((data as { synced?: boolean }).synced),
      }
    }
  } catch {
    // fallback abaixo
  }

  if (!orderId) return null

  const { data, error } = await supabase.rpc('get_order_payment_status', {
    p_order_id: orderId,
  })
  if (error || !data) return null

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object' || !('status' in row) || !row.status) return null

  return {
    status: String(row.status),
    mpStatus: 'mp_status' in row && row.mp_status != null ? String(row.mp_status) : null,
    synced: false,
  }
}

export function mapOrderStatusToResultKind(
  status: string,
): 'success' | 'pending' | 'failure' {
  const normalized = status.toLowerCase()
  if (normalized === 'approved') return 'success'
  if (normalized === 'rejected' || normalized === 'cancelled' || normalized === 'charged_back') {
    return 'failure'
  }
  return 'pending'
}
