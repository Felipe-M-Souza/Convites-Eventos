import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { EventDataProvider } from './contexts/EventDataContext'
import { Home } from './pages/Home'
import { PortfolioPage } from './pages/PortfolioPage'

const AdminPanel = lazy(() => import('./pages/AdminPanel').then((m) => ({ default: m.AdminPanel })))

const suspenseFallback = (
  <div className="flex min-h-dvh items-center justify-center bg-[color:var(--color-cream)] text-stone-500">
    A carregar…
  </div>
)

function InviteRoute() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return (
    <EventDataProvider inviteSlug={slug}>
      <Home />
    </EventDataProvider>
  )
}

function AdminRouteShell() {
  const [searchParams] = useSearchParams()
  const raw = searchParams.get('slug')?.trim()
  const slug = raw && raw.length > 0 ? raw : 'default'
  return (
    <EventDataProvider inviteSlug={slug} key={slug}>
      <Suspense fallback={suspenseFallback}>
        <AdminPanel />
      </Suspense>
    </EventDataProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/c/:slug" element={<InviteRoute />} />
        <Route path="/admin" element={<AdminRouteShell />} />
      </Routes>
    </BrowserRouter>
  )
}
