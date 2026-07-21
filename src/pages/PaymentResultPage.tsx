import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useI18n } from '../i18n/useI18n'
import { buildLeadWhatsappHref } from '../lib/leadContact'
import { trackEvent, trackWhatsappLead } from '../lib/analytics'
import { PROMO } from '../config/pricing'

export type PaymentResultKind = 'success' | 'pending' | 'failure'

type Copy = {
  eyebrow: string
  title: string
  description: string
  home: string
  whatsapp: string
  orderLabel: string
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
    },
    pending: {
      eyebrow: 'Pagamento',
      title: 'Pagamento em análise',
      description:
        'O Mercado Pago ainda está processando. Assim que confirmar, seguimos com a personalização do convite. Pode fechar esta página com tranquilidade.',
      home: 'Voltar ao início',
      whatsapp: 'Tirar dúvida no WhatsApp',
      orderLabel: 'Pedido',
    },
    failure: {
      eyebrow: 'Pagamento',
      title: 'Não foi possível concluir',
      description:
        'O pagamento não foi aprovado ou foi cancelado. Pode tentar de novo na página inicial ou falar conosco no WhatsApp.',
      home: 'Tentar de novo',
      whatsapp: 'Falar no WhatsApp',
      orderLabel: 'Pedido',
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
    },
    pending: {
      eyebrow: 'Payment',
      title: 'Payment under review',
      description:
        'Mercado Pago is still processing. Once it clears, we will continue with your invitation. You can safely leave this page.',
      home: 'Back to home',
      whatsapp: 'Ask on WhatsApp',
      orderLabel: 'Order',
    },
    failure: {
      eyebrow: 'Payment',
      title: 'Payment not completed',
      description:
        'The payment was not approved or was cancelled. You can try again from the home page or reach us on WhatsApp.',
      home: 'Try again',
      whatsapp: 'Message on WhatsApp',
      orderLabel: 'Order',
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
    },
    pending: {
      eyebrow: 'Pago',
      title: 'Pago en análisis',
      description:
        'Mercado Pago aún está procesando. Cuando confirme, seguimos con la personalización. Puedes cerrar esta página con tranquilidad.',
      home: 'Volver al inicio',
      whatsapp: 'Consultar por WhatsApp',
      orderLabel: 'Pedido',
    },
    failure: {
      eyebrow: 'Pago',
      title: 'No se pudo completar',
      description:
        'El pago no fue aprobado o se canceló. Puedes intentar de nuevo en la página de inicio o escribirnos por WhatsApp.',
      home: 'Intentar de nuevo',
      whatsapp: 'Hablar por WhatsApp',
      orderLabel: 'Pedido',
    },
  },
}

type Props = {
  kind: PaymentResultKind
}

export function PaymentResultPage({ kind: routeKind }: Props) {
  const { locale } = useI18n()
  const [params] = useSearchParams()
  const orderId = (params.get('order') || params.get('external_reference') || '').trim()

  // O MP anexa o status real na URL de retorno; no Pix ele devolve pela
  // back_url "pending" mesmo com pagamento já aprovado. Corrige a exibição.
  const mpStatus = (params.get('collection_status') || params.get('status') || '').toLowerCase()
  let kind: PaymentResultKind = routeKind
  if (routeKind === 'pending' && mpStatus === 'approved') kind = 'success'
  else if (routeKind === 'pending' && (mpStatus === 'rejected' || mpStatus === 'cancelled')) kind = 'failure'

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
    trackEvent(`payment_${kind}`, {
      order_id: orderId || undefined,
      plan: PROMO.planKey,
      ...(kind === 'success'
        ? { currency: 'BRL', value: PROMO.priceCents / 100 }
        : {}),
    })
    if (kind === 'success') {
      trackEvent('purchase', {
        currency: 'BRL',
        value: PROMO.priceCents / 100,
        transaction_id: orderId || undefined,
        plan: PROMO.planKey,
      })
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
