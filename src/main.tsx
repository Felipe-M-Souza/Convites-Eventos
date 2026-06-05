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

// Build CSR entrega o #root vazio. Se o servidor ainda servir HTML pré-renderizado
// de um build SSG antigo (data-server-rendered), removemos esse conteúdo antes de
// montar para não exibir a página duplicada (pré-render + render do cliente).
if (rootElement.hasChildNodes()) {
  rootElement.replaceChildren()
}
rootElement.removeAttribute('data-server-rendered')

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
