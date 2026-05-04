import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams, useParams } from 'react-router-dom'
import type { RouteRecord } from 'vite-react-ssg'
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
import { I18nProvider } from './i18n/I18nProvider'
import { LanguageSwitcher } from './components/LanguageSwitcher'

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

function RootLayout() {
  return (
    <I18nProvider>
      <AnalyticsListener />
      <LanguageSwitcher />
      <Outlet />
    </I18nProvider>
  )
}

/**
 * Slugs das landing pages SEO de serviço — usados para pré-renderização
 * estática pelo vite-react-ssg. Mantenha em sincronia com:
 *   - public/sitemap.xml
 *   - src/data/serviceLandingPages.ts
 *   - ssgOptions.includedRoutes em vite.config.ts
 */
const SERVICE_LANDING_SLUGS = [
  'aniversario-infantil',
  '15-anos',
  'cha-de-bebe',
  'cha-revelacao',
  'aniversario-adulto',
  'homenagem',
  'casamento',
  'bodas',
] as const

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: PortfolioPage },
      { path: 'modelos', Component: ExamplesPage },
      {
        path: 'convite-digital/:serviceSlug',
        Component: ServiceLandingPage,
        getStaticPaths: () =>
          SERVICE_LANDING_SLUGS.map((slug) => `convite-digital/${slug}`),
      },
      // Rotas dinâmicas/privadas — não pré-renderizadas (servidas via SPA fallback)
      { path: 'c/:slug', Component: InviteRoute },
      { path: 'i/:slug', Component: ShareInviteRedirectRoute },
      { path: 'admin', Component: AdminRoute },
      { path: 'owner', Component: OwnerPanel },
      { path: 'owner/claim', Component: OwnerClaimPage },
      { path: ':slug', Component: LegacyInviteRedirectRoute },
    ],
  },
]
