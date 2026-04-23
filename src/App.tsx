import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useSearchParams, useParams } from 'react-router-dom'
import { EventDataProvider } from './contexts/EventDataProvider'
import { Home } from './pages/Home'
import { ExamplesPage } from './pages/ExamplesPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { AdminPanel } from './pages/AdminPanel'
import { OwnerPanel } from './pages/OwnerPanel'
import { OwnerClaimPage } from './pages/OwnerClaimPage'
import { ServiceLandingPage } from './pages/ServiceLandingPage'
import { serviceLandingPagesBySlug } from './data/serviceLandingPages'
import { initAnalytics, trackPageView } from './lib/analytics'

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
  if (slug.startsWith('convite-digital-')) {
    const seoSlug = slug.slice('convite-digital-'.length).trim()
    if (serviceLandingPagesBySlug[seoSlug]) {
      return <Navigate to={`/convite-digital/${encodeURIComponent(seoSlug)}`} replace />
    }
  }
  return <Navigate to={`/c/${encodeURIComponent(slug)}`} replace />
}

function ShareInviteRedirectRoute() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return <Navigate to={`/c/${encodeURIComponent(slug)}`} replace />
}

function AnalyticsListener() {
  const location = useLocation()

  useEffect(() => {
    initAnalytics()
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner')) return
    trackPageView(`${location.pathname}${location.search}`, document.title)
  }, [location.pathname, location.search])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsListener />
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/modelos" element={<ExamplesPage />} />
        <Route path="/convite-digital/:serviceSlug" element={<ServiceLandingPage />} />
        <Route path="/c/:slug" element={<InviteRoute />} />
        <Route path="/i/:slug" element={<ShareInviteRedirectRoute />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/owner" element={<OwnerPanel />} />
        <Route path="/owner/claim" element={<OwnerClaimPage />} />
        <Route path="/:slug" element={<LegacyInviteRedirectRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
