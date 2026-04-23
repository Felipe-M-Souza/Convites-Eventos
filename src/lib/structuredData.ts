function upsertJsonLdScript(id: string, payload: unknown) {
  let node = document.head.querySelector(`script[data-structured-id="${id}"]`) as HTMLScriptElement | null
  if (!node) {
    node = document.createElement('script')
    node.type = 'application/ld+json'
    node.dataset.structuredId = id
    document.head.appendChild(node)
  }
  node.text = JSON.stringify(payload)
}

function removeJsonLdScript(id: string) {
  const node = document.head.querySelector(`script[data-structured-id="${id}"]`) as HTMLScriptElement | null
  node?.remove()
}

export function applyStructuredData(id: string, payload: unknown) {
  upsertJsonLdScript(id, payload)
}

export function clearStructuredData(id: string) {
  removeJsonLdScript(id)
}
