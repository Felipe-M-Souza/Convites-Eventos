import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'

const FRAME_WIDTH = 390
const FRAME_HEIGHT = 700
const SCALE = 0.68

/**
 * O exemplo em filme roda de verdade, em miniatura, no lugar da moldura estática.
 */
export function FilmHeroPreview() {
  const { locale } = useI18n()
  const caption =
    locale === 'en' ? 'Film invitation example' : locale === 'es' ? 'Ejemplo de invitación en filme' : 'Exemplo de convite em filme'
  const open = locale === 'en' ? 'Open this example' : locale === 'es' ? 'Abrir este ejemplo' : 'Abrir este exemplo'

  return (
    <div className="mb-6">
      <div
        className="relative mx-auto overflow-hidden rounded-[1.7rem] border border-[#e4d3ae] bg-[#efe6d8] shadow-[0_18px_40px_rgba(80,60,30,0.16)]"
        style={{ width: Math.round(FRAME_WIDTH * SCALE), height: Math.round(FRAME_HEIGHT * SCALE) }}
      >
        <iframe
          title={caption}
          src="/c/default-filme?embed=1"
          tabIndex={-1}
          className="pointer-events-none absolute left-1/2 top-0 origin-top -translate-x-1/2"
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${SCALE})` }}
        />
      </div>
      <Link
        to="/c/default-filme"
        className="mt-3 block text-center text-sm font-semibold text-[color:var(--color-gold)] underline decoration-[color:var(--color-gold-soft)] underline-offset-4"
      >
        {open}
      </Link>
    </div>
  )
}
