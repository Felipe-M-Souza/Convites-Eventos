import { createContext } from 'react'
import type { EventData } from '../data/eventData'

export type EventDataLoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'not_found'

export type EventDataContextValue = {
  data: EventData
  status: EventDataLoadStatus
  refresh: () => Promise<void>
  source: 'local' | 'supabase'
  /** Slug do URL público /c/:slug */
  inviteSlug: string
  /** PK em invite_config (upsert admin, pasta no Storage) */
  inviteId: string | null
  /** Com Supabase configurado, não existe linha com este slug. */
  inviteNotFound: boolean
}

export const EventDataContext = createContext<EventDataContextValue | null>(null)
