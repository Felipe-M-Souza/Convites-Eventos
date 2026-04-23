function upsertMetaByName(name: string, content: string) {
  let node = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute('name', name)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

function upsertMetaByProperty(property: string, content: string) {
  let node = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute('property', property)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

function upsertCanonical(url: string) {
  let node = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!node) {
    node = document.createElement('link')
    node.setAttribute('rel', 'canonical')
    document.head.appendChild(node)
  }
  node.setAttribute('href', url)
}

export function applySeoMeta({
  title,
  description,
  image,
  url,
}: {
  title: string
  description: string
  image: string
  url: string
}) {
  document.title = title
  upsertMetaByName('description', description)
  upsertCanonical(url)
  upsertMetaByProperty('og:title', title)
  upsertMetaByProperty('og:description', description)
  upsertMetaByProperty('og:image', image)
  upsertMetaByProperty('og:url', url)
  upsertMetaByProperty('og:type', 'website')
  upsertMetaByName('twitter:card', 'summary_large_image')
  upsertMetaByName('twitter:title', title)
  upsertMetaByName('twitter:description', description)
  upsertMetaByName('twitter:image', image)
}
