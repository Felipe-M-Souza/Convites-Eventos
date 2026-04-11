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

type Status = 'idle' | 'loading' | 'ready' | 'error'

type EventDataContextValue = {
  data: EventData
  status: Status
  /** Recarrega do Supabase (útil após guardar no admin). */
  refresh: () => Promise<void>
  /** Origem dos dados mostrados ao visitante. */
  source: 'local' | 'supabase'
}

const EventDataContext = createContext<EventDataContextValue | null>(null)

const CONFIG_ID = 'default'

export function EventDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EventData>(eventData)
  const [status, setStatus] = useState<Status>('idle')
  const [source, setSource] = useState<'local' | 'supabase'>('local')

  const load = useCallback(async () => {
    if (!isCmsConfigured || !supabase) {
      setData(eventData)
      setSource('local')
      setStatus('ready')
      return
    }
    setStatus('loading')
    const { data: row, error } = await supabase
      .from('invite_config')
      .select('payload')
      .eq('id', CONFIG_ID)
      .maybeSingle()

    if (error) {
      console.error('[CMS]', error.message)
      setData(mergeInvitePayload(null))
      setSource('local')
      setStatus('error')
      return
    }

    setData(mergeInvitePayload(row?.payload))
    setSource('supabase')
    setStatus('ready')
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo(
    () => ({
      data,
      status,
      refresh: load,
      source,
    }),
    [data, status, load, source],
  )

  return <EventDataContext.Provider value={value}>{children}</EventDataContext.Provider>
}

export function useEventData(): EventDataContextValue {
  const ctx = useContext(EventDataContext)
  if (!ctx) throw new Error('useEventData deve ser usado dentro de EventDataProvider')
  return ctx
}
