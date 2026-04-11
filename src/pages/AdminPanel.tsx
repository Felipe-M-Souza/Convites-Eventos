import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AdminEditor } from './AdminEditor'
import { isCmsConfigured, supabase } from '../lib/supabase'

export function AdminPanel() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setLoginError(null)
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoginLoading(false)
    if (error) {
      setLoginError(error.message)
      return
    }
    setPassword('')
  }

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  if (!isCmsConfigured) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-stone-800">Painel administrativo</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            O CMS usa Supabase. Define as variáveis de ambiente{' '}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code> e{' '}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code> no
            ficheiro <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">.env</code> (desenvolvimento) e no
            build do Render (produção), depois segue o ficheiro <code className="text-xs">CMS_SETUP.md</code> na raiz
            do projeto.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Voltar ao convite
          </Link>
        </div>
      </div>
    )
  }

  if (session === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-stone-500">
        A carregar sessão…
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-stone-800">Entrar</h1>
          <p className="mt-2 text-sm text-stone-500">Utilizador criado no Supabase (Auth → Users).</p>
          <form className="mt-8 space-y-4" onSubmit={(e) => void handleLogin(e)}>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Email</span>
              <input
                type="email"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Palavra-passe</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-full bg-[color:var(--color-gold)] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loginLoading ? 'A entrar…' : 'Entrar'}
            </button>
          </form>
          <Link to="/" className="mt-8 block text-center text-sm text-stone-500 underline hover:text-stone-700">
            Voltar ao convite
          </Link>
        </div>
      </div>
    )
  }

  return <AdminEditor onSignOut={() => void handleSignOut()} />
}
