import { PaymentResultPage } from './PaymentResultPage'

export function PaymentSuccessPage() {
  return <PaymentResultPage kind="success" />
}

export function PaymentPendingPage() {
  return <PaymentResultPage kind="pending" />
}

export function PaymentFailurePage() {
  return <PaymentResultPage kind="failure" />
}
