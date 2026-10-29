import type { EventData } from '../data/eventData'

export function parseIsoLocal(iso: string): Date | null {
  const match = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  if (!match) return null
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
  )
  return Number.isNaN(date.getTime()) ? null : date
}

export function monthCells(date: Date): Array<number | null> {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const cells: Array<number | null> = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function weekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(2024, 0, 1 + index)
    return day.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')
  })
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function calendarStamp(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

export function googleCalendarUrl(data: EventData, start: Date): string {
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000)
  const location = [data.receptionVenue || data.venue, data.receptionAddress || data.address]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', data.coupleNames.trim() || 'Convite')
  url.searchParams.set('dates', `${calendarStamp(start)}/${calendarStamp(end)}`)
  url.searchParams.set('details', data.message.trim().slice(0, 280))
  if (location) url.searchParams.set('location', location)
  return url.toString()
}
