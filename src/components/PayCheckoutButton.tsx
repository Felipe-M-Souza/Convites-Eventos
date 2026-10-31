import { useEffect, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import { trackCtaClick, trackEvent } from '../lib/analytics'
import { buildAttributedSourcePath, captureAdsClickIds } from '../lib/adsAttribution'
import { PROMO } from '../config/pricing'
import {
  CheckoutError,
  createMercadoPagoCheckout,
  type CheckoutPlanKey,
} from '../lib/mercadopagoCheckout'
import { buildPixBrCode, PIX_KEY } from '../lib/pixBrCode'
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

type CheckoutCopy = {
  busy: string
  whatsappLabel: string
  whatsappPlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  contactHint: string
  whatsappRequired: string
  whatsappInvalid: string
  emailInvalid: string
  checkoutFailed: string
  pixCta: string
  pixTitle: string
  pixHint: string
  pixCopyKey: string
  pixCopyCode: string
  pixCopied: string
}

function getCheckoutCopy(locale: string): CheckoutCopy {
  if (locale === 'en') {
    return {
      busy: 'Redirecting…',
      whatsappLabel: 'WhatsApp',
      whatsappPlaceholder: '11999999999',
      emailLabel: 'Email (optional)',
      emailPlaceholder: 'you@email.com',
      contactHint: 'So we can deliver your invitation after payment.',
      whatsappRequired: 'Enter your WhatsApp so we can reach you after payment.',
      whatsappInvalid: 'Enter a valid WhatsApp number with area code.',
      emailInvalid: 'Enter a valid email or leave it blank.',
      checkoutFailed: 'Could not start payment. Try again or contact us on WhatsApp.',
      pixCta: 'Pay with PIX QR Code',
      pixTitle: 'PIX · R$ 50.00',
      pixHint: 'Scan the code or copy the key. Then send the receipt on the WhatsApp above.',
      pixCopyKey: 'Copy key',
      pixCopyCode: 'Copy code',
      pixCopied: 'Copied',
    }
  }
  if (locale === 'es') {
    return {
      busy: 'Redirigiendo…',
      whatsappLabel: 'WhatsApp',
      whatsappPlaceholder: '11999999999',
      emailLabel: 'Email (opcional)',
      emailPlaceholder: 'tu@email.com',
      contactHint: 'Así podemos entregarte la invitación después del pago.',
      whatsappRequired: 'Ingresa tu WhatsApp para contactarte después del pago.',
      whatsappInvalid: 'Ingresa un WhatsApp válido con código de área.',
      emailInvalid: 'Ingresa un email válido o déjalo en blanco.',
      checkoutFailed: 'No se pudo iniciar el pago. Inténtalo de nuevo o escríbenos por WhatsApp.',
      pixCta: 'Pagar con QR Code PIX',
      pixTitle: 'PIX · R$ 50,00',
      pixHint: 'Escanea el código o copia la clave. Después envía el comprobante al WhatsApp de arriba.',
      pixCopyKey: 'Copiar clave',
      pixCopyCode: 'Copiar código',
      pixCopied: 'Copiado',
    }
  }
  return {
    busy: 'Redirecionando…',
    whatsappLabel: 'WhatsApp',
    whatsappPlaceholder: '11999999999',
    emailLabel: 'E-mail (opcional)',
    emailPlaceholder: 'voce@email.com',
    contactHint: 'Para entregarmos seu convite após o pagamento.',
    whatsappRequired: 'Informe seu WhatsApp para falarmos com você após o pagamento.',
    whatsappInvalid: 'Informe um WhatsApp válido com DDD.',
    emailInvalid: 'Informe um e-mail válido ou deixe em branco.',
    checkoutFailed: 'Não foi possível iniciar o pagamento. Tente de novo ou fale no WhatsApp.',
    pixCta: 'Pagar com QR Code PIX',
    pixTitle: 'PIX · R$ 50,00',
    pixHint: 'Escaneie o código ou copie a chave. Depois envie o comprovante no WhatsApp informado.',
    pixCopyKey: 'Copiar chave',
    pixCopyCode: 'Copiar código',
    pixCopied: 'Copiado',
  }
}

/** Normaliza telefone BR para E.164 sem +: 55 + DDD + número. */
function normalizeBrazilWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  let phone = digits
  if (phone.startsWith('55') && (phone.length === 12 || phone.length === 13)) {
    return phone
  }
  if (phone.length === 10 || phone.length === 11) {
    return `55${phone}`
  }
  return null
}

function isValidEmail(value: string): boolean {
  if (!value) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const fieldClassName =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[color:var(--color-gold)] focus:ring-2 focus:ring-[color:var(--color-gold)]/25'

export function PayCheckoutButton({
  source,
  planKey = PROMO.planKey,
  label,
  className,
  loadingLabel,
}: Props) {
  const { locale } = useI18n()
  const copy = getCheckoutCopy(locale)
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pixOpen, setPixOpen] = useState(false)
  const [pixImage, setPixImage] = useState('')
  const [copied, setCopied] = useState<'key' | 'code' | null>(null)
  const pixCode = buildPixBrCode(PROMO.priceCents)

  useEffect(() => {
    if (!pixOpen) return undefined
    let active = true
    void QRCode.toDataURL(pixCode, { margin: 1, width: 280, errorCorrectionLevel: 'M' }).then((url) => {
      if (active) setPixImage(url)
    })
    return () => {
      active = false
    }
  }, [pixCode, pixOpen])

  const busyLabel = loadingLabel || copy.busy

  const contactError = (): string | null => {
    const normalizedWhatsapp = normalizeBrazilWhatsapp(whatsapp)
    if (!whatsapp.trim()) return copy.whatsappRequired
    if (!normalizedWhatsapp) return copy.whatsappInvalid
    if (!isValidEmail(email.trim())) return copy.emailInvalid
    return null
  }

  const openPix = () => {
    const problem = contactError()
    if (problem) {
      setError(problem)
      setPixOpen(false)
      return
    }
    setError(null)
    setPixOpen(true)
    trackCtaClick(source, 'pagar_pix', 'qrcode', { plan: planKey })
  }

  const copyText = async (value: string, kind: 'key' | 'code') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 1600)
    } catch {
      setCopied(null)
    }
  }

  const startCheckout = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return

    const normalizedWhatsapp = normalizeBrazilWhatsapp(whatsapp)
    if (!whatsapp.trim()) {
      setError(copy.whatsappRequired)
      return
    }
    if (!normalizedWhatsapp) {
      setError(copy.whatsappInvalid)
      return
    }
    const trimmedEmail = email.trim()
    if (!isValidEmail(trimmedEmail)) {
      setError(copy.emailInvalid)
      return
    }

    setError(null)
    setLoading(true)
    trackCtaClick(source, 'pagar_mercadopago', 'checkout_pro', { plan: planKey })
    const price = PROMO.priceCents / 100
    trackEvent('begin_checkout', {
      currency: 'BRL',
      value: price,
      plan: planKey,
      source,
      has_email: Boolean(trimmedEmail),
      items: [
        {
          item_id: planKey,
          item_name: 'Convite digital',
          price,
          quantity: 1,
        },
      ],
    })

    try {
      if (typeof window !== 'undefined') captureAdsClickIds(window.location.search)
      const result = await createMercadoPagoCheckout({
        planKey,
        locale,
        payerEmail: trimmedEmail || undefined,
        customerNote: `WhatsApp: ${normalizedWhatsapp}`,
        sourcePath:
          typeof window !== 'undefined'
            ? buildAttributedSourcePath(import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || '')
            : '/',
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
      const message = err instanceof CheckoutError ? err.message : copy.checkoutFailed
      setError(message)
      trackEvent('checkout_error', { source, plan: planKey, error_code: code })
      setLoading(false)
    }
  }

  return (
    <form className="w-full space-y-2.5" onSubmit={(event) => void startCheckout(event)}>
      <p className="text-xs leading-5 text-[color:var(--color-ink-muted)]">{copy.contactHint}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-muted)]">
            {copy.whatsappLabel}
          </span>
          <input
            type="tel"
            name="whatsapp"
            autoComplete="tel"
            inputMode="tel"
            required
            disabled={loading}
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder={copy.whatsappPlaceholder}
            className={fieldClassName}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-muted)]">
            {copy.emailLabel}
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            disabled={loading}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.emailPlaceholder}
            className={fieldClassName}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={
          className ||
          'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-gold)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-wait disabled:opacity-70'
        }
      >
        <MercadoPagoMark />
        {loading ? busyLabel : label}
      </button>
      <button
        type="button"
        onClick={openPix}
        className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--color-gold)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-blush)]"
      >
        {copy.pixCta}
      </button>
      {pixOpen ? (
        <div className="rounded-2xl border border-[color:var(--color-gold-soft)] bg-white p-4 text-center">
          <p className="font-display text-2xl text-[color:var(--color-ink)]">{copy.pixTitle}</p>
          {pixImage ? (
            <img src={pixImage} alt={copy.pixTitle} className="mx-auto mt-3 h-52 w-52 rounded-xl bg-white" />
          ) : null}
          <p className="mt-3 break-all text-sm font-medium text-[color:var(--color-ink)]">{PIX_KEY}</p>
          <p className="mt-2 text-xs leading-5 text-[color:var(--color-ink-muted)]">{copy.pixHint}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => void copyText(PIX_KEY, 'key')}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-800"
            >
              {copied === 'key' ? copy.pixCopied : copy.pixCopyKey}
            </button>
            <button
              type="button"
              onClick={() => void copyText(pixCode, 'code')}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-800"
            >
              {copied === 'code' ? copy.pixCopied : copy.pixCopyCode}
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="text-center text-xs leading-5 text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
