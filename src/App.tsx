import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { EventDataProvider } from './contexts/EventDataContext'
import { Home } from './pages/Home'

const AdminPanel = lazy(() => import('./pages/AdminPanel').then((m) => ({ default: m.AdminPanel })))

export default function App() {
  return (
    <BrowserRouter>
      <EventDataProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/admin"
            element={
              <Suspense
                fallback={
                  <div className="flex min-h-dvh items-center justify-center bg-[color:var(--color-cream)] text-stone-500">
                    A carregar…
                  </div>
                }
              >
                <AdminPanel />
              </Suspense>
            }
          />
        </Routes>
      </EventDataProvider>
    </BrowserRouter>
  )
}
