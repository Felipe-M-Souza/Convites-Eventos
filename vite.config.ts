import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base: './'` gera URLs relativas (`./assets/...`) — evita 404 em hosts estáticos (ex.: Render).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
