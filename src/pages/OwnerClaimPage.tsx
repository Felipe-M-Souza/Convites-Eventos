import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { normalizeOwnerAccessCode } from '../lib/ownerAccess'
import { normalizeInviteSlug } from '../lib/inviteSlug'
import { isCmsConfigured, supabase } from '../lib/supabase'

function mapOwnerClaimError(message: string) {
  switch (message) {
    case 'OWNER_EMAIL_MISMATCH':
      return 'Você está logado com um e-mail diferente do responsável vinculado a este convite. Saia da conta atual e entre com o e-mail correto.'
    case 'INVALID_ACCESS_CODE':
      return 'O código de acesso é inválido ou já foi substituído por um novo.'
    case 'INVITE_ALREADY_CLAIMED':
      return 'Este convite já foi vinculado a outra conta.'
    case 'INVITE_OWNER_NOT_FOUND':
      return 'Não encontramos um responsável configurado para este convite.'
    case 'AUTH_REQUIRED':
      return 'Faça login para vincular este convite.'
    default:
      return message
  }
}

export function OwnerClaimPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [inviteSlug, setInviteSlug] = useState(searchParams.get('slug') ?? '')
  const [accessCode, setAccessCode] = useState(searchParams.get('code') ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const normalizedInviteSlug = inviteSlug.trim() ? (normalizeInviteSlug(inviteSlug) ?? inviteSlug.trim()) : ''
  const normalizedAccessCode = normalizeOwnerAccessCode(accessCode)
  const ownerLoginParams = new URLSearchParams()
  if (normalizedInviteSlug) {
    ownerLoginParams.set('slug', normalizedInviteSlug)
    ownerLoginParams.set('claimSlug', normalizedInviteSlug)
  }
  if (normalizedAccessCode) ownerLoginParams.set('claimCode', normalizedAccessCode)
  const ownerLoginQuery = ownerLoginParams.toString()
  const ownerLoginPath = `/owner${ownerLoginQuery ? `?${ownerLoginQuery}` : ''}`

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const claimInvite = async () => {
    if (!supabase) return
    if (!normalizedInviteSlug || !normalizedAccessCode) {
      setError('Informe o slug do convite e o código de acesso.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    const { error } = await supabase.rpc('claim_invite_owner', {
      p_invite_slug: normalizedInviteSlug,
      p_access_code: normalizedAccessCode,
    })

    setLoading(false)
    if (error) {
      setError(mapOwnerClaimError(error.message))
      return
    }

    setInfo('Convite vinculado com sucesso. Redirecionando para a área do responsável…')
    window.setTimeout(() => {
      navigate(`/owner?slug=${encodeURIComponent(normalizedInviteSlug)}`, { replace: true })
    }, 500)
  }

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    if (!normalizedInviteSlug || !normalizedAccessCode) {
      setError('Informe o slug do convite e o código de acesso.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    if (data.session) {
      setSession(data.session)
      setInfo('Conta criada. Finalizando a vinculação do convite…')
      await claimInvite()
      return
    }

    setLoading(false)
    const next = new URLSearchParams()
    next.set('email', email.trim())
    next.set('created', '1')
    next.set('claimSlug', normalizedInviteSlug)
    next.set('claimCode', normalizedAccessCode)
    if (normalizedInviteSlug) next.set('slug', normalizedInviteSlug)
    navigate(`/owner?${next.toString()}`, { replace: true })
  }

  const handleSignOut = async () => {
    if (!supabase) return
    setError(null)
    setInfo(null)
    await supabase.auth.signOut()
  }

  if (!isCmsConfigured) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-stone-800">Primeiro acesso do responsável</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Configure o Supabase antes de usar a área do responsável pelos uploads.
          </p>
        </div>
      </div>
    )
  }

  if (session === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-stone-500">Carregando acesso…</div>
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl text-stone-800">Primeiro acesso do responsável</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Use o link enviado pelo administrador para vincular este convite à sua conta. Depois, a aprovação de fotos e
          vídeos passa a acontecer em <code className="rounded bg-stone-100 px-1">/owner</code>.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Slug do convite</span>
            <input
              type="text"
              value={inviteSlug}
              onChange={(event) => setInviteSlug(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
              placeholder="ex.: maria-joao"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Código de acesso</span>
            <input
              type="text"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm uppercase outline-none focus:border-[color:var(--color-gold)]"
              placeholder="ABCD-EFGH-IJKL"
            />
          </label>
        </div>

        {!session ? (
          <form className="mt-8 space-y-4" onSubmit={(event) => void handleSignUp(event)}>
            <h2 className="font-display text-2xl text-stone-800">Criar conta</h2>
            <p className="text-sm text-stone-500">
              Se você já possui uma conta, entre em <Link to={ownerLoginPath} className="underline">/owner</Link> e depois volte a este link.
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Senha</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Confirmar senha</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-700">{info}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[color:var(--color-gold)] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Criando conta…' : 'Criar conta e vincular convite'}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
              <p>
                Você está autenticado como <strong className="font-semibold text-stone-800">{session.user.email}</strong>.
              </p>
              <p className="mt-2">
                Se este não for o e-mail do responsável, saia da conta atual para criar ou entrar com outro usuário.
              </p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-700">{info}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={loading}
                onClick={() => void claimInvite()}
                className="w-full rounded-full bg-[color:var(--color-gold)] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Vinculando…' : 'Vincular este convite'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSignOut()}
                className="w-full rounded-full border border-stone-300 py-3 text-sm font-semibold text-stone-700 disabled:opacity-50"
              >
                Sair desta conta
              </button>
            </div>

            <Link to={ownerLoginPath} className="block text-center text-sm text-stone-500 underline hover:text-stone-700">
              Ir para login do responsável
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
