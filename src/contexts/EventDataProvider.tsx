import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { eventData, mergeInvitePayload, sageCloneSlug, withDefaultInviteShowcase, withSageClone, type EventData } from '../data/eventData'
import { demoInvitesBySlug } from '../data/demoInvites'
import { isCmsConfigured, supabase } from '../lib/supabase'
import {
  EventDataContext,
  type EventDataLoadStatus,
} from './eventDataContext'

type ProviderProps = {
  inviteSlug: string
  children: ReactNode
}

export function EventDataProvider({ inviteSlug, children }: ProviderProps) {
  const [data, setData] = useState<EventData>(eventData)
  const [status, setStatus] = useState<EventDataLoadStatus>('idle')
  const [source, setSource] = useState<'local' | 'supabase'>('local')
  const [inviteId, setInviteId] = useState<string | null>(null)
  const [inviteNotFound, setInviteNotFound] = useState(false)

  const load = useCallback(async () => {
    const builtInDemo = demoInvitesBySlug[inviteSlug]
    if (builtInDemo) {
      setData(builtInDemo)
      setSource('local')
      setStatus('ready')
      setInviteId(null)
      setInviteNotFound(false)
      return
    }

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

    if (!row && inviteSlug === sageCloneSlug) {
      const { data: base, error: baseError } = await supabase
        .from('invite_config')
        .select('id, payload')
        .eq('slug', 'default')
        .maybeSingle()

      if (!baseError && base) {
        const merged = withDefaultInviteShowcase(mergeInvitePayload(base.payload), 'default', base.payload)
        setInviteId(null)
        setData(withSageClone(merged))
        setSource('supabase')
        setStatus('ready')
        setInviteNotFound(false)
        return
      }
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
    setData(withDefaultInviteShowcase(mergeInvitePayload(row.payload), inviteSlug, row.payload))
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
