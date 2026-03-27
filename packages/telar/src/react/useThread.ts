import { useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type { ThreadDef } from '../core/types'

export function useThread<T>(def: ThreadDef<T>): T {
  const store = useTelarStore()

  return useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),
    () => getNodeValue(def, store),
    () => getDefaultValue(def),
  )
}
