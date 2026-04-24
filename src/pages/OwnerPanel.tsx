import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { type AppRole, fetchCurrentAppRole } from '../lib/appRoles'
import {
  canApproveGuestUpload,
  createGuestUploadSignedUrls,
  getGuestUploadDisplaySize,
  getGuestUploadPreviewPath,
  getGuestUploadProcessingLabel,
  formatGuestUploadDuration,
  type GuestUploadRecord,
  type GuestUploadWithUrl,
  removeGuestUploadAssets,
} from '../lib/guestUploads'
import { trackEvent } from '../lib/analytics'
import { isCmsConfigured, supabase } from '../lib/supabase'

type OwnerInviteRow = {
  invite_slug: string
  owner_email: string | null
  owner_name: string
  claimed_at: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return 'Ainda não'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OwnerPanel() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const forcedSlug = searchParams.get('slug')?.trim() ?? ''
  const claimSlug = searchParams.get('claimSlug')?.trim() ?? ''
  const claimCode = searchParams.get('claimCode')?.trim() ?? ''
  const createdAccount = searchParams.get('created') === '1'
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [role, setRole] = useState<AppRole | null | undefined>(undefined)
  const [email, setEmail] = useState(searchParams.get('email')?.trim() ?? '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [inviteRows, setInviteRows] = useState<OwnerInviteRow[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [uploads, setUploads] = useState<GuestUploadWithUrl[]>([])
  const [uploadsLoading, setUploadsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionInfo, setActionInfo] = useState<string | null>(null)
  const [actionUploadId, setActionUploadId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setRole(null)
      return
    }
    const client = supabase

    client.auth.getSession().then(async ({ data: { session: nextSession } }) => {
      setSession(nextSession ?? null)
      if (nextSession?.user.id) {
        try {
          setRole(await fetchCurrentAppRole(client, nextSession.user.id))
        } catch (error) {
          setActionError(error instanceof Error ? error.message : 'Não foi possível carregar o papel da conta.')
          setRole(null)
        }
      } else {
        setRole(null)
      }
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setActionError(null)
      setActionInfo(null)
      setInviteRows([])
      setUploads([])
      if (!nextSession?.user.id) {
        setRole(null)
        return
      }
      void fetchCurrentAppRole(client, nextSession.user.id)
        .then((nextRole) => setRole(nextRole))
        .catch((error) => {
          setActionError(error instanceof Error ? error.message : 'Não foi possível carregar o papel da conta.')
          setRole(null)
        })
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const nextEmail = searchParams.get('email')?.trim() ?? ''
    setEmail(nextEmail)
  }, [searchParams])

  useEffect(() => {
    if (!session || role !== null || !claimSlug || !claimCode) return
    navigate(`/owner/claim?slug=${encodeURIComponent(claimSlug)}&code=${encodeURIComponent(claimCode)}`, {
      replace: true,
    })
  }, [claimCode, claimSlug, navigate, role, session])

  useEffect(() => {
    if (!supabase || !session?.user.id || (role !== 'owner' && role !== 'admin')) return
    const client = supabase

    let cancelled = false

    const loadInviteRows = async () => {
      setInviteLoading(true)
      try {
        let query = client
          .from('invite_owners')
          .select('invite_slug, owner_email, owner_name, claimed_at')
          .order('invite_slug')

        if (forcedSlug) query = query.eq('invite_slug', forcedSlug)

        const { data, error } = await query
        if (error) throw new Error(error.message)
        if (cancelled) return

        const rows = (data ?? []) as OwnerInviteRow[]
        setInviteRows(rows)

        if (!forcedSlug && rows[0]?.invite_slug) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('slug', rows[0]!.invite_slug)
            return next
          })
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(error instanceof Error ? error.message : 'Não foi possível carregar os convites vinculados.')
        }
      } finally {
        if (!cancelled) setInviteLoading(false)
      }
    }

    void loadInviteRows()

    return () => {
      cancelled = true
    }
  }, [forcedSlug, role, session?.user.id, setSearchParams])

  const selectedInviteSlug = forcedSlug || inviteRows[0]?.invite_slug || ''

  useEffect(() => {
    if (!supabase || !selectedInviteSlug || (role !== 'owner' && role !== 'admin')) return
    const client = supabase

    let cancelled = false

    const loadUploads = async () => {
      setUploadsLoading(true)
      try {
        const { data, error } = await client
          .from('guest_uploads')
          .select(
            'id, invite_slug, guest_name, caption, original_file_name, file_size_bytes, original_file_size_bytes, processed_file_size_bytes, duration_seconds, file_type, mime_type, storage_path, processed_storage_path, processing_status, processing_error, status, created_at, reviewed_at, reviewed_by, approved_at, rejected_at',
          )
          .eq('invite_slug', selectedInviteSlug)
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)

        const records = (data ?? []) as GuestUploadRecord[]
        const signedMap = await createGuestUploadSignedUrls(
          client,
          records.map((record) => getGuestUploadPreviewPath(record)).filter(Boolean),
        )

        if (cancelled) return

        setUploads(
          records.map((record) => ({
            ...record,
            signedUrl: signedMap[getGuestUploadPreviewPath(record)] ?? '',
          })),
        )
      } catch (error) {
        if (!cancelled) {
          setActionError(error instanceof Error ? error.message : 'Não foi possível carregar os uploads do convite.')
        }
      } finally {
        if (!cancelled) setUploadsLoading(false)
      }
    }

    void loadUploads()

    return () => {
      cancelled = true
    }
  }, [role, selectedInviteSlug])

  const summary = useMemo(
    () => ({
      pending: uploads.filter((upload) => upload.status === 'pending').length,
      approved: uploads.filter((upload) => upload.status === 'approved').length,
      rejected: uploads.filter((upload) => upload.status === 'rejected').length,
    }),
    [uploads],
  )

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setLoginLoading(true)
    setLoginError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoginLoading(false)
    if (error) {
      setLoginError(error.message)
      return
    }

    setPassword('')
    if (claimSlug && claimCode) {
      navigate(`/owner/claim?slug=${encodeURIComponent(claimSlug)}&code=${encodeURIComponent(claimCode)}`, {
        replace: true,
      })
      return
    }
  }

  const reloadUploads = async () => {
    if (!supabase || !selectedInviteSlug) return
    const client = supabase
    const { data, error } = await client
      .from('guest_uploads')
      .select(
        'id, invite_slug, guest_name, caption, original_file_name, file_size_bytes, original_file_size_bytes, processed_file_size_bytes, duration_seconds, file_type, mime_type, storage_path, processed_storage_path, processing_status, processing_error, status, created_at, reviewed_at, reviewed_by, approved_at, rejected_at',
      )
      .eq('invite_slug', selectedInviteSlug)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const records = (data ?? []) as GuestUploadRecord[]
    const signedMap = await createGuestUploadSignedUrls(
      client,
      records.map((record) => getGuestUploadPreviewPath(record)).filter(Boolean),
    )

    setUploads(
      records.map((record) => ({
        ...record,
        signedUrl: signedMap[getGuestUploadPreviewPath(record)] ?? '',
      })),
    )
  }

  const updateUploadStatus = async (upload: GuestUploadWithUrl, status: 'approved' | 'rejected') => {
    if (!supabase || !session?.user.id) return
    const client = supabase

    setActionUploadId(upload.id)
    setActionError(null)
    setActionInfo(null)

    const reviewedAt = new Date().toISOString()
    const payload =
      status === 'approved'
        ? {
            status,
            reviewed_at: reviewedAt,
            reviewed_by: session.user.id,
            approved_at: reviewedAt,
            rejected_at: null,
          }
        : {
            status,
            reviewed_at: reviewedAt,
            reviewed_by: session.user.id,
            approved_at: null,
            rejected_at: reviewedAt,
          }

    try {
      const { error } = await client.from('guest_uploads').update(payload).eq('id', upload.id)
      if (error) throw new Error(error.message)

      trackEvent(status === 'approved' ? 'guest_upload_approved' : 'guest_upload_rejected', {
        invite_slug: upload.invite_slug,
        file_type: upload.file_type,
      })

      await reloadUploads()
      setActionInfo(status === 'approved' ? 'Upload aprovado com sucesso.' : 'Upload marcado como rejeitado.')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível atualizar o status.')
    } finally {
      setActionUploadId(null)
    }
  }

  const handleDeleteUpload = async (upload: GuestUploadWithUrl) => {
    if (!supabase) return
    const client = supabase

    setActionUploadId(upload.id)
    setActionError(null)
    setActionInfo(null)

    try {
      await removeGuestUploadAssets(client, [upload.storage_path, upload.processed_storage_path])
      const { error } = await client.from('guest_uploads').delete().eq('id', upload.id)
      if (error) throw new Error(error.message)
      await reloadUploads()
      setActionInfo('Arquivo removido com sucesso.')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível apagar o arquivo.')
    } finally {
      setActionUploadId(null)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  if (!isCmsConfigured) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-stone-800">Área do responsável</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Configure o Supabase antes de usar a aprovação de uploads. Depois, o responsável entra por aqui para moderar
            fotos e vídeos enviados pelos convidados.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    )
  }

  if (session === undefined || role === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-stone-500">Carregando acesso…</div>
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-stone-800">Área do responsável</h1>
          <p className="mt-2 text-sm text-stone-500">
            Entre com o email e a senha cadastrados para aprovar ou rejeitar uploads dos convidados.
          </p>
          {createdAccount ? (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Conta criada com sucesso. Faça login para concluir a vinculação do convite.
            </p>
          ) : null}
          <form className="mt-8 space-y-4" onSubmit={(event) => void handleLogin(event)}>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Email</span>
              <input
                type="email"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-full bg-[color:var(--color-gold)] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loginLoading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <Link to="/owner/claim" className="mt-6 block text-center text-sm text-stone-500 underline hover:text-stone-700">
            Primeiro acesso? Vincular convite
          </Link>
          <Link to="/" className="mt-2 block text-center text-sm text-stone-500 underline hover:text-stone-700">
            Voltar ao site
          </Link>
        </div>
      </div>
    )
  }

  if (role !== 'owner' && role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-stone-800">Conta sem vínculo</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Esta conta ainda não foi vinculada a nenhum convite. Use o link de primeiro acesso enviado pelo administrador.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/owner/claim"
              className="rounded-full bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Vincular convite
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="font-display text-3xl text-stone-800">Moderação de uploads</h1>
          <p className="mt-2 text-sm text-stone-500">
            Aprove ou rejeite fotos e vídeos enviados pelos convidados do seu convite.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={selectedInviteSlug ? `/c/${encodeURIComponent(selectedInviteSlug)}` : '/'}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Ver convite
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Conta</p>
            <p className="mt-2 break-all text-sm text-stone-700">{session.user.email}</p>
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Convite</span>
              <select
                value={selectedInviteSlug}
                onChange={(event) => {
                  const next = event.target.value
                  setSearchParams((prev) => {
                    const params = new URLSearchParams(prev)
                    params.set('slug', next)
                    return params
                  })
                }}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
              >
                {inviteRows.map((row) => (
                  <option key={row.invite_slug} value={row.invite_slug}>
                    {row.invite_slug}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {inviteLoading ? <p className="text-sm text-stone-500">Carregando convites…</p> : null}

          {selectedInviteSlug ? (
            <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
              <p className="font-semibold text-stone-800">{selectedInviteSlug}</p>
              <p className="mt-2">Pendentes: {summary.pending}</p>
              <p>Aprovados: {summary.approved}</p>
              <p>Rejeitados: {summary.rejected}</p>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Nenhum convite vinculado a esta conta.</p>
          )}
        </aside>

        <section className="space-y-4">
          {actionError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
          ) : null}
          {actionInfo ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionInfo}
            </div>
          ) : null}

          {!selectedInviteSlug ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-8 text-sm text-stone-500 shadow-sm">
              Este usuário ainda não possui convites vinculados.
            </div>
          ) : uploadsLoading ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-8 text-sm text-stone-500 shadow-sm">
              Carregando uploads…
            </div>
          ) : uploads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-sm text-stone-500 shadow-sm">
              Ainda não há uploads enviados para este convite.
            </div>
          ) : (
            uploads.map((upload) => {
              const busy = actionUploadId === upload.id
              const canApprove = canApproveGuestUpload(upload)
              return (
                <article key={upload.id} className="grid gap-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-[220px_1fr]">
                  <div className="overflow-hidden rounded-2xl bg-stone-100">
                    {upload.file_type === 'video' ? (
                      upload.signedUrl ? (
                        <video
                          className="aspect-[4/5] h-full w-full object-cover"
                          controls
                          playsInline
                          preload="metadata"
                          src={upload.signedUrl}
                        />
                      ) : (
                        <div className="flex aspect-[4/5] items-center justify-center px-4 text-center text-xs text-stone-500">
                          {upload.processing_status === 'failed'
                            ? 'Falha ao gerar a versão otimizada.'
                            : 'Vídeo ainda em processamento.'}
                        </div>
                      )
                    ) : (
                      <img src={upload.signedUrl} alt={upload.caption || 'Upload do convidado'} className="aspect-[4/5] h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-stone-800">
                          {upload.guest_name || 'Convidado sem identificação'}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                          {getGuestUploadProcessingLabel(upload)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-stone-500">
                        <p>Enviado em {formatDateTime(upload.created_at)}</p>
                        <p>Revisado em {formatDateTime(upload.reviewed_at)}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
                      <p>
                        <strong className="font-semibold text-stone-700">Arquivo:</strong> {upload.original_file_name}
                      </p>
                      <p>
                        <strong className="font-semibold text-stone-700">Tamanho:</strong>{' '}
                        {(getGuestUploadDisplaySize(upload) / (1024 * 1024)).toFixed(1)} MB
                      </p>
                      <p>
                        <strong className="font-semibold text-stone-700">Tipo:</strong>{' '}
                        {upload.file_type === 'video' ? 'Vídeo' : 'Foto'}
                      </p>
                      {upload.file_type === 'video' ? (
                        <p>
                          <strong className="font-semibold text-stone-700">Duração:</strong>{' '}
                          {upload.duration_seconds != null ? formatGuestUploadDuration(upload.duration_seconds) : 'Não informada'}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-sm leading-relaxed text-stone-600">{upload.caption || 'Sem legenda enviada.'}</p>
                    {upload.processing_error ? (
                      <p className="text-sm text-red-600">{upload.processing_error}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || !canApprove}
                        onClick={() => void updateUploadStatus(upload, 'approved')}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busy && upload.status !== 'approved' ? 'Salvando…' : 'Aprovar'}
                      </button>
                      <button
                        type="button"
                        disabled={busy || upload.status === 'rejected'}
                        onClick={() => void updateUploadStatus(upload, 'rejected')}
                        className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busy && upload.status !== 'rejected' ? 'Salvando…' : 'Rejeitar'}
                      </button>
                      {upload.status === 'rejected' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDeleteUpload(upload)}
                          className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                        >
                          {busy ? 'Apagando…' : 'Apagar arquivo'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}
