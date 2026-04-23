import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildOwnerClaimUrl, generateOwnerAccessCode, hashOwnerAccessCode, normalizeOwnerAccessCode } from '../../lib/ownerAccess'

type Props = {
  supabase: SupabaseClient
  inviteSlug: string
  inputClass: string
}

type OwnerAccessRow = {
  invite_slug: string
  owner_user_id: string | null
  owner_email: string | null
  owner_name: string
  access_code_hash: string
  claimed_at: string | null
}

type UploadCounts = {
  pending: number
  approved: number
  rejected: number
}

const EMPTY_COUNTS: UploadCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
}

function formatDateTime(value: string | null) {
  if (!value) return 'Ainda não vinculado'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OwnerAccessField({ supabase, inviteSlug, inputClass }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null)
  const [claimedAt, setClaimedAt] = useState<string | null>(null)
  const [storedAccessHash, setStoredAccessHash] = useState('')
  const [accessCodeDraft, setAccessCodeDraft] = useState('')
  const [counts, setCounts] = useState<UploadCounts>(EMPTY_COUNTS)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setMessage(null)

      try {
        const [ownerResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
          supabase
            .from('invite_owners')
            .select('invite_slug, owner_user_id, owner_email, owner_name, access_code_hash, claimed_at')
            .eq('invite_slug', inviteSlug)
            .maybeSingle(),
          supabase.from('guest_uploads').select('*', { count: 'exact', head: true }).eq('invite_slug', inviteSlug).eq('status', 'pending'),
          supabase.from('guest_uploads').select('*', { count: 'exact', head: true }).eq('invite_slug', inviteSlug).eq('status', 'approved'),
          supabase.from('guest_uploads').select('*', { count: 'exact', head: true }).eq('invite_slug', inviteSlug).eq('status', 'rejected'),
        ])

        if (ownerResult.error) throw new Error(ownerResult.error.message)
        if (pendingResult.error) throw new Error(pendingResult.error.message)
        if (approvedResult.error) throw new Error(approvedResult.error.message)
        if (rejectedResult.error) throw new Error(rejectedResult.error.message)
        if (cancelled) return

        const row = (ownerResult.data ?? null) as OwnerAccessRow | null
        setOwnerName(row?.owner_name ?? '')
        setOwnerEmail(row?.owner_email ?? '')
        setOwnerUserId(row?.owner_user_id ?? null)
        setClaimedAt(row?.claimed_at ?? null)
        setStoredAccessHash(row?.access_code_hash ?? '')
        setAccessCodeDraft(row ? '' : generateOwnerAccessCode())
        setCounts({
          pending: pendingResult.count ?? 0,
          approved: approvedResult.count ?? 0,
          rejected: rejectedResult.count ?? 0,
        })
      } catch (error) {
        if (!cancelled) {
          setMessage({
            type: 'err',
            text: error instanceof Error ? error.message : 'Não foi possível carregar os dados do responsável.',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [inviteSlug, supabase])

  const claimUrl = useMemo(() => {
    const code = normalizeOwnerAccessCode(accessCodeDraft)
    return code ? buildOwnerClaimUrl(inviteSlug, code) : ''
  }, [accessCodeDraft, inviteSlug])

  const hasLinkedOwner = Boolean(ownerUserId)

  const handleSave = async () => {
    const normalizedCode = normalizeOwnerAccessCode(accessCodeDraft)
    if (!storedAccessHash && !normalizedCode) {
      setMessage({ type: 'err', text: 'Gere um código de acesso antes de salvar.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const nextHash = normalizedCode ? await hashOwnerAccessCode(normalizedCode) : storedAccessHash
      const resetOwnerLink = Boolean(normalizedCode)

      const { error } = await supabase.from('invite_owners').upsert(
        {
          invite_slug: inviteSlug,
          owner_name: ownerName.trim(),
          owner_email: ownerEmail.trim() || null,
          access_code_hash: nextHash,
          owner_user_id: resetOwnerLink ? null : ownerUserId,
          claimed_at: resetOwnerLink ? null : claimedAt,
        },
        { onConflict: 'invite_slug' },
      )

      if (error) throw new Error(error.message)

      setStoredAccessHash(nextHash)
      setOwnerUserId(resetOwnerLink ? null : ownerUserId)
      setClaimedAt(resetOwnerLink ? null : claimedAt)
      setMessage({
        type: 'ok',
        text: resetOwnerLink
          ? 'Dados do responsável salvos. O novo código já pode ser enviado para primeiro acesso.'
          : 'Dados do responsável atualizados com sucesso.',
      })
    } catch (error) {
      setMessage({
        type: 'err',
        text: error instanceof Error ? error.message : 'Não foi possível salvar os dados do responsável.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {loading ? <p className="text-sm text-stone-500">Carregando dados do responsável…</p> : null}

      {message ? (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Nome do responsável</span>
          <input
            className={inputClass}
            placeholder="Ex.: Maria Silva"
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Email do responsável</span>
          <input
            type="email"
            className={inputClass}
            placeholder="responsavel@exemplo.com"
            value={ownerEmail}
            onChange={(event) => setOwnerEmail(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
            Novo código de acesso
          </span>
          <input
            className={`${inputClass} font-mono uppercase`}
            placeholder="ABCD-EFGH-IJKL"
            value={accessCodeDraft}
            onChange={(event) => setAccessCodeDraft(normalizeOwnerAccessCode(event.target.value))}
          />
          <p className="mt-2 text-xs text-stone-500">
            Se você gerar um novo código e salvar, o vínculo atual é reiniciado para um novo primeiro acesso.
          </p>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setAccessCodeDraft(generateOwnerAccessCode())}
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 md:w-auto"
          >
            Gerar código
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
        <p>
          <strong className="font-semibold text-stone-800">Status do vínculo:</strong>{' '}
          {hasLinkedOwner ? 'Responsável já vinculado' : 'Aguardando primeiro acesso'}
        </p>
        <p className="mt-1">
          <strong className="font-semibold text-stone-800">Última vinculação:</strong> {formatDateTime(claimedAt)}
        </p>
        <p className="mt-1">
          <strong className="font-semibold text-stone-800">Uploads:</strong> {counts.pending} pendentes, {counts.approved}{' '}
          aprovados, {counts.rejected} rejeitados
        </p>
      </div>

      {claimUrl ? (
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Link de primeiro acesso</span>
          <input className={`${inputClass} font-mono text-xs`} readOnly value={claimUrl} />
          <p className="mt-2 text-xs text-stone-500">
            Envie este link para o responsável criar a conta e vincular o convite.
          </p>
        </label>
      ) : (
        <p className="text-xs text-stone-500">
          O código atual já está salvo, mas não pode ser exibido novamente. Gere um novo código se precisar reenviar o acesso.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-full bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar responsável'}
        </button>
      </div>
    </div>
  )
}
