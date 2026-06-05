import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import './index.css'

// ViteReactSSG cuida da hidratação no cliente e da pré-renderização no build.
// No browser, monta normalmente em #root; no build, gera o HTML estático de cada rota.
export const createRoot = ViteReactSSG({ routes })
