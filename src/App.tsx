import { lazy, Suspense, useEffect } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
  useParams,
  type RouteObject,
} from 'react-router-dom'
import { EventDataProvider } from './contexts/EventDataProvider'
import { ExamplesPage } from './pages/ExamplesPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ServiceLandingPage } from './pages/ServiceLandingPage'
import { serviceLandingPagesBySlug } from './data/serviceLandingPages'
import { initAnalytics, trackPageView } from './lib/analytics'
import { I18nProvider } from './i18n/I18nProvider'
import { LanguageSwitcher } from './components/LanguageSwitcher'

// Páginas pesadas e dinâmicas (não pré-renderizadas no SSG) carregadas sob demanda.
// Assim, quem chega pela landing de marketing não baixa o código do convite/admin/owner,
// deixando a primeira página mais leve e rápida (melhor Core Web Vitals e Quality Score).
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const AdminPanel = lazy(() => import('./pages/AdminPanel').then((m) => ({ default: m.AdminPanel })))
const OwnerPanel = lazy(() => import('./pages/OwnerPanel').then((m) => ({ default: m.OwnerPanel })))
const OwnerClaimPage = lazy(() => import('./pages/OwnerClaimPage').then((m) => ({ default: m.OwnerClaimPage })))

function RouteFallback() {
  return <div className="min-h-dvh bg-[color:var(--color-cream)]" aria-hidden />
}

function InviteRoute() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/" replace />
  return (
    <EventDataProvider inviteSlug={slug}>
      <Suspense fallback={<RouteFallback />}>
        <Home />
      </Suspense>
    </EventDataProvider>
  )
}

function AdminRoute() {
  const [searchParams] = useSearchParams()
  const slug = (searchParams.get('slug') ?? 'default').trim() || 'default'
  return (
    <EventDataProvider inviteSlug={slug}>
      <Suspense fallback={<RouteFallback />}>
        <AdminPanel />
      </Suspense>
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

function RootLayout() {
  return (
    <I18nProvider>
      <AnalyticsListener />
      <LanguageSwitcher />
      <Outlet />
    </I18nProvider>
  )
}

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: PortfolioPage },
      { path: 'modelos', Component: ExamplesPage },
      {
        path: 'convite-digital/:serviceSlug',
        Component: ServiceLandingPage,
      },
      // Rotas dinâmicas/privadas — não pré-renderizadas (servidas via SPA fallback)
      { path: 'c/:slug', Component: InviteRoute },
      { path: 'i/:slug', Component: ShareInviteRedirectRoute },
      { path: 'admin', Component: AdminRoute },
      {
        path: 'owner',
        Component: () => (
          <Suspense fallback={<RouteFallback />}>
            <OwnerPanel />
          </Suspense>
        ),
      },
      {
        path: 'owner/claim',
        Component: () => (
          <Suspense fallback={<RouteFallback />}>
            <OwnerClaimPage />
          </Suspense>
        ),
      },
      { path: ':slug', Component: LegacyInviteRedirectRoute },
    ],
  },
]
