import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useTelarStore } from './context'
import { getNodeValue, setNodeValue, subscribeToNode, getDefaultValue } from '../core/store'
import type {
  KnotDef,
  ThreadDef,
  BindDef,
  AnyNode,
  Reducers,
  Dispatch,
  SetterOrUpdater,
} from '../core/types'

// ─── Overloads ────────────────────────────────────────────────────────────────

export function useTelar<T>(def: KnotDef<T>): [T, (next: SetterOrUpdater<T>) => void]
export function useTelar<T>(def: ThreadDef<T>): T
export function useTelar<T, R extends Reducers<T>>(def: BindDef<T, R>): [T, Dispatch<T, R>]

// ─── Implementación ───────────────────────────────────────────────────────────

export function useTelar<T>(def: AnyNode<T>): any {
  const store = useTelarStore()

  // Todos los hooks se llaman incondicionalmente — sin violación de Rules of Hooks
  const value = useSyncExternalStore(
    (notify) => subscribeToNode(def.key, notify, store),
    () => getNodeValue(def, store),
    () => getDefaultValue(def),
  )

  const defaultValue = def._brand !== 'thread' ? def.default : (undefined as T)

  const setter = useCallback(
    (next: SetterOrUpdater<T>) => setNodeValue(def.key, next, store, defaultValue),
    [def.key, store, defaultValue],
  )

  const dispatch = useMemo(() => {
    if (def._brand !== 'bind') return null
    const result: any = {}
    for (const actionKey of Object.keys(def.reducers)) {
      result[actionKey] = (...args: any[]) => {
        setNodeValue<T>(
          def.key,
          (state) => (def as BindDef<T, any>).reducers[actionKey](state, ...args),
          store,
          (def as BindDef<T, any>).default,
        )
      }
    }
    return result
  }, [def, store])

  if (def._brand === 'thread') return value
  if (def._brand === 'bind') return [value, dispatch]
  return [value, setter]
}
