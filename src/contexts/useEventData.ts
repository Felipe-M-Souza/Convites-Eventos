import { useContext } from 'react'
import { EventDataContext, type EventDataContextValue } from './eventDataContext'

export function useEventData(): EventDataContextValue {
  const ctx = useContext(EventDataContext)
  if (!ctx) throw new Error('useEventData deve ser usado dentro de EventDataProvider')
  return ctx
}
