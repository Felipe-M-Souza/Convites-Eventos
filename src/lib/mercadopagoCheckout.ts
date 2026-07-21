import { supabase, isCmsConfigured } from './supabase'
import { PROMO } from '../config/pricing'

export type CheckoutPlanKey = typeof PROMO.planKey

export type CreateCheckoutInput = {
  planKey?: CheckoutPlanKey
  payerEmail?: string
  payerName?: string
  customerNote?: string
  sourcePath?: string
  locale?: string
}

export type CreateCheckoutResult = {
  orderId: string
  preferenceId: string
  checkoutUrl: string
}

export class CheckoutError extends Error {
  code: string

  constructor(code: string, message?: string) {
    super(message || code)
    this.name = 'CheckoutError'
    this.code = code
  }
}

/**
 * Cria pedido + preferência Checkout Pro no servidor e devolve a URL do Mercado Pago.
 * O preço é validado na Edge Function (não confiar no cliente).
 */
export async function createMercadoPagoCheckout(
  input: CreateCheckoutInput = {},
): Promise<CreateCheckoutResult> {
  if (!isCmsConfigured || !supabase) {
    throw new CheckoutError('SUPABASE_NOT_CONFIGURED', 'Checkout indisponível no momento.')
  }

  const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
    body: {
      planKey: input.planKey ?? PROMO.planKey,
      payerEmail: input.payerEmail,
      payerName: input.payerName,
      customerNote: input.customerNote,
      sourcePath: input.sourcePath ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
      locale: input.locale,
    },
  })

  if (error) {
    throw new CheckoutError('INVOKE_FAILED', error.message || 'Falha ao iniciar o pagamento.')
  }

  const payload = data as
    | CreateCheckoutResult
    | { error?: string; details?: string }
    | null

  if (!payload || typeof payload !== 'object' || !('checkoutUrl' in payload) || !payload.checkoutUrl) {
    const code =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? String(payload.error)
        : 'UNKNOWN'
    const details =
      payload && typeof payload === 'object' && 'details' in payload && payload.details
        ? String(payload.details)
        : undefined
    throw new CheckoutError(code, details || 'Não foi possível criar o pagamento.')
  }

  return {
    orderId: payload.orderId,
    preferenceId: payload.preferenceId,
    checkoutUrl: payload.checkoutUrl,
  }
}
