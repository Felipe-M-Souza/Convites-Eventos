/** Redimensiona mantendo proporção; saída JPEG para tamanho previsível no Storage. */
export async function resizeImageToJpeg(
  file: File,
  maxEdgePx: number,
  quality: number,
): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Não foi possível ler a imagem. Usa JPG, PNG ou WebP.')
  }
  try {
    const { width, height } = bitmap
    const scale = Math.min(1, maxEdgePx / Math.max(width, height))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponível.')
    ctx.drawImage(bitmap, 0, 0, w, h)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Exportação JPEG falhou.'))),
        'image/jpeg',
        quality,
      )
    })
  } finally {
    bitmap.close()
  }
}
