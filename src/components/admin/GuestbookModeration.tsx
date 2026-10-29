import { useEffect, useState } from 'react'
import { listInviteMessages, setInviteMessageStatus, type InviteMessage } from '../../lib/inviteMessages'

type Props = {
  inviteSlug: string
}

export function GuestbookModeration({ inviteSlug }: Props) {
  const [rows, setRows] = useState<InviteMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    void listInviteMessages(inviteSlug).then((result) => {
      setRows(result.rows)
      setError(result.error)
    })
  }

  useEffect(() => {
    load()
  }, [inviteSlug])

  const update = async (id: string, status: InviteMessage['status']) => {
    setBusyId(id)
    const message = await setInviteMessageStatus(id, status)
    setBusyId(null)
    if (message) {
      setError(message)
      return
    }
    load()
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
      <p className="text-sm font-medium text-stone-800">Recados dos convidados</p>
      <p className="text-xs leading-5 text-stone-500">
        O recado aparece no convite assim que é enviado. Use Ocultar para tirá-lo da página. Se a lista não carregar,
        rode a migration `019_invite_messages.sql` no Supabase.
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {rows.length === 0 && !error ? <p className="text-sm text-stone-500">Nenhum recado enviado ainda.</p> : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-stone-200 bg-white p-3">
            <p className="text-sm font-medium text-stone-800">
              {row.guest_name}{' '}
              <span className="font-normal text-stone-500">· {row.status === 'approved' ? 'aprovada' : row.status === 'rejected' ? 'oculta' : 'pendente'}</span>
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{row.message}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={busyId === row.id || row.status === 'approved'}
                onClick={() => void update(row.id, 'approved')}
                className="rounded-full bg-[#5f734f] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                type="button"
                disabled={busyId === row.id || row.status === 'rejected'}
                onClick={() => void update(row.id, 'rejected')}
                className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 disabled:opacity-50"
              >
                Ocultar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
