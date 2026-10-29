import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { EventData } from '../../data/eventData'
import { useI18n } from '../../i18n/useI18n'
import { insertInviteMessage, listVisibleInviteMessages, validateGuestbookDraft, type InviteMessage } from '../../lib/inviteMessages'
import { SageDots, useSagePager } from './SageDots'

type Props = {
  inviteSlug: string
  data: EventData
}

type Slide = {
  key: string
  name: string
  message: string
  when?: string
}

export function GuestbookSection({ inviteSlug, data }: Props) {
  const { locale, t } = useI18n()
  const [messages, setMessages] = useState<InviteMessage[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [sending, setSending] = useState(false)
  const heading = data.guestbookHeading.trim() || t('invite.sageGuestbook')

  useEffect(() => {
    let cancelled = false
    void listVisibleInviteMessages(inviteSlug).then((rows) => {
      if (!cancelled) setMessages(rows)
    })
    return () => {
      cancelled = true
    }
  }, [inviteSlug])

  const slides = useMemo<Slide[]>(() => {
    const fromGuests = messages.map((item) => ({
      key: item.id,
      name: item.guest_name,
      message: item.message,
      when: new Date(item.created_at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }),
    }))
    const fromSamples = data.guestbookSamples.map((item, index) => ({
      key: `sample-${index}-${item.name}`,
      name: item.name,
      message: item.message,
    }))
    return [...fromGuests, ...fromSamples]
  }, [data.guestbookSamples, locale, messages])

  const { index, select } = useSagePager(slides.length)
  const current = slides[index]

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const problem = validateGuestbookDraft(name, message)
    if (problem) {
      setStatus({ type: 'err', text: t('invite.sageGuestbookShort') })
      return
    }
    const sentName = name.trim()
    const sentMessage = message.trim()
    setSending(true)
    setStatus(null)
    const error = await insertInviteMessage(inviteSlug, sentName, sentMessage)
    setSending(false)
    if (error) {
      setStatus({ type: 'err', text: t('invite.sageGuestbookError') })
      return
    }
    setName('')
    setMessage('')
    setStatus({ type: 'ok', text: t('invite.sageGuestbookSuccess') })
    const rows = await listVisibleInviteMessages(inviteSlug)
    const already = rows.some((row) => row.guest_name === sentName && row.message === sentMessage)
    setMessages(
      already
        ? rows
        : [
            {
              id: `local-${Date.now()}`,
              invite_slug: inviteSlug,
              guest_name: sentName,
              message: sentMessage,
              status: 'approved',
              created_at: new Date().toISOString(),
            },
            ...rows,
          ],
    )
    select(0)
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
      {current ? (
        <div className="mx-auto mt-8 max-w-sm">
          <article className="flex min-h-44 flex-col justify-center rounded-[28px] bg-white px-6 py-6 text-left shadow-sm">
            <p className="font-display text-2xl text-[#3f4a38]">{current.name}</p>
            {current.when ? <p className="mt-1 text-xs text-[#8aa184]">{current.when}</p> : null}
            <p className="mt-3 text-sm leading-7 text-[#5c6a56]">{current.message}</p>
          </article>
          <SageDots
            count={slides.length}
            index={index}
            onSelect={select}
            label={(dot) => t('invite.pagerDot', { n: dot + 1 })}
          />
        </div>
      ) : null}
    </section>
  )
}
