import { useState } from 'react'
import { trackCtaClick, trackEvent } from '../lib/analytics'
import { PROMO } from '../config/pricing'
import {
  CheckoutError,
  createMercadoPagoCheckout,
  type CheckoutPlanKey,
} from '../lib/mercadopagoCheckout'
import { useI18n } from '../i18n/useI18n'

type Props = {
  /** Origem do CTA para analytics (ex.: portfolio_plan_unico). */
  source: string
  planKey?: CheckoutPlanKey
  label: string
  className?: string
  /** Classes do estado de loading / disabled. */
  loadingLabel?: string
}

function MercadoPagoMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 14.09V17h-2.83v-.91c-1.71-.31-2.94-1.4-3.12-3.09h1.96c.14.72.69 1.21 1.66 1.21.96 0 1.54-.45 1.54-1.14 0-.72-.55-1.05-1.72-1.38-1.72-.48-2.86-1.14-2.86-2.76 0-1.43 1.1-2.48 2.72-2.76V5.5h2.83v.88c1.48.28 2.54 1.28 2.7 2.86h-1.95c-.13-.72-.62-1.18-1.48-1.18-.86 0-1.42.45-1.42 1.09 0 .69.55 1.02 1.81 1.38 1.81.52 2.77 1.21 2.77 2.81 0 1.5-1.12 2.55-2.91 2.85z" />
    </svg>
  )
}

export function PayCheckoutButton({
  source,
  planKey = PROMO.planKey,
  label,
  className,
  loadingLabel,
}: Props) {
  const { locale } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busyLabel =
    loadingLabel ||
    (locale === 'en' ? 'Redirecting…' : locale === 'es' ? 'Redirigiendo…' : 'Redirecionando…')

  const startCheckout = async () => {
    if (loading) return
    setError(null)
    setLoading(true)
    trackCtaClick(source, 'pagar_mercadopago', 'checkout_pro', { plan: planKey })
    trackEvent('begin_checkout', {
      currency: 'BRL',
      value: PROMO.priceCents / 100,
      plan: planKey,
      source,
    })

    try {
      const result = await createMercadoPagoCheckout({
        planKey,
        locale,
        sourcePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/',
      })
      trackEvent('checkout_redirect', {
        order_id: result.orderId,
        preference_id: result.preferenceId,
        plan: planKey,
        source,
      })
      window.location.assign(result.checkoutUrl)
    } catch (err) {
      const code = err instanceof CheckoutError ? err.code : 'UNKNOWN'
      const message =
        err instanceof CheckoutError
          ? err.message
          : locale === 'en'
            ? 'Could not start payment. Try again or contact us on WhatsApp.'
            : locale === 'es'
              ? 'No se pudo iniciar el pago. Inténtalo de nuevo o escríbenos por WhatsApp.'
              : 'Não foi possível iniciar o pagamento. Tente de novo ou fale no WhatsApp.'
      setError(message)
      trackEvent('checkout_error', { source, plan: planKey, error_code: code })
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={loading}
        onClick={() => void startCheckout()}
        className={
          className ||
          'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-gold)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-wait disabled:opacity-70'
        }
      >
        <MercadoPagoMark />
        {loading ? busyLabel : label}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs leading-5 text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
