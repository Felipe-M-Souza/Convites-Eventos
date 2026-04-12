import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { eventData, mergeInvitePayload, type EventData } from '../data/eventData'
import { isCmsConfigured, supabase } from '../lib/supabase'

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'not_found'

type EventDataContextValue = {
  data: EventData
  status: Status
  refresh: () => Promise<void>
  source: 'local' | 'supabase'
  /** Slug do URL público /c/:slug */
  inviteSlug: string
  /** PK em invite_config (upsert admin, pasta no Storage) */
  inviteId: string | null
  /** Com Supabase configurado, não existe linha com este slug. */
  inviteNotFound: boolean
}

const EventDataContext = createContext<EventDataContextValue | null>(null)

type ProviderProps = {
  inviteSlug: string
  children: ReactNode
}

export function EventDataProvider({ inviteSlug, children }: ProviderProps) {
  const [data, setData] = useState<EventData>(eventData)
  const [status, setStatus] = useState<Status>('idle')
  const [source, setSource] = useState<'local' | 'supabase'>('local')
  const [inviteId, setInviteId] = useState<string | null>(null)
  const [inviteNotFound, setInviteNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!isCmsConfigured || !supabase) {
      setData(eventData)
      setSource('local')
      setStatus('ready')
      setInviteId(null)
      setInviteNotFound(false)
      return
    }

    setStatus('loading')
    setInviteNotFound(false)

    const { data: row, error } = await supabase
      .from('invite_config')
      .select('id, payload')
      .eq('slug', inviteSlug)
      .maybeSingle()

    if (error) {
      console.error('[CMS]', error.message)
      setData(mergeInvitePayload(null))
      setSource('local')
      setStatus('error')
      setInviteId(null)
      setInviteNotFound(false)
      return
    }

    if (!row) {
      setData(eventData)
      setSource('supabase')
      setStatus('not_found')
      setInviteId(null)
      setInviteNotFound(true)
      return
    }

    setInviteId(row.id as string)
    setData(mergeInvitePayload(row.payload))
    setSource('supabase')
    setStatus('ready')
    setInviteNotFound(false)
  }, [inviteSlug])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo(
    () => ({
      data,
      status,
      refresh: load,
      source,
      inviteSlug,
      inviteId,
      inviteNotFound,
    }),
    [data, status, load, source, inviteSlug, inviteId, inviteNotFound],
  )

  return <EventDataContext.Provider value={value}>{children}</EventDataContext.Provider>
}

export function useEventData(): EventDataContextValue {
  const ctx = useContext(EventDataContext)
  if (!ctx) throw new Error('useEventData deve ser usado dentro de EventDataProvider')
  return ctx
}
