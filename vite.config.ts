import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type UserConfig } from 'vite'

// `base: '/'` — assets em `/assets/...` a partir da raiz. Necessário para rotas aninhadas (`/c/:slug`);
// com `base: './'`, em `/c/x` o browser pedia `/c/assets/...` (404).

/**
 * Lista explícita das rotas a pré-renderizar (SSG) — espelha public/sitemap.xml.
 * Rotas dinâmicas/privadas (/c/:slug, /admin, /owner, etc.) ficam fora e
 * são servidas em modo SPA pelo fallback do Render (rewrite /* → /index.html).
 */
const SSG_ROUTES = [
  '/',
  '/modelos',
  '/convite-digital/aniversario-infantil',
  '/convite-digital/15-anos',
  '/convite-digital/cha-de-bebe',
  '/convite-digital/cha-revelacao',
  '/convite-digital/aniversario-adulto',
  '/convite-digital/homenagem',
  '/convite-digital/casamento',
  '/convite-digital/bodas',
  '/convite-digital/evento-corporativo',
]

const config: UserConfig & {
  ssgOptions?: {
    entry?: string
    script?: 'sync' | 'async' | 'defer' | 'async defer'
    dirStyle?: 'flat' | 'nested'
    formatting?: 'prettify' | 'none'
    crittersOptions?: unknown
    includeAllRoutes?: boolean
    includedRoutes?: () => string[] | Promise<string[]>
  }
} = {
  base: '/',
  plugins: [react(), tailwindcss()],
  ssgOptions: {
    entry: 'src/main.tsx',
    script: 'async',
    // 'nested' gera /modelos/index.html, /convite-digital/casamento/index.html, etc.
    // Servidores estáticos (incluindo Render) entregam /modelos/ → /modelos/index.html
    // automaticamente, mantendo URLs limpas e SEO-friendly.
    dirStyle: 'nested',
    // formatting: 'prettify' causa Hydration Failed segundo a doc oficial.
    formatting: 'none',
    // critters faz inlining de CSS crítico — pode quebrar Tailwind v4 em alguns casos.
    crittersOptions: false,
    // Lista explícita: só pré-renderiza essas 10 rotas públicas.
    // Não pré-renderiza /admin, /owner, /c/:slug, etc.
    includedRoutes: () => SSG_ROUTES,
  },
}

export default defineConfig(config)
