import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base: '/'` — assets em `/assets/...` a partir da raiz. Necessário para rotas aninhadas (`/c/:slug`);
// com `base: './'`, em `/c/x` o browser pedia `/c/assets/...` (404).
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
