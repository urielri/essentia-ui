import { useCallback, useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, setNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type { KnotDef, SetterOrUpdater } from '../core/types'

export function useKnot<T>(
  def: KnotDef<T>,
): [T, (next: SetterOrUpdater<T>) => void] {
  const store = useTelarStore()

  const value = useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),
    () => getNodeValue(def, store),
    () => getDefaultValue(def),
  )

  const setter = useCallback(
    (next: SetterOrUpdater<T>) => setNodeValue(def.key, next, store, def.default),
    [def.key, store, def.default],
  )

  return [value, setter]
}
