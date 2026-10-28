import jsQR from 'jsqr'

export type QrAction =
  | { kind: 'url'; href: string }
  | { kind: 'pix-key'; key: string; copyText: string }
  | { kind: 'pix-code'; key: string; copyText: string }
  | { kind: 'text'; copyText: string }

function readTlv(value: string): Array<{ id: string; value: string }> {
  const fields: Array<{ id: string; value: string }> = []
  let index = 0
  while (index + 4 <= value.length) {
    const id = value.slice(index, index + 2)
    const length = Number(value.slice(index + 2, index + 4))
    if (!/^\d{2}$/.test(id) || !Number.isInteger(length) || length < 0) break
    const start = index + 4
    const end = start + length
    if (end > value.length) break
    fields.push({ id, value: value.slice(start, end) })
    index = end
  }
  return fields
}

/** Chave Pix dentro de um BR Code, quando o QR é um código de pagamento. */
export function pixKeyFromBrCode(payload: string): string {
  if (!payload.startsWith('000201')) return ''
  const merchant = readTlv(payload).find((field) => field.id === '26')
  if (!merchant) return ''
  return readTlv(merchant.value).find((field) => field.id === '01')?.value.trim() ?? ''
}

export function classifyQrPayload(payload: string): QrAction | null {
  const value = payload.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return { kind: 'url', href: value }
  if (value.startsWith('000201')) {
    return { kind: 'pix-code', key: pixKeyFromBrCode(value), copyText: value }
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { kind: 'pix-key', key: value, copyText: value }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return { kind: 'pix-key', key: value, copyText: value }
  }
  return { kind: 'text', copyText: value }
}

async function decodeImage(image: CanvasImageSource, width: number, height: number): Promise<string | null> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height)
  return jsQR(pixels.data, pixels.width, pixels.height)?.data?.trim() || null
}

export async function readQrFromUrl(src: string): Promise<string | null> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível ler a imagem do QR.'))
  })
  image.src = src
  const ready = await loaded
  return decodeImage(ready, ready.naturalWidth, ready.naturalHeight)
}

export async function readQrFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file)
  try {
    return await readQrFromUrl(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}
