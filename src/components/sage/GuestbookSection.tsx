import { useEffect, useState, type FormEvent } from 'react'
import type { EventData, GuestbookSample } from '../../data/eventData'
import { useI18n } from '../../i18n/useI18n'
import { insertInviteMessage, listApprovedInviteMessages, validateGuestbookDraft, type InviteMessage } from '../../lib/inviteMessages'

type Props = {
  inviteSlug: string
  data: EventData
}

function SampleCard({ item }: { item: GuestbookSample }) {
  return (
    <article className="rounded-2xl bg-white/80 px-4 py-4 text-left shadow-sm">
      <p className="font-display text-lg text-[#3f4a38]">{item.name}</p>
      <p className="mt-2 text-sm leading-6 text-[#5c6a56]">{item.message}</p>
    </article>
  )
}

export function GuestbookSection({ inviteSlug, data }: Props) {
  const { locale, t } = useI18n()
  const [approved, setApproved] = useState<InviteMessage[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [sending, setSending] = useState(false)
  const heading = data.guestbookHeading.trim() || t('invite.sageGuestbook')

  useEffect(() => {
    let cancelled = false
    void listApprovedInviteMessages(inviteSlug).then((rows) => {
      if (!cancelled) setApproved(rows)
    })
    return () => {
      cancelled = true
    }
  }, [inviteSlug])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const problem = validateGuestbookDraft(name, message)
    if (problem) {
      setStatus({ type: 'err', text: t('invite.sageGuestbookShort') })
      return
    }
    setSending(true)
    setStatus(null)
    const error = await insertInviteMessage(inviteSlug, name, message)
    setSending(false)
    if (error) {
      setStatus({ type: 'err', text: t('invite.sageGuestbookError') })
      return
    }
    setName('')
    setMessage('')
    setStatus({ type: 'ok', text: t('invite.sageGuestbookSuccess') })
  }

  return (
    <section className="px-6 py-14 text-center">
      <h2 className="font-display text-3xl tracking-wide text-[#4d5c45]">{heading}</h2>
      <form onSubmit={(event) => void onSubmit(event)} className="mx-auto mt-8 max-w-md space-y-3 text-left">
        <label className="block text-sm text-[#5c6a56]">
          {t('invite.sageGuestbookName')}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-[#d5e2cf] bg-white px-3 py-2 text-[#3f4a38] outline-none focus:border-[#5f734f]"
          />
        </label>
        <label className="block text-sm text-[#5c6a56]">
          {t('invite.sageGuestbookMessage')}
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            placeholder={t('invite.sageGuestbookPlaceholder')}
            className="mt-1 min-h-24 w-full rounded-xl border border-[#d5e2cf] bg-white px-3 py-2 text-[#3f4a38] outline-none focus:border-[#5f734f]"
          />
        </label>
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-full bg-[#5f734f] px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {sending ? t('invite.sageGuestbookSending') : t('invite.sageGuestbookSend')}
        </button>
        {status ? (
          <p className={`text-sm leading-6 ${status.type === 'ok' ? 'text-[#3f6b45]' : 'text-[#8a4b3a]'}`}>{status.text}</p>
        ) : null}
      </form>
      <div className="mx-auto mt-8 grid max-w-md gap-3">
        {approved.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white/80 px-4 py-4 text-left shadow-sm">
            <p className="font-display text-lg text-[#3f4a38]">{item.guest_name}</p>
            <p className="mt-1 text-xs text-[#8aa184]">
              {new Date(item.created_at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5c6a56]">{item.message}</p>
          </article>
        ))}
        {data.guestbookSamples.map((item) => (
          <SampleCard key={`${item.name}-${item.message}`} item={item} />
        ))}
      </div>
    </section>
  )
}
