/**
 * Configuração centralizada de contato comercial (lead generation).
 * Mantenha sincronizado com a página /portfolio caso o número mude.
 */

/** WhatsApp comercial — formato E.164 sem espaços ou símbolos. */
export const LEAD_WHATSAPP_E164 = '5511965814224'

/** Mensagem padrão pré-preenchida no WhatsApp quando não há contexto específico. */
export const LEAD_DEFAULT_MESSAGE =
  'Olá! Vi o site Convites Diversos e gostaria de receber um orçamento para convite digital.'

/**
 * Gera o link wa.me com mensagem opcional pré-preenchida.
 * Use `customMessage` para personalizar pela ocasião (ex.: "Vi a página de Casamento...").
 */
export function buildLeadWhatsappHref(customMessage?: string): string {
  const text = customMessage?.trim() || LEAD_DEFAULT_MESSAGE
  return `https://wa.me/${LEAD_WHATSAPP_E164}?text=${encodeURIComponent(text)}`
}

/**
 * Constrói uma mensagem específica de uma landing page de serviço,
 * baseada no nome legível da ocasião (ex.: "casamento", "15 anos").
 */
export function buildLeadMessageForOccasion(occasion: string): string {
  const trimmed = occasion?.trim()
  if (!trimmed) return LEAD_DEFAULT_MESSAGE
  return `Olá! Vi a página de convites de ${trimmed} no site Convites Diversos e gostaria de receber um orçamento.`
}
