import type { DayProgramItem, GuestbookSample } from '../data/eventData'

export function programToText(items: DayProgramItem[]): string {
  return items.map((item) => (item.time ? `${item.time} | ${item.title}` : item.title)).join('\n')
}

export function textToProgram(text: string): DayProgramItem[] {
  return text
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim()
      if (!trimmed) return []
      const [time, ...rest] = trimmed.split('|')
      const title = rest.join('|').trim()
      if (!rest.length) return [{ time: '', title: time.trim() }]
      return [{ time: time.trim(), title }]
    })
    .slice(0, 12)
}

export function samplesToText(items: GuestbookSample[]): string {
  return items.map((item) => `${item.name} | ${item.message}`).join('\n')
}

export function textToSamples(text: string): GuestbookSample[] {
  return text
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim()
      if (!trimmed) return []
      const [name, ...rest] = trimmed.split('|')
      const message = rest.join('|').trim()
      if (!name.trim() || !message) return []
      return [{ name: name.trim(), message }]
    })
    .slice(0, 12)
}
