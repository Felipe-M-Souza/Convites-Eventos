/** Chave Pix da loja. O QR de R$ 50 usa este e-mail. */
export const PIX_KEY = 'contato@convitesdiversos.com.br'

const MERCHANT_NAME = 'CONVITES DIVERSOS'
const MERCHANT_CITY = 'SAO PAULO'

function field(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${id}${length}${value}`
}

/** CRC-16/CCITT-FALSE, como o Banco Central exige no BR Code. */
function crc16(payload: string): string {
  let crc = 0xffff
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021
      else crc <<= 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** BR Code estático com valor, para o app do banco preencher o Pix. */
export function buildPixBrCode(amountCents: number, key = PIX_KEY): string {
  const amount = (amountCents / 100).toFixed(2)
  const merchant = field('00', 'br.gov.bcb.pix') + field('01', key)
  const additional = field('05', '***')
  const body =
    field('00', '01') +
    field('01', '11') +
    field('26', merchant) +
    field('52', '0000') +
    field('53', '986') +
    field('54', amount) +
    field('58', 'BR') +
    field('59', MERCHANT_NAME) +
    field('60', MERCHANT_CITY) +
    field('62', additional) +
    '6304'
  return body + crc16(body)
}
