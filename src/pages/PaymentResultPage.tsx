import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { buildLeadWhatsappHref } from '../lib/leadContact'
import { trackEvent, trackPurchase, trackWhatsappLead } from '../lib/analytics'
import { readAdsClickIds } from '../lib/adsAttribution'
import { PROMO } from '../config/pricing'
import { mapOrderStatusToResultKind, resolveOrderPayment } from '../lib/orderStatus'

export type PaymentResultKind = 'success' | 'pending' | 'failure'

type Copy = {
  eyebrow: string
  title: string
  description: string
  home: string
  whatsapp: string
  orderLabel: string
  checking: string
}

const COPY: Record<'pt-BR' | 'en' | 'es', Record<PaymentResultKind, Copy>> = {
  'pt-BR': {
    success: {
      eyebrow: 'Pagamento',
      title: 'Pagamento confirmado',
      description:
        'Recebemos a confirmação do Mercado Pago. Em breve entraremos em contato pelo WhatsApp ou e-mail para personalizar o seu convite.',
      home: 'Voltar ao início',
      whatsapp: 'Falar no WhatsApp agora',
      orderLabel: 'Pedido',
      checking: '',
    },
    pending: {
      eyebrow: 'Pagamento',
      title: 'Pagamento em análise',
      description:
        'O Mercado Pago ainda está processando. Esta página atualiza sozinha quando o Pix for confirmado — em geral em poucos segundos.',
      home: 'Voltar ao início',
      whatsapp: 'Tirar dúvida no WhatsApp',
      orderLabel: 'Pedido',
      checking: 'Confirmando status do pagamento…',
    },
    failure: {
      eyebrow: 'Pagamento',
      title: 'Não foi possível concluir',
      description:
        'O pagamento não foi aprovado ou foi cancelado. Pode tentar de novo na página inicial ou falar conosco no WhatsApp.',
      home: 'Tentar de novo',
      whatsapp: 'Falar no WhatsApp',
      orderLabel: 'Pedido',
      checking: '',
    },
  },
  en: {
    success: {
      eyebrow: 'Payment',
      title: 'Payment confirmed',
      description:
        'We received confirmation from Mercado Pago. We will contact you soon by WhatsApp or email to personalize your invitation.',
      home: 'Back to home',
      whatsapp: 'Message us on WhatsApp',
      orderLabel: 'Order',
      checking: '',
    },
    pending: {
      eyebrow: 'Payment',
      title: 'Payment under review',
      description:
        'Mercado Pago is still processing. This page updates automatically when Pix clears — usually within a few seconds.',
      home: 'Back to home',
      whatsapp: 'Ask on WhatsApp',
      orderLabel: 'Order',
      checking: 'Checking payment status…',
    },
    failure: {
      eyebrow: 'Payment',
      title: 'Payment not completed',
      description:
        'The payment was not approved or was cancelled. You can try again from the home page or reach us on WhatsApp.',
      home: 'Try again',
      whatsapp: 'Message on WhatsApp',
      orderLabel: 'Order',
      checking: '',
    },
  },
  es: {
    success: {
      eyebrow: 'Pago',
      title: 'Pago confirmado',
      description:
        'Recibimos la confirmación de Mercado Pago. Pronto te contactaremos por WhatsApp o correo para personalizar tu invitación.',
      home: 'Volver al inicio',
      whatsapp: 'Hablar por WhatsApp',
      orderLabel: 'Pedido',
      checking: '',
    },
    pending: {
      eyebrow: 'Pago',
      title: 'Pago en análisis',
      description:
        'Mercado Pago aún está procesando. Esta página se actualiza sola cuando el Pix se confirme — en general en pocos segundos.',
      home: 'Volver al inicio',
      whatsapp: 'Consultar por WhatsApp',
      orderLabel: 'Pedido',
      checking: 'Confirmando el estado del pago…',
    },
    failure: {
      eyebrow: 'Pago',
      title: 'No se pudo completar',
      description:
        'El pago no fue aprobado o se canceló. Puedes intentar de nuevo en la página de inicio o escribirnos por WhatsApp.',
      home: 'Intentar de nuevo',
      whatsapp: 'Hablar por WhatsApp',
      orderLabel: 'Pedido',
      checking: '',
    },
  },
}

const POLL_INTERVAL_MS = 3000
const POLL_MAX_MS = 120_000

type Props = {
  kind: PaymentResultKind
}

function kindFromMpUrl(routeKind: PaymentResultKind, mpStatus: string): PaymentResultKind {
  if (routeKind === 'pending' && mpStatus === 'approved') return 'success'
  if (routeKind === 'pending' && (mpStatus === 'rejected' || mpStatus === 'cancelled')) return 'failure'
  return routeKind
}

export function PaymentResultPage({ kind: routeKind }: Props) {
  const { locale } = useI18n()
  const [params] = useSearchParams()
  const orderId = (params.get('order') || params.get('external_reference') || '').trim()
  const paymentId = (params.get('payment_id') || params.get('collection_id') || '').trim()

  // O MP anexa o status real na URL de retorno; no Pix ele devolve pela
  // back_url "pending" mesmo com pagamento já aprovado. Corrige a exibição.
  const mpStatus = (params.get('collection_status') || params.get('status') || '').toLowerCase()
  const initialKind = kindFromMpUrl(routeKind, mpStatus)

  const [kind, setKind] = useState<PaymentResultKind>(initialKind)
  const [checking, setChecking] = useState(initialKind === 'pending' && Boolean(orderId || paymentId))
  const trackedKindRef = useRef<PaymentResultKind | null>(null)

  const copyLocale = locale === 'en' || locale === 'es' ? locale : 'pt-BR'
  const copy = COPY[copyLocale][kind]

  const whatsappMessage =
    copyLocale === 'en'
      ? `Hi! I just went through Mercado Pago checkout on Convites Diversos${orderId ? ` (order ${orderId})` : ''}. Can you help me with the next steps?`
      : copyLocale === 'es'
        ? `¡Hola! Acabo de pasar por el checkout de Mercado Pago en Convites Diversos${orderId ? ` (pedido ${orderId})` : ''}. ¿Me ayudas con los siguientes pasos?`
        : `Olá! Acabei de passar pelo checkout do Mercado Pago no Convites Diversos${orderId ? ` (pedido ${orderId})` : ''}. Pode me ajudar com os próximos passos?`

  const whatsappHref = buildLeadWhatsappHref(whatsappMessage)
  const homeHref = kind === 'failure' ? '/#planos' : '/'

  useEffect(() => {
    if (kind !== 'pending') {
      setChecking(false)
      return undefined
    }
    if (!orderId && !paymentId) {
      setChecking(false)
      return undefined
    }

    let cancelled = false
    const startedAt = Date.now()

    const poll = async () => {
      const resolved = await resolveOrderPayment({ orderId, paymentId: paymentId || undefined })
      if (cancelled || !resolved) return
      const next = mapOrderStatusToResultKind(resolved.status)
      if (next !== 'pending') {
        setKind(next)
        setChecking(false)
      }
    }

    void poll()
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= POLL_MAX_MS) {
        window.clearInterval(timer)
        setChecking(false)
        return
      }
      void poll()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [kind, orderId, paymentId])

  useEffect(() => {
    if (trackedKindRef.current === kind) return
    trackedKindRef.current = kind

    trackEvent(`payment_${kind}`, {
      order_id: orderId || undefined,
      plan: PROMO.planKey,
      ...(kind === 'success' ? { currency: 'BRL', value: PROMO.priceCents / 100 } : {}),
    })
    if (kind === 'success') {
      if (orderId) {
        const gclid = readAdsClickIds().gclid
        trackPurchase({
          transactionId: orderId,
          value: PROMO.priceCents / 100,
          currency: 'BRL',
          planKey: PROMO.planKey,
          extra: gclid ? { gclid } : undefined,
        })
      } else {
        trackEvent('purchase', {
          currency: 'BRL',
          value: PROMO.priceCents / 100,
          plan: PROMO.planKey,
        })
      }
    }
  }, [kind, orderId])

  return (
    <div className="min-h-dvh bg-[color:var(--color-cream)] px-6 py-16 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--color-ink-muted)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{copy.title}</h1>
        <p className="mt-5 text-sm leading-7 text-[color:var(--color-ink-muted)] sm:text-base">
          {copy.description}
        </p>
        {checking && copy.checking ? (
          <p className="mt-3 text-xs font-medium text-[color:var(--color-gold)]">{copy.checking}</p>
        ) : null}
        {orderId ? (
          <p className="mt-4 font-mono text-xs text-[color:var(--color-ink-muted)]">
            {copy.orderLabel}: {orderId}
          </p>
        ) : null}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={homeHref}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-gold)] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            {copy.home}
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackWhatsappLead(`payment_${kind}`, {
                destination: whatsappHref,
                order_id: orderId || undefined,
              })
            }
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            {copy.whatsapp}
          </a>
        </div>
      </div>
    </div>
  )
}
