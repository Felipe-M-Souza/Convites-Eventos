import { BrowserRouter, Navigate, Route, Routes, useSearchParams, useParams } from 'react-router-dom'
import { EventDataProvider } from './contexts/EventDataContext'
import { Home } from './pages/Home'
import { ExamplesPage } from './pages/ExamplesPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { AdminPanel } from './pages/AdminPanel'

function InviteRoute() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return (
    <EventDataProvider inviteSlug={slug}>
      <Home />
    </EventDataProvider>
  )
}

function AdminRoute() {
  const [searchParams] = useSearchParams()
  const slug = (searchParams.get('slug') ?? 'default').trim() || 'default'
  return (
    <EventDataProvider inviteSlug={slug}>
      <AdminPanel />
    </EventDataProvider>
  )
}

function LegacyInviteRedirectRoute() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return <Navigate to={`/c/${encodeURIComponent(slug)}`} replace />
}

function ShareInviteRedirectRoute() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return <Navigate to={`/c/${encodeURIComponent(slug)}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/modelos" element={<ExamplesPage />} />
        <Route path="/c/:slug" element={<InviteRoute />} />
        <Route path="/i/:slug" element={<ShareInviteRedirectRoute />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/:slug" element={<LegacyInviteRedirectRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
