import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './App'
import './index.css'

const router = createBrowserRouter(routes)

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root não encontrado em index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
