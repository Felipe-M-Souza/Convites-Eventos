import type { EventData } from '../../data/eventData'
import { coupleNameParts } from '../../data/eventData'
import { parseIsoLocal } from '../../lib/inviteCalendar'
import { useI18n } from '../../i18n/useI18n'
import { SageCoupleNames } from './SageCoupleNames'
import { SageLeaves } from './SageLeaves'

type Props = {
  data: EventData
  onOpen: () => void
  onOpenGesture?: () => void
  elegantNames?: boolean
}

export function SageCover({ data, onOpen, onOpenGesture, elegantNames = false }: Props) {
  const { locale, t } = useI18n()
  const names = coupleNameParts(data.coupleNames)
  const when = parseIsoLocal(data.weddingDateTime)
  const dateLabel = when
    ? when.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : data.weddingDateLabel

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#e7efe4] px-5 py-16">
      <SageLeaves />
      <div className="relative z-10 w-full max-w-[340px] rounded-[28px] bg-white px-8 py-10 text-center text-[#3f4a38] shadow-[0_18px_50px_rgba(80,100,70,0.16)]">
        <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-[#d5e2cf]" aria-hidden />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5f734f] text-2xl text-white">
          ♡
        </div>
        <SageCoupleNames as="h1" names={names} elegant={elegantNames} className="mt-6 text-5xl text-[#4d5c45]" />
        <div className="mx-auto mt-5 flex w-36 items-center gap-3 text-[#8ea184]" aria-hidden>
          <span className="h-px flex-1 bg-current" />
          <span className="text-[10px]">✦</span>
          <span className="h-px flex-1 bg-current" />
        </div>
        <p className="mt-5 font-display text-lg text-[#6d7d64]">{dateLabel}</p>
        <p className="mt-6 font-display text-xl text-[#5f734f]">{t('invite.sageWelcome')}</p>
        <button
          type="button"
          onClick={() => {
            onOpenGesture?.()
            onOpen()
          }}
          className="mt-7 rounded-full bg-[#5f734f] px-10 py-3 text-sm font-medium tracking-wide text-white shadow-sm transition hover:bg-[#526546]"
        >
          {t('invite.sageOpen')}
        </button>
      </div>
    </div>
  )
}
