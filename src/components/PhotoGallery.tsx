import { motion, useReducedMotion } from 'framer-motion'
import type { EventData } from '../data/eventData'

type Props = {
  photos: EventData['galleryPhotos']
}

export function PhotoGallery({ photos }: Props) {
  const reduce = useReducedMotion()

  if (!photos.length) return null

  return (
    <motion.section
      id="galeria"
      className="mx-auto max-w-5xl px-6 py-20"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65 }}
    >
      <h2 className="text-center font-display text-3xl text-[color:var(--color-ink)] md:text-4xl">
        Momentos
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[color:var(--color-ink-muted)]">
        Alguns registros que aquecem o coração até o grande dia.
      </p>
      <div className="mt-10 columns-2 gap-3 sm:columns-3 sm:gap-4">
        {photos.map((src, i) => (
          <motion.figure
            key={`${i}-${src}`}
            className="mb-3 break-inside-avoid overflow-hidden rounded-xl shadow-md sm:mb-4"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ delay: i * 0.05, duration: 0.45 }}
          >
            <img
              src={src}
              alt=""
              className="block w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </motion.figure>
        ))}
      </div>
    </motion.section>
  )
}
